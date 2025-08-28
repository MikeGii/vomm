// src/components/department/tabs/vacantPositions/PositionModal.tsx
import React from 'react';
import { PositionInfo } from '../../../../utils/positionProcessor';
import { RequirementsList } from './RequirementsList';
import '../../../../styles/components/department/tabs/vacantPositions/PositionModal.css';

interface PositionModalProps {
    position: PositionInfo;
    onClose: () => void;
    onAction: (positionId: string, actionType: 'switch' | 'apply') => void;
    isProcessing: boolean;
}

export const PositionModal: React.FC<PositionModalProps> = ({
                                                                position,
                                                                onClose,
                                                                onAction,
                                                                isProcessing
                                                            }) => {
    const getButtonConfig = () => {
        if (position.actionType === 'switch') {
            return {
                text: isProcessing ? 'Liigub...' : position.canSwitch ? 'Liitu üksusega' : 'Ei saa liituda',
                className: position.canSwitch ? 'available' : 'unavailable',
                disabled: !position.canSwitch || isProcessing
            };
        } else {
            return {
                text: isProcessing ? 'Esitan...' : position.canApply ? 'Kandideeri' : 'Ei saa kandideerida',
                className: position.canApply ? 'available' : 'unavailable',
                disabled: !position.canApply || isProcessing
            };
        }
    };

    const buttonConfig = getButtonConfig();

    return (
        <div className="position-modal-overlay" onClick={onClose}>
            <div className="position-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title-section">
                        <h3>{position.positionName}</h3>
                        <div className="position-unit-modal">{position.unitName}</div>
                        {position.isGroupLeader && (
                            <span className="leader-badge">Grupijuht</span>
                        )}
                        {position.isUnitLeader && (
                            <span className="leader-badge unit-leader">Talituse juht</span>
                        )}
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="modal-body">
                    {(position.isGroupLeader || position.isUnitLeader) && position.availabilityStatus && (
                        <div className="availability-section">
                            <div className={`availability-status ${position.availabilityStatus === 'Koht saadaval' ? 'available' : 'full'}`}>
                                <span className="status-indicator">
                                    {position.availabilityStatus === 'Koht saadaval' ? '🟢' : '🔴'}
                                </span>
                                <span className="status-text">{position.availabilityStatus}</span>
                            </div>
                        </div>
                    )}

                    <RequirementsList
                        requirements={position.requirements}
                        missingRequirements={position.missingRequirements}
                    />

                    {!position.isCurrentPosition && (
                        <div className="modal-actions">
                            <button
                                className={`modal-action-btn ${buttonConfig.className}`}
                                onClick={() => {
                                    onAction(position.positionId, position.actionType);
                                    onClose();
                                }}
                                disabled={buttonConfig.disabled}
                            >
                                {buttonConfig.text}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};