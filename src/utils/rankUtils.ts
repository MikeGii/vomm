// src/utils/rankUtils.ts

export const getRankImagePath = (rank: string | null): string | null => {
    if (!rank) return null;

    // Map ranks to their corresponding image files in public/images folder
    const rankImageMap: Record<string, string> = {
        'nooreminspektor': '/images/nooreminspektor.png',
        'inspektor': '/images/inspektor.png',
        'vaneminspektor': '/images/vaneminspektor.png',
        'üleminspektor': '/images/yleminspektor.png',
        'komissar': '/images/komissar.png',
        'vanemkomissar': '/images/vanemkomissar.png'
    };

    // Convert to lowercase for case-insensitive matching
    const normalizedRank = rank.toLowerCase();
    return rankImageMap[normalizedRank] || null;
};