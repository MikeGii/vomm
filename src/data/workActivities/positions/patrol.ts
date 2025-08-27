// src/data/workActivities/positions/patrol.ts
import { WorkActivity } from '../types';

// Patrol activities for Abipolitseinik and graduated officers
export const PATROL_ACTIVITIES: WorkActivity[] = [
    {
        id: 'patrol_third_member',
        name: 'Alusta patrulli kolmanda liikmena',
        description: 'Abipolitseinikuna saad alustada patrulli kolmanda liikmena. Õpid kogenud kolleegidelt ja saad esimesi kogemusi tänaval.',
        minLevel: 1,
        requiredCourses: ['basic_police_training_abipolitseinik'],
        baseExpPerHour: 50,
        expGrowthRate: 0.15,
        maxHours: 12,
        allowedFor: ['abipolitseinik'],
    },
    {
        id: 'patrol_second_member',
        name: 'Alusta patrulli teise liikmena',
        description: 'Kogenud abipolitseinikuna saad olla patrulli teine liige. Vastutad rohkem ja saad paremaid kogemusi.',
        minLevel: 10,
        requiredCourses: ['basic_police_training_abipolitseinik', 'firearm_training_abipolitseinik'],
        baseExpPerHour: 150,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['abipolitseinik']
    },
    {
        id: 'patrol_second_member_police',
        name: 'Alusta patrulli teise liikmena',
        description: 'Värskelt sisekaitseakadeemia lõpetanud ametnikuna suudad iseseisvalt toimida teise liikmena',
        minLevel: 30,
        requiredCourses: ['lopueksam'],
        baseExpPerHour: 250,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['patrullpolitseinik']
    },
    {
        id: 'patrol_car_chief',
        name: 'Alusta patrulli toimkonna vanemana',
        description: 'Mõningase patrullkogemusega suudad juba iseseisvalt patrulltoimkonda juhtida',
        minLevel: 35,
        requiredCourses: ['lopueksam'],
        baseExpPerHour: 350,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['patrullpolitseinik']
    },
    {
        id: 'patrol_ground_leader',
        name: 'Alusta patrullvahetust välijuhina',
        description: 'Tugeva patrullitöö kogemuse ja vaneminspektorina on sul võimalus alustada teenistust välijuhina',
        minLevel: 40,
        requiredCourses: ['police_ground_leader_course'],
        baseExpPerHour: 650,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['patrullpolitseinik']
    },
    {
        id: 'patrol_group_leader_placement',
        name: 'Asendad grupijuhti tema tööülesannetes',
        description: 'Grupijuht on puhkusel ja oled määratud tema asendajaks',
        minLevel: 50,
        requiredCourses: ['police_group_leader_course'],
        baseExpPerHour: 850,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['patrullpolitseinik']
    }
];