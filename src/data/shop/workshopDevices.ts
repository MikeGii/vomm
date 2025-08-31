// src/data/shop/workshopDevices.ts
import { ShopItem } from '../../types/shop';

export const WORKSHOP_DEVICES: ShopItem[] = [
    {
        id: 'basic_cheap_3d_printer',
        name: 'Ender-3',
        description: 'Taskukohane 3D-printer algajatele põhiliste funktsioonidega.',
        category: 'workshop',
        price: 15000,
        currency: 'money',
        basePrice: 15000,
        maxStock: 150,
        stats: {
            printing: 0
        }
    },
    {
        id: 'basic_3d_printer',
        name: 'Bambu Lab A1 Mini',
        description: 'Kompaktne automaatne printer AI-põhise monitooringuga.',
        category: 'workshop',
        price: 25000,
        currency: 'money',
        basePrice: 25000,
        maxStock: 150,
        stats: {
            printing: 2
        }
    },
    {
        id: 'basic_3d_printer_01',
        name: 'Prusa MINI+',
        description: 'Usaldusväärne printer automaatse kalibreerimisega.',
        category: 'workshop',
        price: 40000,
        currency: 'money',
        basePrice: 40000,
        maxStock: 120,
        stats: {
            printing: 4
        }
    },
    {
        id: 'basic_3d_printer_02',
        name: 'Bambu Lab A1',
        description: 'Täisautomaatne printer koos AI-liidese ja kiire printimisega.',
        category: 'workshop',
        price: 65000,
        currency: 'money',
        basePrice: 65000,
        maxStock: 130,
        stats: {
            printing: 7
        }
    },
    {
        id: 'advanced_3d_printer_01',
        name: 'Bambu Lab X1 Carbon',
        description: 'Professionaalne printer automaatse materjalivahetusega.',
        category: 'workshop',
        price: 85000,
        currency: 'money',
        basePrice: 85000,
        maxStock: 100,
        stats: {
            printing: 10
        }
    },
    {
        id: 'advanced_3d_printer_02',
        name: 'Prusa MK4',
        description: 'Edasijõudnud FDM-printer 32-bitise juhtseadmega.',
        category: 'workshop',
        price: 150000,
        currency: 'money',
        basePrice: 150000,
        maxStock: 90,
        stats: {
            printing: 15
        }
    },
    {
        id: 'professional_3d_printer_01',
        name: 'Ultimaker S3',
        description: 'Professionaalne kaksikekstruuderiga printer.',
        category: 'workshop',
        price: 250000,
        currency: 'money',
        basePrice: 250000,
        maxStock: 60,
        stats: {
            printing: 20
        }
    },
    {
        id: 'professional_3d_printer_02',
        name: 'Formlabs Form 4',
        description: 'SLA-vaiguga printer erakordse detailsusega.',
        category: 'workshop',
        price: 400000,
        currency: 'money',
        basePrice: 400000,
        maxStock: 50,
        stats: {
            printing: 30
        }
    },
    {
        id: 'industrial_3d_printer_01',
        name: 'Markforged X7',
        description: 'Tööstuslik printer laia valikuga materjalide printimiseks.',
        category: 'workshop',
        price: 0,
        pollidPrice: 30,
        currency: 'pollid',
        basePrice: 0,
        basePollidPrice: 30,
        maxStock: 30,
        stats: {
            printing: 45
        }
    },
    {
        id: 'premium_3d_printer',
        name: 'Stratasys F770',
        description: 'Tippklassi tööstuslik printer suuremõõtmeliste objektide jaoks.',
        category: 'workshop',
        price: 0,
        pollidPrice: 50,
        currency: 'pollid',
        basePrice: 0,
        basePollidPrice: 50,
        maxStock: 15,
        stats: {
            printing: 60
        }
    },
    {
        id: 'basic_cheap_laser_cutter',
        name: 'Atomstack A10',
        description: 'Lihtne 10W laserdioodiga graveerija algajatele.',
        category: 'workshop',
        price: 20000,
        currency: 'money',
        basePrice: 20000,
        maxStock: 150,
        stats: {
            lasercutting: 0
        }
    },
    {
        id: 'basic_laser_cutter_01',
        name: 'Ortur Laser Master 3',
        description: 'Turvalisem 10W laserdioodiga graveerija parandatud ohutusfunktsioonidega.',
        category: 'workshop',
        price: 30000,
        currency: 'money',
        basePrice: 30000,
        maxStock: 150,
        stats: {
            lasercutting: 2
        }
    },
    {
        id: 'basic_laser_cutter_02',
        name: 'XTool D1 Pro',
        description: 'Kompaktne 20W laserdioodiga lõikur suletud tööruumiga.',
        category: 'workshop',
        price: 45000,
        currency: 'money',
        basePrice: 45000,
        maxStock: 150,
        stats: {
            lasercutting: 4
        }
    },
    {
        id: 'advanced_laser_cutter_01',
        name: 'Sculpfun S30 Pro Max',
        description: 'Võimsam 20W seade suurema töötsooni koos kõrgsurve õhu toega puhtamateks lõigeteks.',
        category: 'workshop',
        price: 65000,
        currency: 'money',
        basePrice: 65000,
        maxStock: 120,
        stats: {
            lasercutting: 7
        }
    },
    {
        id: 'advanced_laser_cutter_02',
        name: 'LaserPecker LX1',
        description: 'Kompaktne 40W seade automaatse fookusega ja äpi toega.',
        category: 'workshop',
        price: 85000,
        currency: 'money',
        basePrice: 85000,
        maxStock: 100,
        stats: {
            lasercutting: 10
        }
    },
    {
        id: 'professional_laser_cutter_01',
        name: 'Omtech 40W CO2',
        description: 'Algklassi CO2-laser kiireks lõikamiseks. Vajab ventilatsiooni.',
        category: 'workshop',
        price: 150000,
        currency: 'money',
        basePrice: 150000,
        maxStock: 80,
        stats: {
            lasercutting: 15
        }
    },
    {
        id: 'professional_laser_cutter_02',
        name: 'Full Spectrum Muse Core',
        description: 'Professionaalne 45W CO2-laser kaamerapositsioneerimisega.',
        category: 'workshop',
        price: 250000,
        currency: 'money',
        basePrice: 250000,
        maxStock: 60,
        stats: {
            lasercutting: 20
        }
    },
    {
        id: 'industrial_laser_cutter_01',
        name: 'Epilog Zing 24',
        description: 'Professionaalse klassi 50W CO2-laser tööstusstandardi tarkvaraga.',
        category: 'workshop',
        price: 400000,
        currency: 'money',
        basePrice: 400000,
        maxStock: 40,
        stats: {
            lasercutting: 30
        }
    },
    {
        id: 'industrial_laser_cutter_02',
        name: 'Trotec Speedy 360',
        description: 'Tööstusklassi 120W CO2-laser maksimaalse kiirusega.',
        category: 'workshop',
        price: 0,
        pollidPrice: 30,
        currency: 'pollid',
        basePrice: 0,
        basePollidPrice: 30,
        maxStock: 25,
        stats: {
            lasercutting: 45
        }
    },
    {
        id: 'premium_laser_cutter',
        name: 'Epilog Fusion Pro 48',
        description: 'Tipptasemel 120W tööstuslik laser.',
        category: 'workshop',
        price: 0,
        pollidPrice: 50,
        currency: 'pollid',
        basePrice: 0,
        basePollidPrice: 50,
        maxStock: 15,
        stats: {
            lasercutting: 60
        }
    }
];