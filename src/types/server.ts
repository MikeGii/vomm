// src/types/server.ts
export interface ServerConfig {
    id: string;
    name: string;
    description: string;
}

export const GAME_SERVERS: Record<string, ServerConfig> = {
    beta: {
        id: 'beta',
        name: 'Beta Server',
        description: 'Algne server'
    },
    white: {
        id: 'white',
        name: 'Valge Server',
        description: 'Uus maailm'
    }
};