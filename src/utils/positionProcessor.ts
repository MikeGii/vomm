// src/utils/positionProcessor.ts
import { PlayerStats } from '../types';
import { POLICE_POSITIONS } from '../data/policePositions';
import { getUnitById } from '../data/departmentUnits';
import { getCourseById } from '../data/courses';
import {
    getPositionDepartmentUnit,
    isGroupLeader
} from './playerStatus';
import { DepartmentUnitService } from '../services/DepartmentUnitService';

export interface PositionInfo {
    positionId: string;
    positionName: string;
    unitName: string;
    isGroupLeader: boolean;
    isUnitLeader?: boolean;
    canApply: boolean;
    canSwitch: boolean;
    requirements: string[];
    missingRequirements: string[];
    actionType: 'switch' | 'apply';
    isCurrentPosition: boolean;
    availabilityStatus?: string;
}

export class PositionProcessor {
    private playerStats: PlayerStats;
    private currentUnit: string | null;

    constructor(playerStats: PlayerStats) {
        this.playerStats = playerStats;
        this.currentUnit = getPositionDepartmentUnit(playerStats.policePosition);
    }

    async generateAllPositions(): Promise<PositionInfo[]> {
        if (!this.playerStats.department) {
            return [];
        }

        const availablePositions: PositionInfo[] = [];

        for (const position of POLICE_POSITIONS) {
            if (this.shouldSkipPosition(position.id)) {
                continue;
            }

            const unit = getUnitById(position.departmentUnit || '');
            if (!unit) continue;

            const positionInfo = await this.processPosition(position, unit);
            if (positionInfo) {
                availablePositions.push(positionInfo);
            }
        }

        return availablePositions;
    }

    private shouldSkipPosition(positionId: string): boolean {
        return ['abipolitseinik', 'kadett'].includes(positionId);
    }

    private async processPosition(position: any, unit: any): Promise<PositionInfo | null> {
        const isGroupLeaderPosition = position.id.startsWith('grupijuht_');
        const isUnitLeaderPosition = position.id.startsWith('talituse_juht_');

        const baseInfo = this.createBasePositionInfo(position, unit, isGroupLeaderPosition, isUnitLeaderPosition);

        if (isUnitLeaderPosition) {
            return await this.processUnitLeaderPosition(baseInfo, position);
        } else if (isGroupLeaderPosition) {
            return await this.processGroupLeaderPosition(baseInfo, position);
        } else {
            return this.processStandardPosition(baseInfo, position);
        }
    }

    private createBasePositionInfo(position: any, unit: any, isGroupLeader: boolean, isUnitLeader: boolean): PositionInfo {
        return {
            positionId: position.id,
            positionName: position.name,
            unitName: unit.name,
            isGroupLeader,
            isUnitLeader,
            canApply: false,
            canSwitch: false,
            requirements: [],
            missingRequirements: [],
            actionType: (isGroupLeader || isUnitLeader) ? 'apply' : 'switch',
            isCurrentPosition: this.playerStats.policePosition === position.id,
            availabilityStatus: undefined
        };
    }

    private async processUnitLeaderPosition(baseInfo: PositionInfo, position: any): Promise<PositionInfo> {
        this.processRequirements(baseInfo, position.requirements);

        // UPDATED: Use DepartmentUnitService instead of old functions
        const departmentUnit = await DepartmentUnitService.getUnit(
            this.playerStats.department || '',
            position.departmentUnit || ''
        );

        if (departmentUnit && departmentUnit.unitLeader.userId) {
            baseInfo.availabilityStatus = 'Koht hõivatud';
            baseInfo.missingRequirements.push(`Üksuses on juba talituse juht: ${departmentUnit.unitLeader.username || 'Keegi'}`);
            return baseInfo;
        } else {
            baseInfo.availabilityStatus = 'Koht saadaval';
        }

        if (this.currentUnit === position.departmentUnit) {
            if (!isGroupLeader(this.playerStats)) {
                baseInfo.missingRequirements.push('Pead olema grupijuht selles üksuses');
            } else if (baseInfo.missingRequirements.length === 0) {
                baseInfo.canApply = true;
            }
        } else {
            const unit = getUnitById(position.departmentUnit || '');
            baseInfo.missingRequirements.push(`Pead töötama ${unit?.name} üksuses grupijuhina`);
        }

        return baseInfo;
    }

    private async processGroupLeaderPosition(baseInfo: PositionInfo, position: any): Promise<PositionInfo> {
        this.processRequirements(baseInfo, position.requirements);

        // UPDATED: Use DepartmentUnitService instead of old functions
        const departmentUnit = await DepartmentUnitService.getUnit(
            this.playerStats.department || '',
            position.departmentUnit || ''
        );

        if (!departmentUnit) {
            // Unit doesn't exist yet (shouldn't happen after migration)
            baseInfo.availabilityStatus = 'Koht saadaval';
            if (this.currentUnit === position.departmentUnit && baseInfo.missingRequirements.length === 0) {
                baseInfo.canApply = true;
            }
            return baseInfo;
        }

        const currentCount = departmentUnit.groupLeaders.length;
        const canAcceptMore = currentCount < departmentUnit.maxGroupLeaders;

        if (this.currentUnit === position.departmentUnit) {
            if (canAcceptMore) {
                baseInfo.availabilityStatus = 'Koht saadaval';
                const isStandardWorker = !this.playerStats.policePosition?.startsWith('grupijuht_') &&
                    !this.playerStats.policePosition?.startsWith('talituse_juht_');
                if (isStandardWorker && baseInfo.missingRequirements.length === 0) {
                    baseInfo.canApply = true;
                } else if (!isStandardWorker) {
                    baseInfo.missingRequirements.push('Pead olema tavakandidaat selles üksuses');
                }
            } else {
                baseInfo.availabilityStatus = 'Kohad täis';
                baseInfo.missingRequirements.push(`Üksuses on juba maksimum arv grupijuhte (${currentCount}/${departmentUnit.maxGroupLeaders})`);
            }
        } else {
            baseInfo.availabilityStatus = canAcceptMore ? 'Koht saadaval' : 'Kohad täis';
            const unit = getUnitById(position.departmentUnit || '');
            baseInfo.missingRequirements.push(`Pead töötama ${unit?.name} üksuses`);
        }

        return baseInfo;
    }

    private processStandardPosition(baseInfo: PositionInfo, position: any): PositionInfo {
        this.processRequirements(baseInfo, position.requirements);

        // Check if applying to the exact same position
        if (baseInfo.isCurrentPosition) {
            baseInfo.missingRequirements.push('Sa juba töötad sellel ametikohal');
            return baseInfo;
        }

        // Allow switching within the same unit or to different units
        if (baseInfo.missingRequirements.length === 0) {
            baseInfo.canSwitch = true;
        }

        // Special case for patrullpolitseinik - always allow switching to it
        if (position.id === 'patrullpolitseinik') {
            baseInfo.canSwitch = true;
            baseInfo.missingRequirements = baseInfo.missingRequirements.filter(req =>
                !req.includes('Sa juba töötad') && !req.includes('Pead töötama')
            );
        }

        return baseInfo;
    }

    private processRequirements(positionInfo: PositionInfo, requirements: any) {
        if (!requirements) return;

        this.processLevelRequirement(positionInfo, requirements.minimumLevel);
        this.processCourseRequirements(positionInfo, requirements.completedCourses);
        this.processWorkHoursRequirement(positionInfo, requirements.minimumWorkedHours);
        this.processAttributeRequirements(positionInfo, requirements.attributes);
        this.processReputationRequirement(positionInfo, requirements.minimumReputation);
    }

    private processLevelRequirement(positionInfo: PositionInfo, minimumLevel?: number) {
        if (minimumLevel) {
            positionInfo.requirements.push(`Tase ${minimumLevel}+`);
            if (this.playerStats.level < minimumLevel) {
                positionInfo.missingRequirements.push(`Tase ${minimumLevel} (praegu ${this.playerStats.level})`);
            }
        }
    }

    private processCourseRequirements(positionInfo: PositionInfo, courses?: string[]) {
        if (courses && courses.length > 0) {
            courses.forEach(courseId => {
                const course = getCourseById(courseId);
                const courseName = course?.name || courseId;
                positionInfo.requirements.push(`Kursus: ${courseName}`);

                if (!this.playerStats.completedCourses.includes(courseId)) {
                    positionInfo.missingRequirements.push(`Kursus: ${courseName}`);
                }
            });
        }
    }

    private processWorkHoursRequirement(positionInfo: PositionInfo, minimumHours?: number) {
        if (minimumHours) {
            positionInfo.requirements.push(`${minimumHours} töötundi`);
            if ((this.playerStats.totalWorkedHours || 0) < minimumHours) {
                positionInfo.missingRequirements.push(
                    `${minimumHours} töötundi (praegu ${this.playerStats.totalWorkedHours || 0})`
                );
            }
        }
    }

    private processAttributeRequirements(positionInfo: PositionInfo, attributes?: Record<string, number>) {
        if (attributes && this.playerStats.attributes) {
            const attrs = this.playerStats.attributes;
            Object.entries(attributes).forEach(([attrName, requiredLevel]) => {
                const attrDisplayName = this.getAttributeDisplayName(attrName);
                positionInfo.requirements.push(`${attrDisplayName} ${requiredLevel}+`);

                const currentLevel = (attrs as any)[attrName]?.level || 0;
                if (currentLevel < requiredLevel) {
                    positionInfo.missingRequirements.push(
                        `${attrDisplayName} ${requiredLevel} (praegu ${currentLevel})`
                    );
                }
            });
        }
    }

    private processReputationRequirement(positionInfo: PositionInfo, minimumReputation?: number) {
        if (minimumReputation) {
            positionInfo.requirements.push(`${minimumReputation} maine`);
            if ((this.playerStats.reputation || 0) < minimumReputation) {
                positionInfo.missingRequirements.push(
                    `${minimumReputation} maine (praegu ${this.playerStats.reputation || 0})`
                );
            }
        }
    }

    private getAttributeDisplayName(attrName: string): string {
        const attrNames: Record<string, string> = {
            'strength': 'Jõud',
            'agility': 'Kiirus',
            'dexterity': 'Osavus',
            'intelligence': 'Intelligentsus',
            'endurance': 'Vastupidavus'
        };
        return attrNames[attrName] || attrName;
    }
}