// src/components/chat/ChatModal.tsx
import React, {useState, useEffect, useRef, useCallback} from 'react';
import { PrefectureMessage } from '../../types/chat';
import { sendPrefectureMessage, listenToRecentMessages, loadOlderMessages } from '../../services/ChatService';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/components/chat/ChatModal.css';

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    prefecture: string;
    currentUserId: string;
    currentUsername: string;
    badgeNumber?: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
                                                        isOpen,
                                                        onClose,
                                                        prefecture,
                                                        currentUserId,
                                                        currentUsername,
                                                        badgeNumber
                                                    }) => {
    const [messages, setMessages] = useState<PrefectureMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { showToast } = useToast();

    const scrollToBottom = useCallback(() => {
        const container = messagesContainerRef.current;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }, []);

// Scroll alla uute sõnumite korral
    useEffect(() => {
        if (!isLoadingMore && messages.length > 0) {
            setTimeout(() => {
                scrollToBottom();
            }, 50);
        }
    }, [messages, isLoadingMore, scrollToBottom]);


// Focus input kui modal avaneb
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const loadMoreOlderMessages = useCallback(async () => {
        if (!hasMoreMessages || isLoadingMore || messages.length === 0) return;

        setIsLoadingMore(true);

        try {
            const oldestMessage = messages[0];
            const olderMessages = await loadOlderMessages(prefecture, oldestMessage);

            if (olderMessages.length === 0) {
                setHasMoreMessages(false);
            } else {
                setMessages(prev => {
                    const existingIds = new Set(prev.map(msg => msg.id));
                    const newMessages = olderMessages.filter(msg => !existingIds.has(msg.id));
                    return [...newMessages, ...prev];
                });

                if (olderMessages.length < 20) {
                    setHasMoreMessages(false);
                }
            }
        } catch (error) {
            console.error('Viga vanemate sõnumite laadimisel:', error);
            showToast('Viga sõnumite laadimisel', 'error');
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasMoreMessages, isLoadingMore, messages, prefecture, showToast]);

    // Kuula uusimaid sõnumeid reaalajas
    useEffect(() => {
        if (!isOpen || !prefecture) return;

        setIsLoading(true);
        setMessages([]);
        setHasMoreMessages(true);

        const unsubscribe = listenToRecentMessages(prefecture, (newMessages) => {
            setMessages(newMessages);

            if (newMessages.length < 20) {
                setHasMoreMessages(false);
            } else {
                setHasMoreMessages(true);
            }

            setIsLoading(false);

            setTimeout(() => {
            }, 100);
        });

        return () => unsubscribe();
    }, [isOpen, prefecture]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || isSending) return;

        if (newMessage.length > 500) {
            showToast('Sõnum on liiga pikk (max 500 tähemärki)', 'error');
            return;
        }

        setIsSending(true);

        try {
            await sendPrefectureMessage(
                currentUserId,
                currentUsername,
                prefecture,
                newMessage,
                badgeNumber
            );
            setNewMessage('');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Viga sõnumi saatmisel', 'error');
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';

        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Praegu';
        if (diffInMinutes < 60) return `${diffInMinutes}m tagasi`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h tagasi`;

        return date.toLocaleDateString('et-EE', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="chat-modal-overlay" onClick={onClose}>
            <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="chat-header">
                    <div className="chat-title">
                        <span className="chat-icon">💬</span>
                        <div>
                            <h3>{prefecture} Chat</h3>
                            <span className="chat-subtitle">
                                {messages.length > 0 ? `${messages.length} sõnumit` : 'Sõnumeid pole'}
                                {hasMoreMessages && ' (lae rohkem...)'}
                            </span>
                        </div>
                    </div>
                    <button className="chat-close-btn" onClick={onClose}>×</button>
                </div>

                {/* Messages */}
                <div className="chat-messages" ref={messagesContainerRef}>
                    {/* Load more indicator */}
                    {isLoadingMore && (
                        <div className="load-more-indicator">
                            <div className="loading-spinner"></div>
                            <span>Laadin vanemaid sõnumeid...</span>
                        </div>
                    )}

                    {/* Load more button */}
                    {hasMoreMessages && !isLoading && !isLoadingMore && messages.length > 0 && (
                        <div className="load-more-container">
                            <button
                                className="load-more-btn"
                                onClick={loadMoreOlderMessages}
                            >
                                Lae rohkem sõnumeid
                            </button>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="chat-loading">
                            <div className="loading-spinner"></div>
                            <span>Laadin sõnumeid...</span>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="chat-empty">
                            <span>👋</span>
                            <p>Sõnumeid pole veel. Alusta vestlust!</p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`message ${message.userId === currentUserId ? 'own-message' : 'other-message'}`}
                            >
                                <div className="message-content">
                                    {message.userId !== currentUserId && (
                                        <div className="message-author">
                                            {message.username}
                                            {message.badgeNumber && (
                                                <span className="badge-number">#{message.badgeNumber}</span>
                                            )}
                                        </div>
                                    )}
                                    <div className="message-text">{message.message}</div>
                                    <div className="message-time">
                                        {formatTime(message.timestamp)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="chat-input-container">
                    <div className="chat-input-wrapper">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Kirjuta sõnum..."
                            maxLength={500}
                            disabled={isSending}
                            className="chat-input"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || isSending}
                            className="chat-send-btn"
                        >
                            {isSending ? '⏳' : '📤'}
                        </button>
                    </div>
                    <div className="char-counter">
                        {newMessage.length}/500
                    </div>
                </div>
            </div>
        </div>
    );
};