// src/utils/dragRacePhysics.ts - PHYSICS BASED VERSION
import { PlayerStats } from '../types';
import { CarStats } from '../types/vehicles';
import { RACING_CONSTANTS, DragRaceDistance, PhysicsBreakdown } from '../types/dragRace';

export interface RaceConditions {
    distance: DragRaceDistance;
    playerStats: PlayerStats;
    carStats: CarStats;
}

export class DragRacePhysics {

    /**
     * Physics-based race time calculation without baseTime
     */
    static calculateRaceTime(conditions: RaceConditions): { time: number; breakdown: PhysicsBreakdown } {
        const { distance, playerStats, carStats } = conditions;
        const { power, mass, acceleration, grip } = carStats;

        // Distance in meters
        const distanceM = distance === '0.5' ? 804.7 : 1609.3; // 0.5 mile = 805m, 1 mile = 1609m

        // 1. Calculate theoretical acceleration from 0-100km/h time
        const theoretical_a = 27.78 / acceleration; // m/s² (100km/h = 27.78m/s)

        // 2. Launch phase impact (first phase, grip critical)
        const launchGripMultiplier = Math.pow(grip, 1.5); // Grip has major impact on launch
        const effective_launch_a = theoretical_a * launchGripMultiplier;

        // 3. Power phase calculation (sustained acceleration)
        const powerToWeight = power / mass; // kW/kg
        const powerMultiplier = 0.8 + (powerToWeight * 0.3); // Base + power bonus

        // 4. Calculate base time using physics: t = sqrt(2s/a)
        const basePhysicsTime = Math.sqrt(2 * distanceM / effective_launch_a);

        // 5. Apply power adjustment for sustained performance
        const powerAdjustedTime = basePhysicsTime / powerMultiplier;

        // 6. Player skills multiplier
        const skillsMultiplier = this.calculateDrivingSkillsMultiplier(playerStats, distance);
        const skillsAdjustedTime = powerAdjustedTime * skillsMultiplier;

        // 7. Luck factor
        const luckFactor = this.calculateLuck();
        const finalTime = skillsAdjustedTime * (1 + luckFactor);

        // 8. Ensure realistic minimums
        const minTime = distance === '0.5' ? 10.0 : 18.0;
        const raceTime = Math.max(finalTime, minTime);

        return {
            time: Math.round(raceTime * 1000) / 1000,
            breakdown: {
                carPerformance: basePhysicsTime - powerAdjustedTime,
                drivingSkills: skillsAdjustedTime - powerAdjustedTime,
                luck: finalTime - skillsAdjustedTime
            }
        };
    }

    /**
     * Calculate driving skills as time multiplier
     */
    static calculateDrivingSkillsMultiplier(playerStats: PlayerStats, distance: DragRaceDistance): number {
        const handling = playerStats.attributes?.handling?.level || 1;
        const reactionTime = playerStats.attributes?.reactionTime?.level || 1;
        const gearShifting = playerStats.attributes?.gearShifting?.level || 1;

        // Skills create multiplier (0.90 to 1.05 range for realistic impact)
        const skillScore = distance === '0.5'
            ? (reactionTime * 0.5 + handling * 0.3 + gearShifting * 0.2)
            : (handling * 0.4 + gearShifting * 0.4 + reactionTime * 0.2);

        // Convert to multiplier: level 50 = neutral (1.0), higher levels = better (lower time)
        return Math.max(0.90, Math.min(1.05, 1 - ((skillScore - 50) * 0.002)));
    }

    /**
     * Calculate luck component as percentage modifier
     */
    static calculateLuck(): number {
        return (Math.random() - 0.5) * 2 * RACING_CONSTANTS.LUCK_VARIANCE;
    }

    /**
     * Format time for display
     */
    static formatTime(seconds: number): string {
        return `${seconds.toFixed(3)}s`;
    }

    /**
     * Calculate time difference for comparisons
     */
    static getTimeDifference(time1: number, time2: number): string {
        const diff = Math.abs(time1 - time2);
        const sign = time1 < time2 ? '-' : '+';
        return `${sign}${diff.toFixed(3)}s`;
    }
}