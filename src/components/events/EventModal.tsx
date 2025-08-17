import React, {JSX, useState} from 'react';
import { WorkEvent, EventChoice, EventConsequences } from '../../types/events.types';
import '../../styles/components/events/EventModal.css';

interface EventModalProps {
    event: WorkEvent;
    onChoiceSelect: (choice: EventChoice) => Promise<void>;
    isProcessing: boolean;
}

export const EventModal: React.FC<EventModalProps> = ({
                                                          event,
                                                          onChoiceSelect,
                                                          isProcessing
                                                      }) => {
    const [selectedChoice, setSelectedChoice] = useState<string>('');
    const [showResult, setShowResult] = useState<boolean>(false);
    const [resultText, setResultText] = useState<string>('');

    const handleChoiceClick = async (choice: EventChoice) => {
        if (isProcessing || showResult) return;

        setSelectedChoice(choice.id);
        setResultText(choice.resultText);
        setShowResult(true);

        // Wait 3 seconds to show result, then process
        setTimeout(async () => {
            await onChoiceSelect(choice);
        }, 3000);
    };

    // Helper function to format consequences
    const formatConsequences = (consequences: EventConsequences): JSX.Element[] => {
        const items: JSX.Element[] = [];

        if (consequences.health) {
            const isPositive = consequences.health > 0;
            items.push(
                <span key="health" className={`consequence ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? '❤️' : '💔'} {isPositive ? '+' : ''}{consequences.health} Tervis
                </span>
            );
        }

        if (consequences.money) {
            const isPositive = consequences.money > 0;
            items.push(
                <span key="money" className={`consequence ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? '💰' : '💸'} {isPositive ? '+' : ''}{consequences.money}€
                </span>
            );
        }

        if (consequences.reputation) {
            const isPositive = consequences.reputation > 0;
            items.push(
                <span key="reputation" className={`consequence ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? '⭐' : '😞'} {isPositive ? '+' : ''}{consequences.reputation} Maine
                </span>
            );
        }

        if (consequences.experience) {
            const isPositive = consequences.experience > 0;
            items.push(
                <span key="experience" className={`consequence ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? '✨' : '📉'} {isPositive ? '+' : ''}{consequences.experience} XP
                </span>
            );
        }

        if (items.length === 0) {
            items.push(
                <span key="none" className="consequence neutral">
                    ✓ Tagajärjed puuduvad
                </span>
            );
        }

        return items;
    };

    return (
        <div className="event-modal-backdrop">
            <div className="event-modal">
                {!showResult ? (
                    <>
                        <div className="event-header">
                            <h2>{event.title}</h2>
                        </div>

                        <div className="event-description">
                            <p>{event.description}</p>
                        </div>

                        <div className="event-choices">
                            <h3>Mida teed?</h3>
                            {event.choices.map(choice => (
                                <div key={choice.id} className="choice-container">
                                    <button
                                        className={`choice-button ${selectedChoice === choice.id ? 'selected' : ''}`}
                                        onClick={() => handleChoiceClick(choice)}
                                        disabled={isProcessing || showResult}
                                    >
                                        {choice.text}
                                    </button>
                                    <div className="choice-consequences">
                                        {formatConsequences(choice.consequences)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="event-result">
                        <h3>Tulemus</h3>
                        <p>{resultText}</p>
                        <div className="result-spinner">
                            <div className="spinner"></div>
                            <p>Töö lõpetamine...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};