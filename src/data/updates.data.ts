// src/data/updates.data.ts
import { GameUpdate } from '../types';

export const gameUpdates: GameUpdate[] = [

    {
        id: '7',
        title: 'Uuenduste süsteem',
        description: 'Koolituste lõppemisel on nüüd kontrollküsimus boonuste saamiseks. Osakonna lehel loodud struktuuri vaade.' +
            ' Parandatud event süsteem - ei tohiks enam mitut eventi korraga aktiveerida töö lõppemisel. Staatuse asemel on nüüd' +
            ' ametikoht, mitte politseiamentik. Loodud tagasiside ja kontaktvorm - lisatud viide menüüsse. Patrullpolitseinikul on' +
            ' nüüd võimalik saada kuni vanemkomissari auaste ja ülendamine toimub järgnevalt: level 20 -> 40 -> 60 -> 80 -> 100.',
        date: '2025-08-21',
        isNew: true
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