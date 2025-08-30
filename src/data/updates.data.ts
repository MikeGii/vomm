// src/data/updates.data.ts
import { GameUpdate } from '../types';

export const gameUpdates: GameUpdate[] = [

    {
        id: '13',
        title: 'Mängu uuenduesd',
        description: 'Lisatud testide leht ja testi lahendamise süsteem. Lisatud paar uut koolitust politsei kategooriasse seoses uute töötegevuste lisandumisega' +
            ' K9, uurijate, kiirreageerijate ja küberkriminalistide üksustesse.',
        date: '2025-08-29',
        isNew: true
    },
    {
        id: '13',
        title: 'Mängu uuenduesd',
        description: 'Lisatud kuritegevuse statistika ja edetabeli funktisoon osakonna lehele. Lisatud juurde talituse juhi ametikoht ja uus palgasüsteem erinevatele ametikoha tasemetele. Palgasüsteem' +
            ' võtab arvesse mängija ametikohta + auastet. Tasakaalustatud grupijuhi kohale kandideerimise nõudeid ja nüüd maine vajalik. VIP boosterite süsteemi tasakaalustatud ja lisatud limiit ühe' +
            ' boosteri kasutamise ühe töö tegevuse kohta. Lisatud mitmeid uusi koolitusi ja boonusküsimusi koolitustele.',
        date: '2025-08-28',

    },
    {
        id: '12',
        title: 'Mängu uuenduesd',
        description: 'Lisatud kasutaja seadete leht. Mängija saab muuta nime ja e-posti. Võitlusklubis vastaste nimekirja osa optimiseeritud. Köögi & Labori ning ' +
            'käsitöö osas saab inventuuris ja ka poes koguseid paremini hallata (varasem viga oli eeltäidetud nr. 1 ja ei lubanud sisestada koguseid, mida mängija osta ei saa).' +
            ' Poe süsteemis kaotatud ära lao seis esmatarvetel. Mängijate toodetud asjadel endiselt muutuv lao seis. Loodud VIP lehekülg. Muudetud kogu mängija leveli xp arvutamise süsteem ' +
            'paindliku kurvi pealt lineaarsele 9%-le (vajaliku xp tõus uue leveli jaoks).',
        date: '2025-08-27',
    },
    {
        id: '11',
        title: 'Mängu uuenduesd',
        description: 'Lisatud testide lehekülg kuhu tulevikus lisandub teste boonus tasudega. Lisatud kaks uut arendatavat käsitöö oskust (3D printimine ja laserlõikamine,' +
            ' mis avanevad tulevikus uute mängu funtksioonidega. Lisatud uusi tegevusi käsitöö ja köögi alla. Parandused profiili lehel oskuste all. Tõstetud edetabeli ' +
            'kuvamiste arvu 200 peale. Lisatud uus koolitus politsei kategoorias.',
        date: '2025-08-26',

    },
    {
        id: '10',
        title: 'Mängu uuenduesd',
        description: 'Osakonna lehel nüüd võimalik mängijatel liikuda allüksuste vahel. Lisatud uus positioon karjääri arenguks - grupijuht.' +
            ' Grupijuhid saavad automaatsel vanemkomissari auastme. Oskuste treenimisel iga level annab +2 reputatsiooni. Tõstetud koolitustel ' +
            'saadavat kogemust ja reputatsiooni.',
        date: '2025-08-25',

    },
    {
        id: '9',
        title: 'Mängu uuenduesd',
        description: 'Võimalik alustada tööd välijuhina alates level 40. Lisatud käsitööle uued esemed. Suurendatud poes olevate asjade koguseid' +
            ' seoses mängijaskonna kasvuga. Pood nüüd taastab inventaari 15% tunnis 5% asemel. Parandatud viga, kus sidet ei saanud müüa, mida ' +
            ' mängija ise tegi. Tõstetud köögi ja labori tootmiseks vajalike leveleid tasakaalustatud arengu jaoks. Lisatud mõned boonusküsimused' +
            ' politsei kursuste kategoorias juurde. Uued VIP boosterid ning lisatud klikkide taastamise võimekus käsitöö osale.',
        date: '2025-08-23',

    },
    {
        id: '8',
        title: 'Süsteemi uuendused',
        description: 'Aktiivse mängijaskonna kasvamisega teostatud põhjaliku süsteemi uuendused paremaks andmekasutuseks - NB! ' +
            'IGAL MÄNGIJAL RANGELT SOOVITUSLIK TÜHJENDADA LEHE VAHEMÄLU JA LOGIDA VÄLJA JA UUESTI SISSE. Lisatud uued köögi ja labori ' +
            'level 30 esemed, mis ka annavad boonuseid mängus. Nüüd Discordi link töölaua jaluses. Osakonnas nüüd talituse ja ' +
            'prefektuuri põhine edetabel politseiametniku staatuses mängijatele.',
        date: '2025-08-22',

    },
    {
        id: '7',
        title: 'Uuenduste süsteem',
        description: 'Koolituste lõppemisel on nüüd kontrollküsimus boonuste saamiseks. Osakonna lehel loodud struktuuri vaade.' +
            ' Parandatud event süsteem - ei tohiks enam mitut eventi korraga aktiveerida töö lõppemisel. Staatuse asemel on nüüd' +
            ' ametikoht, mitte politseiamentik. Loodud tagasiside ja kontaktvorm - lisatud viide menüüsse. Patrullpolitseinikul on' +
            ' nüüd võimalik saada kuni vanemkomissari auaste ja ülendamine toimub järgnevalt: level 20 -> 40 -> 60 -> 80 -> 100.',
        date: '2025-08-21',
    },
    {
        id: '6',
        title: 'Uuenduste süsteem',
        description: 'Lisatud uued oskused ja tegevused Köögi & Labori osas treeningu lehe all. Nüüd mängijatel võimalus ' +
            'ise toota uusi asju. Loodud dünaamilne poe süsteem, kus mängijad peavad ise tekitama turgu läbi enda tehtud toodete.' +
            ' Level 40 sporditegevused lisaks. Loodud mängule kiirjuhend töölauale.',
        date: '2025-08-20',
    },
    {
        id: '5',
        title: 'Uuenduste süsteem',
        description: 'Uus funktsioon - Võitlusklubi. Mängijatel on võimalik end proovile panna võitlusringis valides vastaseks' +
            ' teisi mängijaid. Lisatud koolitusi juurde politseiametniku staatuses mängijatele.',
        date: '2025-08-19',
    },
    {
        id: '4',
        title: 'Uuenduste süsteem + vea pranadused',
        description: 'Mängijatel on nüüd võimalus lõpetada Sisekaitseakadeemia ja saavad politseiametniku staatuse. Lisatud uued lehed ' +
            'nagu: KASIINO ja PANK. Mängijad saavad nüüd proovida õnne kasiinos ja saata üksteisele raha läbi panga. Lisatud juurde' +
            'auastmetele paguni pilt. Sisekaitseakadeemia koolitused nüüd täisutavad abipolitseiniku kursustelt saadud oskuseid.',
        date: '2025-08-19',
    },
    {
        id: '3',
        title: 'Uuenduste süsteem',
        description: 'Mängule lisatud uued koolitused Sisekaitseakadeemia õppuritele. Mängu lisatud uus leht: POOD. Poest on võimalik' +
            ' nüüd osta treeninguteks tarbeid ning meditsiinilist varustust elude kiiremaks taastamiseks. Parandatud profiili lehel ' +
            'inventuuris asjade jaotamise süsteem - samad esemed lihtsalt tõstavad kogust.',
        date: '2025-08-18'
    },
    {
        id: '2',
        title: 'Uuenduste süsteem',
        description: 'Nüüd on pealehe alumises osas uuenduste osa, kuhu lisanduvad parandused ja uued mängu funktsioonid. Lisatud ikoon lehe päises' +
            ' olevale mängu nime järgi.',
        date: '2025-08-17'
    },
    {
        id: '1',
        title: 'Tasakaalustatud koolitused',
        description: 'Lisatud 3 uut koolitust abipolitseinikele ja 3 uut oskust ning tasakaalustatud iga koolituse tasud. Mängija näeb nüüd koolituste lehe alt vastavalt ' +
            'enda staatusele kõiki koolitusi ja iga koolituse avamise jaoks vajalike nõudmisi. Uued ikoonid Omandatud oskuste sektsioonis.',
        date: '2025-08-17'
    }
];