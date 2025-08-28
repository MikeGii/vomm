// src/components/department/tabs/vacantPositions/PositionCard.tsx
import React from 'react';
import { PositionInfo } from '../../../../utils/positionProcessor';
import '../../../../styles/components/department/tabs/vacantPositions/PositionCard.css';

interface PositionCardProps {
    position: PositionInfo;
    onViewDetails: (position: PositionInfo) => void;
}

export const PositionCard: React.FC<PositionCardProps> = ({ position, onViewDetails }) => {
    return (
        <div className="position-card-compact">
            <div className="position-header-compact">
                <div className="position-info-compact">
                    <h4 className="position-name-compact">{position.positionName}</h4>
                    <div className="position-unit-compact">{position.unitName}</div>
                    {position.isGroupLeader && (
                        <span className="leader-badge-compact">Grupijuht</span>
                    )}
                    {position.isUnitLeader && (
                        <span className="leader-badge-compact unit-leader">Talituse juht</span>
                    )}
                </div>
                <div className="position-actions-compact">
                    <button
                        className={`see-more-btn ${position.isCurrentPosition ? 'current-position' : 'available'}`}
                        onClick={() => onViewDetails(position)}
                        disabled={position.isCurrentPosition}
                    >
                        {position.isCurrentPosition ? 'Hetkel töötad' : 'Vaata rohkem'}
                    </button>
                </div>
            </div>
        </div>
    );
};