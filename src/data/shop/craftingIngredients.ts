// src/data/shop/craftingIngredients.ts
import { ShopItem } from '../../types/shop';

export const CRAFTING_INGREDIENTS: ShopItem[] = [
    // Cooking ingredients
    {
        id: 'oatmeal',
        name: 'Kaerahelbed',
        description: 'Tervislikud hommikusöögi helbed',
        category: 'crafting',
        price: 3,
        currency: 'money',
        basePrice: 3,
        maxStock: 10000
    },
    {
        id: 'porrige',
        name: 'Kaerahelbepuder',
        description: 'Tervislik kaerahelbepuder',
        category: 'crafting',
        price: 11, // (3+3+2) * 1.35 = 10.8 → 11
        currency: 'money',
        basePrice: 11,
        maxStock: 0
    },
    {
        id: 'water',
        name: 'Vesi',
        description: 'Puhas joogivesi',
        category: 'crafting',
        price: 2,
        currency: 'money',
        basePrice: 2,
        maxStock: 20000
    },
    {
        id: 'syrup',
        name: 'Siirup',
        description: 'Magus siirup jookide valmistamiseks',
        category: 'crafting',
        price: 3,
        currency: 'money',
        basePrice: 3,
        maxStock: 5000
    },
    {
        id: 'juice',
        name: 'Mahl',
        description: 'Magus mahl valmistatud veest ja siirupist',
        category: 'crafting',
        price: 9, // (2+2+3) * 1.35 = 9.45 → 9
        currency: 'money',
        basePrice: 9,
        maxStock: 0
    },
    {
        id: 'flour',
        name: 'Jahu',
        description: 'Nisujahu leiva ja küpsetiste valmistamiseks',
        category: 'crafting',
        price: 5,
        currency: 'money',
        basePrice: 5,
        maxStock: 20000
    },
    {
        id: 'bread',
        name: 'Leib',
        description: 'Värske leib',
        category: 'crafting',
        price: 10, // (5+2) * 1.35 = 9.45 → 10
        currency: 'money',
        basePrice: 10,
        maxStock: 0
    },
    {
        id: 'sandwich',
        name: 'Megaleib',
        description: 'Rammumehe võileib, mis koosneb värskest rukkileivast ja tummisest pudrust',
        category: 'crafting',
        price: 28, // (10+11) * 1.35 = 28.35 → 28
        currency: 'money',
        basePrice: 28,
        maxStock: 0
    },
    {
        id: 'herbs',
        name: 'Ravimtaimed',
        description: 'Looduslikud ravimtaimed tervendavate omadusega',
        category: 'crafting',
        price: 15,
        currency: 'money',
        basePrice: 15,
        maxStock: 5000
    },
    {
        id: 'caffeine',
        name: 'Kofeiin',
        description: 'Puhas kofeiin energiajookide valmistamiseks',
        category: 'crafting',
        price: 24,
        currency: 'money',
        basePrice: 24,
        maxStock: 5000
    },
    {
        id: 'nootropics',
        name: 'Nootropikumid',
        description: 'Aju võimekust tõstvad ained',
        category: 'crafting',
        price: 320,
        currency: 'money',
        basePrice: 320,
        maxStock: 1000
    },
    {
        id: 'protein_powder',
        name: 'Valgupulber',
        description: 'Kõrgekvaliteediline valgupulber lihasmassi taastamiseks ja energia säilitamiseks',
        category: 'crafting',
        price: 85,
        currency: 'money',
        basePrice: 85,
        maxStock: 4000
    },
    {
        id: 'creatine_monohydrate',
        name: 'Kreatiin monohüdraat',
        description: 'Puhas kreatiin monohüdraat lihasjõu ja vastupidavuse suurendamiseks',
        category: 'crafting',
        price: 125,
        currency: 'money',
        basePrice: 125,
        maxStock: 4000
    },
    {
        id: 'amino_acids',
        name: 'Aminohapped',
        description: 'Essentiaalsed aminohapped aju neurotransmitterite tootmiseks ja fookuse parandamiseks',
        category: 'crafting',
        price: 180,
        currency: 'money',
        basePrice: 180,
        maxStock: 4000
    },
    // Drinks
    {
        id: 'energy_drink',
        name: 'Energiajook',
        description: 'Värskendav energiajook tööpäeva jaoks',
        category: 'crafting',
        price: 16, // (9+3) * 1.35 = 16.2 → 16
        currency: 'money',
        basePrice: 16,
        maxStock: 0,
        consumableEffect: {
            type: 'trainingClicks',
            value: 1
        }
    },
    {
        id: 'power_smoothie',
        name: 'Jõujook',
        description: 'Võimas jõujook pikaks tööpäevaks',
        category: 'crafting',
        price: 36, // (16+11) * 1.35 = 36.45 → 36
        currency: 'money',
        basePrice: 36,
        maxStock: 0
    },
    // Chemistry ingredients (basic prices stay same)
    {
        id: 'alcohol',
        name: 'Alkohol',
        description: 'Tehniline piiritus toodete valmistamiseks',
        category: 'crafting',
        price: 8,
        currency: 'money',
        basePrice: 8,
        maxStock: 10000
    },
    {
        id: 'salt',
        name: 'Sool',
        description: 'Puhas naatriumkloriid keemiliste reaktsioonide jaoks',
        category: 'crafting',
        price: 5,
        currency: 'money',
        basePrice: 5,
        maxStock: 10000
    },
    {
        id: 'vinegar',
        name: 'Äädikas',
        description: 'Puhastusaine ja keemiline koostisosa',
        category: 'crafting',
        price: 6,
        currency: 'money',
        basePrice: 6,
        maxStock: 10000
    },
    {
        id: 'disinfectant',
        name: 'Desinfitseerimisvahend',
        description: 'Aine desinfitseerimiseks',
        category: 'crafting',
        price: 24, // (8+8+2) * 1.35 = 24.3 → 24
        currency: 'money',
        basePrice: 24,
        maxStock: 0
    },
    {
        id: 'cleaning_solution',
        name: 'Puhastusaine',
        description: 'Võimas puhastusaine',
        category: 'crafting',
        price: 26, // (6+6+5+2) * 1.35 = 25.65 → 26
        currency: 'money',
        basePrice: 26,
        maxStock: 0
    },
    {
        id: 'antiseptic_solution',
        name: 'Antiseptikum',
        description: 'Tugev antiseptiline lahus',
        category: 'crafting',
        price: 36, // (8+8+8+5+5+2) * 1.35 = 48.6 → simplified to (8*3+5*2+2)*1.35=36*1.35=29→36
        currency: 'money',
        basePrice: 36,
        maxStock: 0
    },
    {
        id: 'rescuer_meal',
        name: 'Päästja eine',
        description: 'Toitev ja taastav eine välitöödel',
        category: 'crafting',
        price: 165,
        currency: 'money',
        basePrice: 165,
        maxStock: 0,
        consumableEffect: {
            type: 'heal',
            value: 50
        }
    },
    {
        id: 'rescue_league_food_pack',
        name: 'Päästeliidu toidupakk',
        description: 'Professionaalne toidupakk välitingimustes töötavate ametnike jaoks',
        category: 'crafting',
        price: 850,
        currency: 'money',
        basePrice: 850,
        maxStock: 0,
        consumableEffect: {
            type: 'heal',
            value: 80
        }
    },
    {
        id: 'luxurious_dinner',
        name: 'Rikkalik õhtusöök',
        description: 'Rikkalik õhtusöök valmistatud eksootilistest komponentidest',
        category: 'crafting',
        price: 6500,
        currency: 'money',
        basePrice: 6500,
        maxStock: 0,
        consumableEffect: {
            type: 'heal',
            value: 150
        }
    },
    {
        id: 'super_booster',
        name: 'Supervõimendaja',
        description: 'Ülim energiajook treeninguteks',
        category: 'crafting',
        price: 181,
        currency: 'money',
        basePrice: 181,
        maxStock: 0,
        consumableEffect: {
            type: 'trainingClicks',
            value: 5
        }
    },
    {
        id: 'anabolic_drink',
        name: 'Anaboolne jook',
        description: 'Võimas jõujook maksimaalse treeningu soorituse saavutamiseks',
        category: 'crafting',
        price: 1200,
        currency: 'money',
        basePrice: 1200,
        maxStock: 0,
        consumableEffect: {
            type: 'trainingClicks',
            value: 8
        }
    },
    {
        id: 'training_drink',
        name: 'Treening booster',
        description: 'Erakordne jook, mis taastab erakordselt kiiresti lihased ja annab energiat',
        category: 'crafting',
        price: 6800,
        currency: 'money',
        basePrice: 6800,
        maxStock: 0,
        consumableEffect: {
            type: 'trainingClicks',
            value: 20
        }
    },
    {
        id: 'brain_accelerator',
        name: 'Ajukiirendaja',
        description: 'Kiirendab õppimist ja kursuste läbimist 10% võrra',
        category: 'crafting',
        price: 1450,
        currency: 'money',
        basePrice: 1450,
        maxStock: 0,
        consumableEffect: {
            type: 'courseTimeReduction',
            value: 10
        }
    },
    {
        id: 'work_efficiency_serum',
        name: 'Töökuse seerum',
        description: 'Keemiline lahus töökiirenduse ja fookuse parandamiseks',
        category: 'crafting',
        price: 4500,
        currency: 'money',
        basePrice: 4500,
        maxStock: 0,
        consumableEffect: {
            type: 'workTimeReduction',
            value: 10
        }
    },
    {
        id: 'extreme_work_efficiency_serum',
        name: 'Kange töökuse seerum',
        description: 'Eriti kange keemiline lahus töökiirenduse ja fookuse parandamiseks',
        category: 'crafting',
        price: 12500,
        currency: 'money',
        basePrice: 12500,
        maxStock: 0,
        consumableEffect: {
            type: 'workTimeReduction',
            value: 15
        }
    },

    // Basic handicraft materials
    {
        id: 'fabric',
        name: 'Kangas',
        description: 'Põhiline tekstiilmaterjal õmblemiseks',
        category: 'crafting',
        price: 4,
        currency: 'money',
        basePrice: 4,
        maxStock: 10000
    },
    {
        id: 'thread',
        name: 'Niit',
        description: 'Tugev niit õmblemiseks ja parandamiseks',
        category: 'crafting',
        price: 2,
        currency: 'money',
        basePrice: 2,
        maxStock: 10000
    },
    {
        id: 'cotton',
        name: 'Puuvill',
        description: 'Puhas puuvill meditsiiniliste toodete valmistamiseks',
        category: 'crafting',
        price: 3,
        currency: 'money',
        basePrice: 3,
        maxStock: 10000
    },
    {
        id: 'gauze',
        name: 'Marli',
        description: 'Marli käsn haavade puhastamiseks',
        category: 'crafting',
        price: 6,
        currency: 'money',
        basePrice: 6,
        maxStock: 5000
    },

// Player-made products (maxStock: 0)
    {
        id: 'cloth',
        name: 'Riie',
        description: 'Käsitsi valmistatud lihtne riie',
        category: 'crafting',
        price: 11,
        currency: 'money',
        basePrice: 11,
        maxStock: 0
    },
    {
        id: 'reinforced_cloth',
        name: 'Täiustatud riie',
        description: 'Tugevam riie, mis sobib kvaliteetsete riiete õmblemiseks',
        category: 'crafting',
        price: 18,
        currency: 'money',
        basePrice: 18,
        maxStock: 0
    },
    {
        id: 'leather',
        name: 'Nahk',
        description: 'Looduslik nahk kaitseriietuse valmistamiseks',
        category: 'crafting',
        price: 12,
        currency: 'money',
        basePrice: 12,
        maxStock: 8000
    },
    {
        id: 'synthetic_fiber',
        name: 'Sünteetilised kiud',
        description: 'Kõrgtehnoloogilised sünteetilised kiud vastupidava varustuse valmistamiseks',
        category: 'crafting',
        price: 95,
        currency: 'money',
        basePrice: 95,
        maxStock: 3000
    },
    {
        id: 'bandage',
        name: 'Side',
        description: 'Meditsiiniline side haavade katmiseks',
        category: 'crafting',
        price: 16, // (3+3+2) * 1.0 = 8
        currency: 'money',
        basePrice: 16,
        maxStock: 0,
        consumableEffect: {
            type: 'heal',
            value: 2
        }
    },
    {
        id: 'pressure_bandage',
        name: 'Rõhkside',
        description: 'Side parema esmaabi jaoks',
        category: 'crafting',
        price: 24,
        currency: 'money',
        basePrice: 24,
        maxStock: 0,
        consumableEffect: {
            type: 'heal',
            value: 4
        }
    },
    {
        id: 'medical_gel',
        name: 'Meditsiiniline geel',
        description: 'Spetsiaalne geel haavade kiireks paranemiseks',
        category: 'crafting',
        price: 22,
        currency: 'money',
        basePrice: 22,
        maxStock: 4000
    },
    {
        id: 'advanced_medical_kit',
        name: 'Täiustatud meditsiinipakett',
        description: 'Professionaalne meditsiinipakett kiireks terviseks',
        category: 'crafting',
        price: 105,
        currency: 'money',
        basePrice: 105,
        maxStock: 0,
        consumableEffect: {
            type: 'heal',
            value: 8
        }
    },
    {
        id: 'emergency_trauma_kit',
        name: 'Hädaabipakk',
        description: 'Professionaalne hädaolukordade meditsiinipakk',
        category: 'crafting',
        price: 380,
        currency: 'money',
        basePrice: 380,
        maxStock: 0,
        consumableEffect: {
            type: 'heal',
            value: 25
        }
    },

    // 3D printing ingredients
    {
        id: 'filament_pla',
        name: 'PLA Filament',
        description: 'Biolagunev lihtsasti 3D prinditav filament',
        category: 'crafting',
        price: 25,
        currency: 'money',
        basePrice: 25,
        maxStock: 8000
    },
    {
        id: 'filament_abs',
        name: 'ABS Filament',
        description: 'ABS filament paremate tugevus ja temperatuuri näitajatega',
        category: 'crafting',
        price: 30,
        currency: 'money',
        basePrice: 30,
        maxStock: 8000
    },
    {
        id: 'filament_nylon_carbon',
        name: 'PA-CF Filament',
        description: 'Nailon karbon filament eriti tugevate asjade printimiseks. Kohati asendab metallist detaile',
        category: 'crafting',
        price: 75,
        currency: 'money',
        basePrice: 75,
        maxStock: 8000
    },

    // 3D printing products

    {
        id: 'plastic_details_product',
        name: 'Plastikust detailid',
        description: '3D prinditud plastikust detailid',
        category: 'crafting',
        price: 125,
        currency: 'money',
        basePrice: 125,
        maxStock: 0,
    },
    {
        id: 'plastic_details_strong_product',
        name: 'Tugevad plastik detailid',
        description: '3D prinditud detailid, mis on valmistatud nailon ja karbon filamendist kõrgete mehhaaniliste omadustega',
        category: 'crafting',
        price: 275,
        currency: 'money',
        basePrice: 275,
        maxStock: 0,
    },

    // Laser engraving materials
    {
        id: 'plywood_table',
        name: 'Vineertahvel',
        description: 'Kvaliteetne kasevineeris tahvel laserlõikamiseks ja graveerimiseks',
        category: 'crafting',
        price: 25,
        currency: 'money',
        basePrice: 25,
        maxStock: 8000
    },
    {
        id: 'pvc_plastic_table',
        name: 'Pleksiklaas',
        description: 'Akrüültahvel ehk pleksiklaas erinevate detailide lõikamiseks ja graveerimiseks',
        category: 'crafting',
        price: 45,
        currency: 'money',
        basePrice: 45,
        maxStock: 8000
    },
    {
        id: 'stainless_steel_table',
        name: 'Roostevabast terasest plaat',
        description: 'Roostevabast terasest plaat, millest saab lõigata erinevaid terasest detaile',
        category: 'crafting',
        price: 45,
        currency: 'money',
        basePrice: 45,
        maxStock: 8000
    },

    // Laser engraving recipes

    {
        id: 'wooden_details_product',
        name: 'Puidust lõigatud detailid',
        description: 'Laserlõikuriga lõigatud detailid puidust keerukamate asjade komplekteerimiseks',
        category: 'crafting',
        price: 95,
        currency: 'money',
        basePrice: 95,
        maxStock: 0,
    },
];