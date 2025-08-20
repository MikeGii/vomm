// src/services/FightService.ts
export interface FightRound {
    roundNumber: number;
    description: string[];
    winner: 'player1' | 'player2';
    damage?: number;
    criticalHit?: boolean;
    luckEvent?: boolean;
}

export interface FightResult {
    winner: 'player1' | 'player2';
    rounds: FightRound[];
    player1Score: number;
    player2Score: number;
    totalRounds: number;
    moneyWon: number;
}

export interface FightParticipant {
    userId: string;
    username: string;
    level: number;
    attributes: {
        strength: number;
        agility: number;
        dexterity: number;
        endurance: number;
        intelligence: number;
    };
}

// Calculate fight between two players
export const calculateFight = (
    player1: FightParticipant,
    player2: FightParticipant
): FightResult => {
    const rounds: FightRound[] = [];
    let player1Score = 0;
    let player2Score = 0;
    const maxRounds = 5; // Best of 5 rounds
    const minRounds = 3; // Minimum 3 rounds

    // NEW PROGRESSIVE MONEY REWARD SYSTEM
    const baseReward = 500; // Base reward amount
    const levelDifference = player2.level - player1.level; // Negative if opponent is lower level

    let moneyWon: number;

    if (levelDifference < 0) {
        // Fighting lower level opponent - decrease reward by 10% per level
        const decreasePercentage = Math.abs(levelDifference) * 0.10;
        // Minimum 5% of base reward (never go to absolute 0)
        const multiplier = Math.max(0.05, 1 - decreasePercentage);
        moneyWon = Math.floor(baseReward * multiplier);
    } else if (levelDifference > 0) {
        // Fighting higher level opponent - increase reward by 10% per level
        const increasePercentage = levelDifference * 0.10;
        // Cap at 200% increase (3x base reward)
        const multiplier = Math.min(3, 1 + increasePercentage);
        moneyWon = Math.floor(baseReward * multiplier);
    } else {
        // Same level - base reward
        moneyWon = baseReward;
    }

    // Add small random variation (±10%)
    const randomVariation = 0.9 + (Math.random() * 0.2);
    moneyWon = Math.floor(moneyWon * randomVariation);

    for (let roundNum = 1; roundNum <= maxRounds; roundNum++) {
        const round = simulateRound(roundNum, player1, player2);
        rounds.push(round);

        if (round.winner === 'player1') {
            player1Score++;
        } else {
            player2Score++;
        }

        // Check if we have a winner (best of 5, so first to 3 wins)
        if (player1Score >= 3 || player2Score >= 3) {
            // But ensure minimum 3 rounds
            if (roundNum >= minRounds) {
                break;
            }
        }
    }

    return {
        winner: player1Score > player2Score ? 'player1' : 'player2',
        rounds,
        player1Score,
        player2Score,
        totalRounds: rounds.length,
        moneyWon
    };
};

// Add a helper function to calculate and display potential reward
export const calculatePotentialReward = (
    playerLevel: number,
    opponentLevel: number
): { reward: number; percentage: string } => {
    const baseReward = 500;
    const levelDifference = opponentLevel - playerLevel;

    let reward: number;
    let percentage: string;

    if (levelDifference < 0) {
        const decreasePercentage = Math.abs(levelDifference) * 0.10;
        const multiplier = Math.max(0.05, 1 - decreasePercentage);
        reward = Math.floor(baseReward * multiplier);
        percentage = `${Math.floor(multiplier * 100)}%`;
    } else if (levelDifference > 0) {
        const increasePercentage = levelDifference * 0.10;
        const multiplier = Math.min(3, 1 + increasePercentage);
        reward = Math.floor(baseReward * multiplier);
        percentage = `${Math.floor(multiplier * 100)}%`;
    } else {
        reward = baseReward;
        percentage = "100%";
    }

    return { reward, percentage };
};

// Simulate a single round
const simulateRound = (
    roundNumber: number,
    player1: FightParticipant,
    player2: FightParticipant
): FightRound => {
    const description: string[] = [];
    let winner: 'player1' | 'player2';
    let criticalHit = false;
    let luckEvent = false;

    // Calculate round score based on attributes + luck
    const player1RoundScore = calculateRoundScore(player1, roundNumber);
    const player2RoundScore = calculateRoundScore(player2, roundNumber);

    // Add luck factor (15% chance for luck event)
    const luckRoll = Math.random();
    if (luckRoll < 0.15) {
        luckEvent = true;
        // Luck can swing the round
        if (Math.random() < 0.5) {
            player1RoundScore.total += 20;
        } else {
            player2RoundScore.total += 20;
        }
    }

    // Check for critical hits (based on dexterity)
    const crit1 = Math.random() < (player1.attributes.dexterity / 100);
    const crit2 = Math.random() < (player2.attributes.dexterity / 100);

    if (crit1 && !crit2) {
        criticalHit = true;
        player1RoundScore.total += 15;
    } else if (crit2 && !crit1) {
        criticalHit = true;
        player2RoundScore.total += 15;
    }

    // Determine winner
    winner = player1RoundScore.total > player2RoundScore.total ? 'player1' : 'player2';
    const winnerPlayer = winner === 'player1' ? player1 : player2;
    const loserPlayer = winner === 'player1' ? player2 : player1;

    // Generate round description based on fight dynamics
    description.push(`ROUND ${roundNumber}:`);

    // Determine fight style based on attributes
    const fasterPlayer = player1.attributes.agility > player2.attributes.agility ? player1 : player2;
    const strongerPlayer = player1.attributes.strength > player2.attributes.strength ? player1 : player2;
    const smarterPlayer = player1.attributes.intelligence > player2.attributes.intelligence ? player1 : player2;

    // Opening moves - vary based on round and attributes
    if (roundNumber === 1) {
        // First round - cautious approach
        if (smarterPlayer.attributes.intelligence > 15) {
            description.push(`• ${smarterPlayer.username} uurib vastast hoolikalt (Intelligentsus: ${smarterPlayer.attributes.intelligence})`);
        } else {
            description.push(`• ${fasterPlayer.username} alustab kiirete löökidega (Kiirus: ${fasterPlayer.attributes.agility})`);
        }
    } else if (roundNumber <= 3) {
        // Main action rounds
        const actionType = Math.random();
        if (actionType < 0.3) {
            description.push(`• ${strongerPlayer.username} kasutab jõulisi löoke (Jõud: ${strongerPlayer.attributes.strength})`);
        } else if (actionType < 0.6) {
            description.push(`• ${fasterPlayer.username} proovib kiireid kombinatsioone`);
        } else {
            description.push(`• Mõlemad võitlejad vahetavad hoogsaid löoke`);
        }
    } else {
        // Later rounds - fatigue sets in
        const endurantPlayer = player1.attributes.endurance > player2.attributes.endurance ? player1 : player2;
        description.push(`• ${endurantPlayer.username} näitab paremat vastupidavust (Vastupidavus: ${endurantPlayer.attributes.endurance})`);
    }

    // Defense and counter moves
    const defenderEndurance = loserPlayer.attributes.endurance;
    const defenderIntelligence = loserPlayer.attributes.intelligence;

    if (defenderEndurance > 12 && defenderIntelligence > 10) {
        description.push(`• ${loserPlayer.username} kaitseb targalt ja blokeerib rünnakuid`);
    } else if (defenderEndurance > 15) {
        description.push(`• ${loserPlayer.username} talub löögid ära, kuid ei saa vasturündeid`);
    } else {
        description.push(`• ${loserPlayer.username} satub raskustesse kaitsmisel`);
    }

    // Critical hit description
    if (criticalHit) {
        const critPlayer = winner === 'player1' ? player1 : player2;
        const critStyles = [
            `maandab täpse vasakukäe`,
            `tabab täpselt lõualuud`,
            `leiab vastase kaitsest ava`,
            `maandab võimsa paremat kätt`
        ];
        const randomCritStyle = critStyles[Math.floor(Math.random() * critStyles.length)];
        description.push(`• ${critPlayer.username} ${randomCritStyle} - KRIITILINE TABAMUS!`);
    }

    // Luck event description
    if (luckEvent) {
        const luckyPlayer = winner === 'player1' ? player1 : player2;
        const luckStyles = [
            `leiab ootamatu ava`,
            `kasutab vastase eksimust`,
            `saab ootamatu šansi`,
            `tabab õnneliku löö gi`
        ];
        const randomLuckStyle = luckStyles[Math.floor(Math.random() * luckStyles.length)];
        description.push(`• [ÕNN] ${luckyPlayer.username} ${randomLuckStyle}!`);
    }

    // Round conclusion with variety
    if (criticalHit || luckEvent) {
        const impactStyles = [
            `kõigub, kuid püsib püsti`,
            `taandub ringile`,
            `vajab hetke taastumiseks`,
            `kaotab hetkeks tasakaalu`
        ];
        const randomImpact = impactStyles[Math.floor(Math.random() * impactStyles.length)];
        description.push(`• ${loserPlayer.username} ${randomImpact}`);
    } else {
        // Normal conclusion
        const conclusionStyles = [
            `domineerib vooru lõpus`,
            `võtab kontrolli enda kätte`,
            `lõpetab vooru tugevamalt`,
            `näitab paremat tehnikat`
        ];
        const randomConclusion = conclusionStyles[Math.floor(Math.random() * conclusionStyles.length)];
        description.push(`• ${winnerPlayer.username} ${randomConclusion}`);
    }

    description.push(`Vooru võitja: ${winnerPlayer.username}`);

    return {
        roundNumber,
        description,
        winner,
        criticalHit,
        luckEvent
    };
};

// Calculate round score based on attributes with dynamic weighting
const calculateRoundScore = (player: FightParticipant, roundNumber: number) => {
    const attrs = player.attributes;

    // Base score from all attributes
    let total = 0;

    // Round-specific attribute importance
    if (roundNumber === 1) {
        // Early round - intelligence and dexterity more important
        total += attrs.strength * 1.0;
        total += attrs.agility * 1.2;
        total += attrs.dexterity * 1.3;
        total += attrs.endurance * 0.8;
        total += attrs.intelligence * 1.4;
    } else if (roundNumber <= 3) {
        // Mid rounds - balanced, strength and agility peak
        total += attrs.strength * 1.3;
        total += attrs.agility * 1.3;
        total += attrs.dexterity * 1.1;
        total += attrs.endurance * 1.0;
        total += attrs.intelligence * 1.0;
    } else {
        // Late rounds - endurance becomes crucial
        total += attrs.strength * 1.0;
        total += attrs.agility * 0.9;
        total += attrs.dexterity * 1.0;
        total += attrs.endurance * 1.5;
        total += attrs.intelligence * 1.2;
    }

    // Level advantage/disadvantage factor (max 20% bonus/penalty)
    const levelDifference = player.level - 20; // Assume average level is 20
    const levelFactor = 1 + (levelDifference * 0.01); // 1% per level difference
    total *= Math.max(0.8, Math.min(1.2, levelFactor));

    // Add randomness (±25%) for unpredictability
    const randomFactor = 0.75 + (Math.random() * 0.5);
    total *= randomFactor;

    // Underdog bonus - lower level players get slight bonus for upsets
    if (player.level < 25) {
        const underdogBonus = (25 - player.level) * 0.5;
        total += underdogBonus;
    }

    return { total: Math.floor(total) };
};

// Helper function to determine fight style based on attributes
export const getFightStyle = (attributes: FightParticipant['attributes']): string => {
    const { strength, agility, dexterity, endurance, intelligence } = attributes;

    if (strength >= 15 && endurance >= 15) return 'Tanki stiil';
    if (agility >= 15 && dexterity >= 15) return 'Tehniline stiil';
    if (strength >= 15 && agility >= 12) return 'Jõuline stiil';
    if (intelligence >= 15) return 'Taktiline stiil';
    if (endurance >= 15) return 'Vastupidav stiil';

    return 'Tasakaalustatud stiil';
};

// Calculate win probability before fight (for display purposes)
export const calculateWinProbability = (
    player1: FightParticipant,
    player2: FightParticipant
): { player1WinChance: number; player2WinChance: number } => {
    // Simple calculation based on attribute totals and level
    const player1Total = Object.values(player1.attributes).reduce((sum, val) => sum + val, 0) + player1.level;
    const player2Total = Object.values(player2.attributes).reduce((sum, val) => sum + val, 0) + player2.level;

    const totalPower = player1Total + player2Total;
    const player1WinChance = Math.round((player1Total / totalPower) * 100);
    const player2WinChance = 100 - player1WinChance;

    return { player1WinChance, player2WinChance };
};