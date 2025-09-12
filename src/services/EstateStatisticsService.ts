// src/services/EstateStatisticsService.ts
import {
    collection,
    getDocs
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { DatabaseEstate } from '../types/estateDatabase';

export interface EstateStatistics {
    overview: {
        totalEstates: number;
        activeEstates: number;
        inactiveEstates: number;
        averagePrice: number;
    };
    playerData: {
        totalPlayersWithEstates: number;
        totalPlayersWithoutEstates: number;
        playerEstateDistribution: Array<{
            estateName: string;
            estateId: string;
            playerCount: number;
            percentage: number;
        }>;
    };
    popularEstates: Array<{
        estateId: string;
        estateName: string;
        ownerCount: number;
        averagePrice: number;
    }>;
    financialData: {
        totalMarketValue: number;
        averageTransactionValue: number;
    };
    estateFeatures: {
        withGarage: number;
        withWorkshop: number;
        withoutFeatures: number;
        garageCapacityDistribution: Array<{ capacity: number; count: number }>;
        kitchenSizeDistribution: Array<{ size: string; count: number }>;
    };
}

export const getComprehensiveEstateStatistics = async (): Promise<EstateStatistics> => {
    try {
        // Get all estates
        const estatesSnapshot = await getDocs(collection(firestore, 'estates'));
        const estates = estatesSnapshot.docs.map(doc => ({
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
            updatedAt: doc.data().updatedAt.toDate(),
        } as DatabaseEstate));

        // Get all player estates
        const playerEstatesSnapshot = await getDocs(collection(firestore, 'playerEstates'));
        const playerEstates = playerEstatesSnapshot.docs.map(doc => doc.data());

        // Calculate overview statistics
        const activeEstates = estates.filter(e => e.isActive);
        const prices = estates.map(e => e.price);

        const overview = {
            totalEstates: estates.length,
            activeEstates: activeEstates.length,
            inactiveEstates: estates.length - activeEstates.length,
            averagePrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0
        };

        // Calculate player data
        const playersWithEstates = playerEstates.filter(pe => pe.currentEstate);
        const playersWithoutEstates = playerEstates.filter(pe => !pe.currentEstate);

        // Estate distribution among players
        const estateDistribution = new Map<string, number>();
        playersWithEstates.forEach(pe => {
            if (pe.currentEstate?.id) {
                const count = estateDistribution.get(pe.currentEstate.id) || 0;
                estateDistribution.set(pe.currentEstate.id, count + 1);
            }
        });

        const playerEstateDistribution = Array.from(estateDistribution.entries()).map(([estateId, count]) => {
            const estate = estates.find(e => e.id === estateId);
            return {
                estateName: estate?.name || estateId,
                estateId,
                playerCount: count,
                percentage: Math.round((count / playersWithEstates.length) * 100)
            };
        }).sort((a, b) => b.playerCount - a.playerCount);

        const playerData = {
            totalPlayersWithEstates: playersWithEstates.length,
            totalPlayersWithoutEstates: playersWithoutEstates.length,
            playerEstateDistribution
        };

        // Popular estates
        const popularEstates = playerEstateDistribution.map(item => {
            const estate = estates.find(e => e.id === item.estateId);

            return {
                estateId: item.estateId,
                estateName: item.estateName,
                ownerCount: item.playerCount,
                averagePrice: estate?.price || 0
            };
        }).sort((a, b) => b.ownerCount - a.ownerCount);

        // Financial data
        const totalMarketValue = estates.reduce((sum, estate) => sum + estate.price, 0);
        const averageTransactionValue = playersWithEstates.length > 0
            ? Math.round(totalMarketValue / estates.length)
            : 0;

        const financialData = {
            totalMarketValue,
            averageTransactionValue
        };

        // Estate features analysis
        const withGarage = estates.filter(e => e.hasGarage).length;
        const withWorkshop = estates.filter(e => e.hasWorkshop).length;
        const withoutFeatures = estates.filter(e => !e.hasGarage && !e.hasWorkshop).length;

        // Garage capacity distribution
        const garageCapacities = estates.filter(e => e.hasGarage).map(e => e.garageCapacity);
        const garageCapacityMap = new Map<number, number>();
        garageCapacities.forEach(capacity => {
            garageCapacityMap.set(capacity, (garageCapacityMap.get(capacity) || 0) + 1);
        });
        const garageCapacityDistribution = Array.from(garageCapacityMap.entries())
            .map(([capacity, count]) => ({ capacity, count }))
            .sort((a, b) => a.capacity - b.capacity);

        // Kitchen size distribution
        const kitchenSizes = estates.map(e => e.kitchenSpace);
        const kitchenSizeMap = new Map<string, number>();
        kitchenSizes.forEach(size => {
            kitchenSizeMap.set(size, (kitchenSizeMap.get(size) || 0) + 1);
        });
        const kitchenSizeDistribution = Array.from(kitchenSizeMap.entries())
            .map(([size, count]) => ({ size, count }));

        const estateFeatures = {
            withGarage,
            withWorkshop,
            withoutFeatures,
            garageCapacityDistribution,
            kitchenSizeDistribution
        };

        return {
            overview,
            playerData,
            popularEstates,
            financialData,
            estateFeatures
        };

    } catch (error) {
        console.error('Error getting comprehensive estate statistics:', error);
        throw error;
    }
};