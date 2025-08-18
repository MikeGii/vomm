// src/services/EquipmentMigration.ts - COMPLETE FILE

import { collection, getDocs, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { ALL_EQUIPMENT } from '../data/equipment';

// Track migration version
const MIGRATION_VERSION = 'equipment_stats_v1';

export interface MigrationRecord {
    userId: string;
    migrationId: string;
    completedAt: Date;
    changes: {
        equipmentUpdated: number;
        inventoryUpdated: number;
    };
}

// Check if a user has already been migrated
const hasBeenMigrated = async (userId: string): Promise<boolean> => {
    const migrationRef = doc(firestore, 'migrations', `${userId}_${MIGRATION_VERSION}`);
    const migrationDoc = await getDoc(migrationRef);
    return migrationDoc.exists();
};

// Record that migration was completed
const recordMigration = async (userId: string, changes: any) => {
    const migrationRef = doc(firestore, 'migrations', `${userId}_${MIGRATION_VERSION}`);
    await setDoc(migrationRef, {
        userId,
        migrationId: MIGRATION_VERSION,
        completedAt: new Date(),
        changes
    });
};

// Helper function to find matching equipment template
const findEquipmentTemplate = (itemId: string) => {
    // First try exact match
    let template = ALL_EQUIPMENT.find(e => e.id === itemId);

    if (!template) {
        // Remove any timestamp or random suffixes to get base ID
        const baseId = itemId.split('_').slice(0, -2).join('_') || itemId;
        template = ALL_EQUIPMENT.find(e => e.id === baseId);
    }

    if (!template) {
        // Try partial match for uniform items
        const uniformKeywords = ['kadett', 'police', 'abipolitseinik'];
        for (const keyword of uniformKeywords) {
            if (itemId.includes(keyword)) {
                template = ALL_EQUIPMENT.find(e =>
                    e.id.includes(keyword) &&
                    itemId.includes(e.id.split('_')[1])
                );
                if (template) break;
            }
        }
    }

    return template;
};

// Migrate a single user's equipment
export const migrateUserEquipment = async (userId: string): Promise<any> => {
    try {
        // Check if already migrated
        if (await hasBeenMigrated(userId)) {
            return {
                success: true,
                message: 'User already migrated',
                alreadyMigrated: true
            };
        }

        const playerStatsRef = doc(firestore, 'playerStats', userId);
        const playerDoc = await getDoc(playerStatsRef);

        if (!playerDoc.exists()) {
            return {
                success: false,
                message: 'Player stats not found'
            };
        }

        const data = playerDoc.data();
        const currentEquipment = data.equipment || {};
        const currentInventory = data.inventory || [];
        const completedCourses = data.completedCourses || [];

        // Track changes
        let equipmentItemsUpdated = 0;
        let inventoryItemsUpdated = 0;
        let itemsGranted = 0;

        // Update equipped items
        const updatedEquipment = { ...currentEquipment };

        Object.keys(updatedEquipment).forEach(slot => {
            const item = updatedEquipment[slot];
            if (item) {
                const template = findEquipmentTemplate(item.id);

                if (template) {
                    let updated = false;
                    if (!item.stats && template.stats) {
                        item.stats = template.stats;
                        updated = true;
                    }
                    if (!item.shopPrice && template.shopPrice) {
                        item.shopPrice = template.shopPrice;
                        updated = true;
                    }
                    if (updated) equipmentItemsUpdated++;
                }
            }
        });

        // Update inventory items
        let updatedInventory = currentInventory.map((item: any) => {
            if (item.category === 'equipment' || item.equipmentSlot) {
                const template = findEquipmentTemplate(item.id);

                if (template) {
                    let updated = false;
                    const updates: any = {};

                    if (!item.stats && template.stats) {
                        updates.stats = template.stats;
                        updated = true;
                    }
                    if (!item.shopPrice && template.shopPrice) {
                        updates.shopPrice = template.shopPrice;
                        updated = true;
                    }
                    if (!item.equipmentSlot && template.slot) {
                        updates.equipmentSlot = template.slot;
                        updated = true;
                    }

                    if (updated) inventoryItemsUpdated++;
                    return { ...item, ...updates };
                }
            }
            return item;
        });

        // Check for missing equipment from completed courses
        const COURSE_EQUIPMENT_REWARDS: { [key: string]: string[] } = {
            'basic_police_training_abipolitseinik': [
                'abipolitseinik_cap',
                'abipolitseinik_jacket',
                'abipolitseinik_pants',
                'abipolitseinik_gloves',
                'abipolitseinik_belt',
                'basic_weapon_holster',
                'abipolitseinik_boots'
            ],
            'sisekaitseakadeemia_entrance': [
                'kadett_cap',
                'police_jacket',
                'police_pants',
                'police_belt',
                'police_weapon_holster',
                'police_boots',
                'police_gloves'
            ]
        };

        // Grant missing equipment from completed courses
        const newItems: any[] = [];

        completedCourses.forEach((courseId: string) => {
            const equipmentRewards = COURSE_EQUIPMENT_REWARDS[courseId];
            if (equipmentRewards) {
                equipmentRewards.forEach(equipmentId => {
                    // Check if user already has this equipment
                    const hasItem = updatedInventory.some((item: any) =>
                        item.id.includes(equipmentId)
                    ) || Object.values(updatedEquipment).some((item: any) =>
                        item?.id.includes(equipmentId)
                    );

                    if (!hasItem) {
                        const template = ALL_EQUIPMENT.find(e => e.id === equipmentId);
                        if (template) {
                            const newItem = {
                                id: `${equipmentId}_${Date.now()}_${Math.random()}`,
                                name: template.name,
                                description: template.description,
                                category: 'equipment',
                                quantity: 1,
                                shopPrice: template.shopPrice,
                                stats: template.stats,
                                equipped: false,
                                equipmentSlot: template.slot,
                                source: 'migration'
                            };
                            newItems.push(newItem);
                            itemsGranted++;
                        }
                    }
                });
            }
        });

        // Add new items to inventory
        if (newItems.length > 0) {
            updatedInventory = [...updatedInventory, ...newItems];
        }

        // Apply updates
        const updateData: any = {};
        if (equipmentItemsUpdated > 0 || Object.keys(updatedEquipment).length > 0) {
            updateData.equipment = updatedEquipment;
        }
        if (inventoryItemsUpdated > 0 || itemsGranted > 0) {
            updateData.inventory = updatedInventory;
        }

        if (Object.keys(updateData).length > 0) {
            await updateDoc(playerStatsRef, updateData);
        }

        // Record migration
        await recordMigration(userId, {
            equipmentUpdated: equipmentItemsUpdated,
            inventoryUpdated: inventoryItemsUpdated,
            itemsGranted
        });

        return {
            success: true,
            message: `Migration complete! Updated ${equipmentItemsUpdated} equipped items, ${inventoryItemsUpdated} inventory items, granted ${itemsGranted} missing items`,
            equipmentUpdated: equipmentItemsUpdated,
            inventoryUpdated: inventoryItemsUpdated,
            itemsGranted
        };

    } catch (error) {
        console.error('Migration error for user', userId, error);
        return {
            success: false,
            message: 'Migration failed',
            error
        };
    }
};

// Migrate all users (run this as admin or in a cloud function)
export const migrateAllUsers = async () => {
    try {
        const results = {
            total: 0,
            migrated: 0,
            alreadyMigrated: 0,
            failed: 0,
            errors: [] as any[]
        };

        // Get all player stats
        const playerStatsCollection = collection(firestore, 'playerStats');
        const snapshot = await getDocs(playerStatsCollection);

        results.total = snapshot.size;

        // Process each user
        for (const doc of snapshot.docs) {
            const userId = doc.id;
            const result = await migrateUserEquipment(userId);

            if (result.success) {
                if (result.alreadyMigrated) {
                    results.alreadyMigrated++;
                } else {
                    results.migrated++;
                }
            } else {
                results.failed++;
                results.errors.push({ userId, error: result.message });
            }
        }

        console.log('Migration complete:', results);
        return results;

    } catch (error) {
        console.error('Failed to migrate all users:', error);
        throw error;
    }
};

// Auto-migrate on user login (add this to your auth flow)
export const checkAndMigrateUser = async (userId: string) => {
    try {
        const result = await migrateUserEquipment(userId);
        if (result.success && !result.alreadyMigrated) {
            console.log(`User ${userId} migrated successfully:`, result.message);
        }
    } catch (error) {
        console.error(`Failed to migrate user ${userId}:`, error);
    }
};