// src/components/chat/ChatFloatingButton.tsx
import React, { useState, useEffect } from 'react';
import { ChatModal } from './ChatModal';
import { usePlayerStats } from '../../contexts/PlayerStatsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/components/chat/ChatFloatingButton.css';

export const ChatFloatingButton: React.FC = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const { playerStats } = usePlayerStats();
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    // Kontrolli kas mängijal on prefecture ja kas see on kehtiv
    const prefecture = playerStats?.prefecture;
    const canUseChat = prefecture && playerStats.policePosition !== null;

    const handleChatToggle = () => {
        if (!canUseChat || !prefecture) {
            if (!prefecture) {
                showToast('Prefektuur puudub - võta ühendust administraatoriga', 'error');
            } else if (prefecture === 'Sisekaitseakadeemia') {
                showToast('Chat on saadaval ainult politseiprefektuurides töötavatele ametnikele', 'error');
            } else if (playerStats?.policePosition === 'kadett') {
                showToast('Kadetid ei saa prefektuuri chat-i kasutada', 'error');
            } else {
                showToast('Chat pole saadaval', 'error');
            }
            return;
        }

        setIsChatOpen(!isChatOpen);

        // Märgi uued sõnumid loetuks kui chat avaneb
        if (!isChatOpen) {
            setHasNewMessages(false);
        }
    };

    // Simuleerime "uued sõnumid" indikaatorit (hiljem saame lisada täpsema jälgimise)
    useEffect(() => {
        if (isChatOpen) {
            setHasNewMessages(false);
        }
    }, [isChatOpen]);

    if (!currentUser || !playerStats) {
        return null;
    }

    return (
        <>
            <button
                className={`chat-floating-btn ${!canUseChat ? 'disabled' : ''} ${hasNewMessages ? 'has-new-messages' : ''}`}
                onClick={handleChatToggle}
                title={canUseChat && prefecture ? `${prefecture} Chat` : 'Chat pole saadaval'}
            >
                <span className="chat-btn-icon">💬</span>
                {hasNewMessages && <span className="new-message-indicator"></span>}
            </button>

            {/* Näita modali ainult kui chat on avatud JA prefecture on olemas */}
            {isChatOpen && canUseChat && prefecture && (
                <ChatModal
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    prefecture={prefecture}
                    currentUserId={currentUser.uid}
                    currentUsername={playerStats.username || 'Tundmatu'}
                    badgeNumber={playerStats.badgeNumber || undefined}
                />
            )}
        </>
    );
};