// src/services/VehicleDataMigration.ts
import {
    createVehicleBrand,
    createVehicleEngine,
    createVehicleModel,
    getAllVehicleBrands,
    getAllVehicleEngines,
    getAllVehicleModels
} from './VehicleDatabaseService';

// Fix the import paths - check your actual file structure
import { ALL_CAR_MODELS } from '../data/vehicles/index';
import { ENGINES } from '../data/vehicles/engines'; // Use ENGINES instead of ALL_ENGINES

export interface MigrationResult {
    success: boolean;
    brandsCreated: number;
    enginesCreated: number;
    modelsCreated: number;
    errors: string[];
    skippedDuplicates: {
        brands: number;
        engines: number;
        models: number;
    };
}

export const migrateVehicleData = async (adminUserId: string): Promise<MigrationResult> => {
    const result: MigrationResult = {
        success: false,
        brandsCreated: 0,
        enginesCreated: 0,
        modelsCreated: 0,
        errors: [],
        skippedDuplicates: {
            brands: 0,
            engines: 0,
            models: 0
        }
    };

    try {
        console.log('🔍 Starting vehicle data migration...');

        // Step 1: Get existing data from database to avoid duplicates
        const [existingBrands, existingEngines, existingModels] = await Promise.all([
            getAllVehicleBrands().catch(() => []), // Handle if collections don't exist yet
            getAllVehicleEngines().catch(() => []),
            getAllVehicleModels().catch(() => [])
        ]);

        const existingBrandNames = new Set(existingBrands.map(b => b.name));
        const existingEngineCodes = new Set(existingEngines.map(e => e.code));
        const existingModelKeys = new Set(existingModels.map(m => `${m.brandName}_${m.model}`));

        console.log(`Found existing: ${existingBrands.length} brands, ${existingEngines.length} engines, ${existingModels.length} models`);

        // Step 2: Extract and create brands
        console.log('🏭 Migrating brands...');
        const uniqueBrands = [...new Set(ALL_CAR_MODELS.map(model => model.brand))];
        console.log(`Found ${uniqueBrands.length} unique brands to process`);

        const brandIdMap = new Map<string, string>(); // brandName -> brandId

        // First, map existing brands
        for (const brand of existingBrands) {
            brandIdMap.set(brand.name, brand.id);
        }

        for (const brandName of uniqueBrands) {
            if (existingBrandNames.has(brandName)) {
                result.skippedDuplicates.brands++;
                continue;
            }

            try {
                const brandId = await createVehicleBrand({ name: brandName }, adminUserId);
                brandIdMap.set(brandName, brandId);
                result.brandsCreated++;
                console.log(`✅ Created brand: ${brandName}`);
            } catch (error: any) {
                const errorMsg = `Failed to create brand ${brandName}: ${error.message}`;
                result.errors.push(errorMsg);
                console.error(errorMsg);
            }
        }

        // Step 3: Create engines
        console.log('🔧 Migrating engines...');
        const engineIdMap = new Map<string, string>(); // engineCode -> engineId

        // First, map existing engines
        for (const engine of existingEngines) {
            engineIdMap.set(engine.code, engine.id);
        }

        const engineEntries = Object.entries(ENGINES);
        console.log(`Found ${engineEntries.length} engines to process`);

        for (const [engineCode, engineData] of engineEntries) {
            if (existingEngineCodes.has(engineCode)) {
                result.skippedDuplicates.engines++;
                continue;
            }

            try {
                const engineId = await createVehicleEngine({
                    code: engineCode,
                    brandName: engineData.brand,
                    basePower: engineData.basePower
                }, adminUserId);
                engineIdMap.set(engineCode, engineId);
                result.enginesCreated++;
                console.log(`✅ Created engine: ${engineCode} (${engineData.basePower}HP)`);
            } catch (error: any) {
                const errorMsg = `Failed to create engine ${engineCode}: ${error.message}`;
                result.errors.push(errorMsg);
                console.error(errorMsg);
            }
        }

        // Step 4: Create models
        console.log('🚗 Migrating models...');
        console.log(`Found ${ALL_CAR_MODELS.length} models to process`);

        for (const model of ALL_CAR_MODELS) {
            const modelKey = `${model.brand}_${model.model}`;

            if (existingModelKeys.has(modelKey)) {
                result.skippedDuplicates.models++;
                continue;
            }

            const brandId = brandIdMap.get(model.brand);
            if (!brandId) {
                const errorMsg = `Brand ID not found for model: ${model.brand} ${model.model}`;
                result.errors.push(errorMsg);
                console.error(errorMsg);
                continue;
            }

            const defaultEngineId = engineIdMap.get(model.defaultEngine);
            if (!defaultEngineId) {
                const errorMsg = `Default engine ID not found for model: ${model.brand} ${model.model} (${model.defaultEngine})`;
                result.errors.push(errorMsg);
                console.error(errorMsg);
                continue;
            }

            // Map compatible engine codes to IDs
            const compatibleEngineIds: string[] = [];
            for (const engineCode of model.compatibleEngines) {
                const engineId = engineIdMap.get(engineCode);
                if (engineId) {
                    compatibleEngineIds.push(engineId);
                } else {
                    console.warn(`Compatible engine ID not found: ${engineCode} for model ${model.brand} ${model.model}`);
                }
            }

            try {
                await createVehicleModel({
                    brandId,
                    model: model.model,
                    mass: model.mass,
                    basePrice: model.basePrice,
                    defaultEngineId,
                    compatibleEngineIds,
                }, adminUserId);
                result.modelsCreated++;
                console.log(`✅ Created model: ${model.brand} ${model.model}`);
            } catch (error: any) {
                const errorMsg = `Failed to create model ${model.brand} ${model.model}: ${error.message}`;
                result.errors.push(errorMsg);
                console.error(errorMsg);
            }
        }

        // Migration completed
        result.success = result.errors.length < 10 && // Allow some minor errors
            (result.brandsCreated > 0 || result.enginesCreated > 0 || result.modelsCreated > 0 ||
                result.skippedDuplicates.brands > 0 || result.skippedDuplicates.engines > 0 || result.skippedDuplicates.models > 0);

        console.log('🎉 Migration completed!', result);
        return result;

    } catch (error: any) {
        const errorMsg = `Migration failed: ${error.message}`;
        result.errors.push(errorMsg);
        console.error(errorMsg, error);
        return result;
    }
};

// Simplified validation function
export const validateMigration = async () => {
    try {
        const [brands, engines, models] = await Promise.all([
            getAllVehicleBrands().catch(() => []),
            getAllVehicleEngines().catch(() => []),
            getAllVehicleModels().catch(() => [])
        ]);

        const issues: string[] = [];

        // Basic validation - check if we have data
        if (brands.length === 0) {
            issues.push('No vehicle brands found in database');
        }
        if (engines.length === 0) {
            issues.push('No vehicle engines found in database');
        }
        if (models.length === 0) {
            issues.push('No vehicle models found in database');
        }

        // Check for orphaned models (basic check)
        const brandIds = new Set(brands.map(b => b.id));
        const engineIds = new Set(engines.map(e => e.id));

        for (const model of models) {
            if (!brandIds.has(model.brandId)) {
                issues.push(`Model "${model.brandName} ${model.model}" references non-existent brand`);
            }
            if (!engineIds.has(model.defaultEngineId)) {
                issues.push(`Model "${model.brandName} ${model.model}" references non-existent default engine`);
            }
        }

        return {
            isValid: issues.length === 0,
            issues: issues.slice(0, 10), // Limit to first 10 issues
            summary: {
                totalBrands: brands.length,
                totalEngines: engines.length,
                totalModels: models.length
            }
        };
    } catch (error: any) {
        return {
            isValid: false,
            issues: [`Validation failed: ${error.message}`],
            summary: { totalBrands: 0, totalEngines: 0, totalModels: 0 }
        };
    }
};