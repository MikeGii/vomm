// src/components/ServerSwitcher/ServerSwitcher.tsx
import React, { useState, useEffect } from 'react';
import { GAME_SERVERS } from '../../types/server';
import { getCurrentServer, setCurrentServer } from '../../utils/serverUtils';
import { cacheManager } from '../../services/CacheManager';
import './ServerSwitcher.css';

export const ServerSwitcher: React.FC = () => {
    const [currentServer, setCurrentServerState] = useState<string>(getCurrentServer());
    const [showModal, setShowModal] = useState(false);
    const [selectedServer, setSelectedServer] = useState<string | null>(null);
    const [isChanging, setIsChanging] = useState(false);

    useEffect(() => {
        // Update state if localStorage changes
        const handleStorageChange = () => {
            setCurrentServerState(getCurrentServer());
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const handleServerClick = (serverId: string) => {
        if (serverId === currentServer) {
            return; // Already on this server
        }

        setSelectedServer(serverId);
        setShowModal(true);
    };

    const confirmServerSwitch = async () => {
        if (!selectedServer) return;

        setIsChanging(true);

        console.log(`🔄 Switching server - clearing cache for ${selectedServer}`);
        cacheManager.clearAll();

        // Save selected server
        setCurrentServer(selectedServer);

        // Reload the page to reinitialize all contexts with new server
        window.location.reload();
    };

    const cancelServerSwitch = () => {
        setShowModal(false);
        setSelectedServer(null);
    };

    return (
        <>
            <div className="server-switcher">
                <div className="server-switcher__current">
                    <span className="server-switcher__label">Server:</span>
                    <div className="server-switcher__dropdown">
                        <button
                            className="server-switcher__button"
                            onClick={() => document.querySelector('.server-switcher__menu')?.classList.toggle('show')}
                        >
                            {GAME_SERVERS[currentServer]?.name || 'Vali server'}
                            <span className="server-switcher__arrow">▼</span>
                        </button>

                        <div className="server-switcher__menu">
                            {Object.values(GAME_SERVERS).map((server) => {
                                const isCurrent = server.id === currentServer;

                                return (
                                    <div
                                        key={server.id}
                                        className={`
                                            server-switcher__item 
                                            ${isCurrent ? 'server-switcher__item--current' : ''}
                                        `}
                                        onClick={() => handleServerClick(server.id)}
                                    >
                                        <div className="server-switcher__item-header">
                                            <span className="server-switcher__item-name">
                                                {server.name}
                                            </span>
                                            {isCurrent && (
                                                <span className="server-switcher__item-status">
                                                    Aktiivne
                                                </span>
                                            )}
                                        </div>
                                        <div className="server-switcher__item-description">
                                            {server.description}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {showModal && selectedServer && (
                <div className="server-switcher-modal">
                    <div className="server-switcher-modal__overlay" onClick={cancelServerSwitch} />
                    <div className="server-switcher-modal__content">
                        <h2 className="server-switcher-modal__title">
                            Serveri vahetamine
                        </h2>

                        <p className="server-switcher-modal__text">
                            Vahetad serverit: <strong>{GAME_SERVERS[currentServer]?.name}</strong> →
                            <strong> {GAME_SERVERS[selectedServer]?.name}</strong>
                        </p>

                        <p className="server-switcher-modal__info">
                            Sinu praegune progress salvestatakse. Kui sul pole {GAME_SERVERS[selectedServer]?.name} serveris
                            progressi, alustad seal nullist.
                        </p>

                        <div className="server-switcher-modal__actions">
                            <button
                                className="server-switcher-modal__button server-switcher-modal__button--cancel"
                                onClick={cancelServerSwitch}
                                disabled={isChanging}
                            >
                                Tühista
                            </button>
                            <button
                                className="server-switcher-modal__button server-switcher-modal__button--confirm"
                                onClick={confirmServerSwitch}
                                disabled={isChanging}
                            >
                                {isChanging ? 'Vahetan...' : 'Vaheta serverit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};