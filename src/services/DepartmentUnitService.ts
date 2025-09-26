// src/services/DepartmentUnitService.ts
import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs,
    increment,
    arrayUnion,
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
    getUpgradeInfo,
    UPGRADE_CONFIGS
} from '../types/departmentUnit';

const COLLECTION_NAME = 'departmentUnits';
const MAX_RECENT_TRANSACTIONS = 50;

export class DepartmentUnitService {

    /**
     * Get or create department unit document
     */
    static async getOrCreateUnit(
        department: string,
        unitId: string,
        unitName: string
    ): Promise<DepartmentUnitData> {
        const docId = `${department}_${unitId}`;
        const docRef = doc(firestore, COLLECTION_NAME, docId);

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docId, ...docSnap.data() } as DepartmentUnitData;
        }

        // Create new unit with default values
        const newUnit: DepartmentUnitData = {
            id: docId,
            department,
            unitId,
            unitName,

            // Leadership
            unitLeader: {
                username: null,
                userId: null,
                appointedAt: null
            },
            groupLeaders: [],
            maxGroupLeaders: 4,
            maxUnitLeaders: 1,

            // Initialize wallet with all upgrades at level 0
            wallet: {
                balance: 0,
                totalDeposited: 0,
                totalSpent: 0,
                lastUpdated: Timestamp.now(),
                upgrades: UPGRADE_CONFIGS.map(config => ({
                    type: config.type,
                    level: 0,
                    baseCost: config.baseCost
                })),
                recentTransactions: []
            },

            // Metadata
            createdAt: Timestamp.now(),
            lastUpdated: Timestamp.now()
        };

        await setDoc(docRef, newUnit);
        return newUnit;
    }

    /**
     * Get department unit by ID
     */
    static async getUnit(department: string, unitId: string): Promise<DepartmentUnitData | null> {
        const docId = `${department}_${unitId}`;
        const docRef = doc(firestore, COLLECTION_NAME, docId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        return { id: docId, ...docSnap.data() } as DepartmentUnitData;
    }

    /**
     * Get all units for a department
     */
    static async getDepartmentUnits(department: string): Promise<DepartmentUnitData[]> {
        const q = query(
            collection(firestore, COLLECTION_NAME),
            where('department', '==', department)
        );

        const querySnapshot = await getDocs(q);
        const units: DepartmentUnitData[] = [];

        querySnapshot.forEach((doc) => {
            units.push({ id: doc.id, ...doc.data() } as DepartmentUnitData);
        });

        return units;
    }

    /**
     * Update unit leader
     */
    static async updateUnitLeader(
        department: string,
        unitId: string,
        leader: UnitLeader
    ): Promise<void> {
        const docId = `${department}_${unitId}`;
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
            return false; // Max group leaders reached
        }

        const docId = `${department}_${unitId}`;
        const docRef = doc(firestore, COLLECTION_NAME, docId);

        await updateDoc(docRef, {
            groupLeaders: arrayUnion(leader),
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

        const updatedLeaders = unit.groupLeaders.filter(
            leader => leader.userId !== userId
        );

        const docId = `${department}_${unitId}`;
        const docRef = doc(firestore, COLLECTION_NAME, docId);

        await updateDoc(docRef, {
            groupLeaders: updatedLeaders,
            lastUpdated: Timestamp.now()
        });
    }

    /**
     * Process donation to unit wallet
     */
    static async processDonation(
        department: string,
        unitId: string,
        donation: DonationData
    ): Promise<void> {
        const docId = `${department}_${unitId}`;
        const docRef = doc(firestore, COLLECTION_NAME, docId);

        await runTransaction(firestore, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists()) {
                throw new Error('Üksust ei leitud');
            }

            const unit = docSnap.data() as DepartmentUnitData;

            // Get and update the player's money
            const playerRef = doc(firestore, 'playerStats', donation.donorId);
            const playerDoc = await transaction.get(playerRef);

            if (!playerDoc.exists()) {
                throw new Error('Mängija andmed puuduvad');
            }

            const playerData = playerDoc.data();
            const currentMoney = playerData.money || 0;

            if (currentMoney < donation.amount) {
                throw new Error('Ebapiisav saldo');
            }

            // Create transaction record
            const walletTransaction: WalletTransaction = {
                type: 'donation',
                amount: donation.amount,
                userId: donation.donorId,
                username: donation.donorUsername,
                description: `Annetus ${donation.donorPosition} poolt`,
                timestamp: Timestamp.now()
            };

            // Update recent transactions (keep only last 50)
            const recentTransactions = [
                walletTransaction,
                ...(unit.wallet.recentTransactions || [])
            ].slice(0, MAX_RECENT_TRANSACTIONS);

            // Update wallet
            transaction.update(docRef, {
                'wallet.balance': increment(donation.amount),
                'wallet.totalDeposited': increment(donation.amount),
                'wallet.lastUpdated': Timestamp.now(),
                'wallet.recentTransactions': recentTransactions,
                lastUpdated: Timestamp.now()
            });

            // DEDUCT money from player
            transaction.update(playerRef, {
                money: increment(-donation.amount)
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
        const docId = `${department}_${unitId}`;
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

        // Get bonus percentages based on level
        const workXpBonus = workXpUpgrade?.level
            ? [5, 10, 15, 20][workXpUpgrade.level - 1] || 0
            : 0;

        const salaryBonus = salaryUpgrade?.level
            ? [5, 10, 15, 20][salaryUpgrade.level - 1] || 0
            : 0;

        return { workXpBonus, salaryBonus };
    }

    /**
     * Helper to get unit name
     */
    private static getUnitName(unitId: string): string {
        const unitNames: Record<string, string> = {
            'patrol': 'Patrullitalitus',
            'procedural_service': 'Menetlustalitus',
            'emergency_response': 'Kiirreageerimisüksus',
            'k9_unit': 'K9 Üksus',
            'cyber_crime': 'Küberkuritegevus',
            'crime_unit': 'Kuritegude Talitus'
        };
        return unitNames[unitId] || unitId;
    }

    // Add to DepartmentUnitService.ts
    static async handlePositionChange(
        userId: string,
        username: string,
        oldPosition: string | null,
        newPosition: string | null,
        oldDepartment: string | null,
        newDepartment: string | null,
        oldUnit: string | null,
        newUnit: string | null
    ): Promise<void> {
        // Remove from old position
        if (oldPosition && oldDepartment && oldUnit) {
            if (oldPosition.startsWith('grupijuht_')) {
                await this.removeGroupLeader(oldDepartment, oldUnit, userId);
            } else if (oldPosition.startsWith('talituse_juht_')) {
                await this.updateUnitLeader(oldDepartment, oldUnit, {
                    username: null,
                    userId: null,
                    appointedAt: null
                });
            }
        }

        // Add to new position
        if (newPosition && newDepartment && newUnit) {
            if (newPosition.startsWith('grupijuht_')) {
                await this.addGroupLeader(newDepartment, newUnit, {
                    username,
                    userId,
                    appointedAt: Timestamp.now()
                });
            } else if (newPosition.startsWith('talituse_juht_')) {
                await this.updateUnitLeader(newDepartment, newUnit, {
                    username,
                    userId,
                    appointedAt: Timestamp.now()
                });
            }
        }
    }
}