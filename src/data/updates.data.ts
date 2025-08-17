// src/data/updates.data.ts
import { GameUpdate } from '../types';

export const gameUpdates: GameUpdate[] = [
    {
        id: '2',
        title: 'Uuenduste süsteem',
        description: 'Nüüd on pealehe alumises osas uuenduste osa, kuhu lisanduvad parandused ja uued mängu funktsioonid. Lisatud ikoon lehe päises' +
            ' olevale mängu nime järgi.',
        date: '2025-08-17',
        isNew: true
    },
    {
        id: '1',
        title: 'Tasakaalustatud koolitused',
        description: 'Lisatud 3 uut koolitust abipolitseinikele ja 3 uut oskust ning tasakaalustatud iga koolituse tasud. Mängija näeb nüüd koolituste lehe alt vastavalt ' +
            'enda staatusele kõiki koolitusi ja iga koolituse avamise jaoks vajalike nõudmisi. Uued ikoonid Omandatud oskuste sektsioonis.',
        date: '2025-08-17'
    }
];