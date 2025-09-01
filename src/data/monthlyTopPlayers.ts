// src/data/monthlyTopPlayers.ts

export interface MonthlyWinner {
    position: 1 | 2 | 3;
    username: string;
}

export interface MonthlyRecord {
    year: number;
    month: string;  // Estonian month name
    winners: MonthlyWinner[];
}

// Manually update this data each month
export const MONTHLY_TOP_PLAYERS: MonthlyRecord[] = [
    {
        year: 2025,
        month: 'August',
        winners: [
            { position: 1, username: 'Krimkamees'},
            { position: 2, username: 'Antoosa'},
            { position: 3, username: 'A_Cop'}
        ]
    },
    {
        year: 2025,
        month: 'September',
        winners: [
            { position: 1, username: ' '},
            { position: 2, username: ' '},
            { position: 3, username: ' '}
        ]
    },
    {
        year: 2025,
        month: 'Oktoober',
        winners: [
            { position: 1, username: ' '},
            { position: 2, username: ' '},
            { position: 3, username: ' '}
        ]
    }
    // Add more months as needed
];