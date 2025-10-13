// src/types/server.ts
export interface ServerConfig {
    id: string;
    name: string;
    description: string;
}

export const GAME_SERVERS: Record<string, ServerConfig> = {
    beta: {
        id: 'beta',
        name: 'Beta Maailm',
        description: 'Esimene demo server'
    },
    white: {
        id: 'white',
        name: 'Valge Server',
        description: 'Uus maailm'
    }
};