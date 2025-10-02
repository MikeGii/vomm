// src/services/DepartmentUnitService.ts
import {
    doc,
    getDoc,
    updateDoc,
    increment,
    Timestamp,
    runTransaction,
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import {
    DepartmentUnitData,
    WalletTransaction,
    UnitLeader,
    GroupLeader,
    DonationData,
    UpgradeType,
    calculateUpgradeCost,
    getUpgradeInfo, getBonusForLevel,
} from '../types/departmentUnit';
import { getCurrentServer, getServerSpecificId } from '../utils/serverUtils';

const COLLECTION_NAME = 'departmentUnits';
const MAX_RECENT_TRANSACTIONS = 50;

export class DepartmentUnitService {

    /**
     * Get server-specific document ID for department unit
     */
    private static getDocumentId(department: string, unitId: string): string {
        const baseId = `${department}_${unitId}`;
        const currentServer = getCurrentServer();

        // Beta server uses original IDs (no suffix)
        if (currentServer === 'beta') {
            return baseId;
        }

        // Other servers use suffix
        return `${baseId}_${currentServer}`;
    }

    /**
     * Get department unit by ID
     */
    static async getUnit(department: string, unitId: string): Promise<DepartmentUnitData | null> {
        const docId = this.getDocumentId(department, unitId);
        const docRef = doc(firestore, COLLECTION_NAME, docId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        return { id: docId, ...docSnap.data() } as DepartmentUnitData;
    }

    /**
     * Update unit leader
     */
    static async updateUnitLeader(
        department: string,
        unitId: string,
        leader: UnitLeader
    ): Promise<void> {
        const docId = this.getDocumentId(department, unitId);
        const docRef = doc(firestore, COLLECTION_NAME, docId);

        await updateDoc(docRef, {
            unitLeader: leader,
            lastUpdated: Timestamp.now()
        });
    }

    /**
     * Add group leader
     */
    static async addGroupLeader(
        department: string,
        unitId: string,
        leader: GroupLeader
    ): Promise<boolean> {
        const unit = await this.getUnit(department, unitId);
        if (!unit) throw new Error('Üksust ei leitud');

        if (unit.groupLeaders.length >= unit.maxGroupLeaders) {
            return false; // Max leaders reached
        }

        const docId = this.getDocumentId(department, unitId);
        const docRef = doc(firestore, COLLECTION_NAME, docId);

        await updateDoc(docRef, {
            groupLeaders: [...unit.groupLeaders, leader],
            lastUpdated: Timestamp.now()
        });

        return true;
    }

    /**
     * Remove group leader
     */
    static async removeGroupLeader(
        department: string,
        unitId: string,
        userId: string
    ): Promise<void> {
        const unit = await this.getUnit(department, unitId);
        if (!unit) throw new Error('Üksust ei leitud');

        const docId = this.getDocumentId(department, unitId);
        const docRef = doc(firestore, COLLECTION_NAME, docId);

        const updatedLeaders = unit.groupLeaders.filter(
            leader => leader.userId !== userId
        );

        await updateDoc(docRef, {
            groupLeaders: updatedLeaders,
            lastUpdated: Timestamp.now()
        });
    }

    /**
     * Process donation to unit wallet with server-specific player stats
     */
    static async processDonation(
        department: string,
        unitId: string,
        donation: DonationData
    ): Promise<void> {
        const docId = this.getDocumentId(department, unitId);
        const docRef = doc(firestore, COLLECTION_NAME, docId);

        // Get server-specific player document
        const playerDocId = getServerSpecificId(donation.donorId, getCurrentServer());
        const playerRef = doc(firestore, 'playerStats', playerDocId);

        return await runTransaction(firestore, async (transaction) => {
            // Check player has enough money
            const playerDoc = await transaction.get(playerRef);
            if (!playerDoc.exists()) {
                throw new Error('Mängija andmed ei ole saadaval');
            }

            const playerData = playerDoc.data();
            if (!playerData.money || playerData.money < donation.amount) {
                throw new Error('Ebapiisav raha');
            }

            // Get unit document
            const unitDoc = await transaction.get(docRef);
            if (!unitDoc.exists()) {
                throw new Error('Üksust ei leitud');
            }

            const unitData = unitDoc.data() as DepartmentUnitData;

            // Create transaction record
            const walletTransaction: WalletTransaction = {
                type: 'donation',
                amount: donation.amount,
                userId: donation.donorId,
                username: donation.donorUsername,
                description: `Annetus üksusele ${unitData.unitName}`,
                timestamp: Timestamp.now()
            };

            // Update recent transactions
            const recentTransactions = [
                walletTransaction,
                ...(unitData.wallet.recentTransactions || [])
            ].slice(0, MAX_RECENT_TRANSACTIONS);

            // Update player money
            transaction.update(playerRef, {
                money: increment(-donation.amount),
                lastModified: Timestamp.now()
            });

            // Update unit wallet
            transaction.update(docRef, {
                'wallet.balance': increment(donation.amount),
                'wallet.totalDeposited': increment(donation.amount),
                'wallet.lastUpdated': Timestamp.now(),
                'wallet.recentTransactions': recentTransactions,
                lastUpdated: Timestamp.now()
            });
        });
    }

    /**
     * Purchase upgrade for department unit
     */
    static async purchaseUpgrade(
        department: string,
        unitId: string,
        upgradeType: UpgradeType,
        purchasedBy: string,
        purchasedById: string
    ): Promise<boolean> {
        const docId = this.getDocumentId(department, unitId);
        const docRef = doc(firestore, COLLECTION_NAME, docId);

        return await runTransaction(firestore, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists()) {
                throw new Error('Üksust ei leitud');
            }

            const unit = docSnap.data() as DepartmentUnitData;
            const wallet = unit.wallet;

            // Find current upgrade
            const currentUpgrade = wallet.upgrades.find(u => u.type === upgradeType);
            if (!currentUpgrade) {
                throw new Error('Uuendust ei leitud');
            }

            // Check if max level reached
            const upgradeInfo = getUpgradeInfo(upgradeType);
            if (!upgradeInfo || currentUpgrade.level >= upgradeInfo.maxLevel) {
                throw new Error('Maksimaalne tase juba saavutatud');
            }

            // Calculate cost for next level
            const nextLevel = currentUpgrade.level + 1;
            const cost = calculateUpgradeCost(currentUpgrade.baseCost, nextLevel);

            // Check if enough balance
            if (wallet.balance < cost) {
                return false; // Not enough money
            }

            // Update upgrade
            const updatedUpgrades = wallet.upgrades.map(u =>
                u.type === upgradeType
                    ? { ...u, level: nextLevel, purchasedAt: Timestamp.now(), purchasedBy }
                    : u
            );

            // Create transaction record
            const walletTransaction: WalletTransaction = {
                type: 'upgrade_purchase',
                amount: -cost,
                userId: purchasedById,
                username: purchasedBy,
                description: `${upgradeInfo.name} tase ${nextLevel}`,
                timestamp: Timestamp.now()
            };

            // Update recent transactions
            const recentTransactions = [
                walletTransaction,
                ...(wallet.recentTransactions || [])
            ].slice(0, MAX_RECENT_TRANSACTIONS);

            // Update document
            transaction.update(docRef, {
                'wallet.balance': increment(-cost),
                'wallet.totalSpent': increment(cost),
                'wallet.upgrades': updatedUpgrades,
                'wallet.lastUpdated': Timestamp.now(),
                'wallet.recentTransactions': recentTransactions,
                lastUpdated: Timestamp.now()
            });

            return true;
        });
    }

    /**
     * Get unit's current bonuses from upgrades
     */
    static async getUnitBonuses(
        department: string,
        unitId: string
    ): Promise<{ workXpBonus: number; salaryBonus: number }> {
        const unit = await this.getUnit(department, unitId);
        if (!unit) return { workXpBonus: 0, salaryBonus: 0 };

        const workXpUpgrade = unit.wallet.upgrades.find(
            u => u.type === 'work_xp_bonus'
        );
        const salaryUpgrade = unit.wallet.upgrades.find(
            u => u.type === 'region_salary_bonus'
        );

        // Get bonus percentages based on level using the configuration
        const workXpBonus = workXpUpgrade?.level
            ? getBonusForLevel('work_xp_bonus', workXpUpgrade.level)
            : 0;

        const salaryBonus = salaryUpgrade?.level
            ? getBonusForLevel('region_salary_bonus', salaryUpgrade.level)
            : 0;

        return { workXpBonus, salaryBonus };
    }

    /**
     * Handle any position change - automatically cleans up old leadership roles
     * This should be called WHENEVER a player's position changes
     */
    static async handlePositionChange(
        userId: string,
        newPosition: string,
        newDepartmentUnit: string,
        department: string,
        username?: string
    ): Promise<void> {
        // First, clean up any existing leadership roles across ALL units
        // Using CORRECT unit IDs from policePositions.ts
        const units = ['patrol', 'procedural_service', 'emergency_response', 'k9_unit', 'cyber_crime', 'crime_unit'];

        for (const unitId of units) {
            try {
                const docId = this.getDocumentId(department, unitId);
                const docRef = doc(firestore, COLLECTION_NAME, docId);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) continue;

                const unitData = docSnap.data() as DepartmentUnitData;
                let needsUpdate = false;
                const updates: any = {};

                // Check and clear unit leader if it's this user
                if (unitData.unitLeader?.userId === userId) {
                    updates.unitLeader = {
                        username: null,
                        userId: null,
                        appointedAt: null
                    };
                    needsUpdate = true;
                    console.log(`Clearing ${username || userId} from unit leader of ${unitId}`);
                }

                // Check and remove from group leaders if present
                const filteredGroupLeaders = unitData.groupLeaders.filter(
                    leader => leader.userId !== userId
                );

                if (filteredGroupLeaders.length !== unitData.groupLeaders.length) {
                    updates.groupLeaders = filteredGroupLeaders;
                    needsUpdate = true;
                    console.log(`Removing ${username || userId} from group leaders of ${unitId}`);
                }

                // Apply updates if needed
                if (needsUpdate) {
                    updates.lastUpdated = Timestamp.now();
                    await updateDoc(docRef, updates);
                }
            } catch (error) {
                console.error(`Error cleaning leadership in ${unitId}:`, error);
                // Continue with other units even if one fails
            }
        }

        // Now update the player's position in playerStats
        const playerDocId = getServerSpecificId(userId, getCurrentServer());
        const playerRef = doc(firestore, 'playerStats', playerDocId);
        await updateDoc(playerRef, {
            policePosition: newPosition,
            departmentUnit: newDepartmentUnit
        });
    }

    /**
     * Simplified method for voluntary demotion or switching to lower positions
     */
    static async demoteToStandardWorker(
        userId: string,
        department: string,
        departmentUnit: string,
        username?: string
    ): Promise<void> {
        // Determine the base worker position for the unit
        const basePosition = this.getBasePositionForUnit(departmentUnit);

        // Use the main handler to clean everything up
        await this.handlePositionChange(
            userId,
            basePosition,
            departmentUnit,
            department,
            username
        );

        // Also add demotion tracking
        const playerDocId = getServerSpecificId(userId, getCurrentServer());
        const playerRef = doc(firestore, 'playerStats', playerDocId);
        await updateDoc(playerRef, {
            demotedAt: Timestamp.now(),
            demotionReason: 'Vabatahtlik/Käsitsi maha võetud'
        });
    }

    /**
     * Helper to get base position for a unit
     */
    private static getBasePositionForUnit(unitId: string): string {
        switch(unitId) {
            case 'patrol': return 'patrullpolitseinik';
            case 'procedural_service': return 'uurija';
            case 'emergency_response': return 'kiirreageerija';
            case 'k9_unit': return 'koerajuht';
            case 'cyber_crime': return 'küberkriminalist';
            case 'crime_unit': return 'jälitaja';
            default: return 'patrullpolitseinik';
        }
    }
}