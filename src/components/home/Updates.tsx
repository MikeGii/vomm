// src/components/home/Updates.tsx
import React, { useState } from 'react';
import { gameUpdates } from '../../data/updates.data';
import '../../styles/components/Updates.css';

export const Updates: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const updatesPerPage = 5;

    // Calculate pagination
    const totalPages = Math.ceil(gameUpdates.length / updatesPerPage);
    const indexOfLastUpdate = currentPage * updatesPerPage;
    const indexOfFirstUpdate = indexOfLastUpdate - updatesPerPage;
    const currentUpdates = gameUpdates.slice(indexOfFirstUpdate, indexOfLastUpdate);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    return (
        <section className="updates">
            <div className="updates-container">
                <h2 className="updates-title">Uuendused</h2>
                <div className="updates-list">
                    {currentUpdates.map((update) => (
                        <div key={update.id} className="update-card">
                            {update.isNew && <span className="update-new-badge">UUS</span>}
                            <div className="update-content">
                                <h3 className="update-title">{update.title}</h3>
                                <p className="update-description">{update.description}</p>
                                <time className="update-date">
                                    {new Date(update.date).toLocaleDateString('et-EE')}
                                </time>
                            </div>
                        </div>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="updates-pagination">
                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            ←
                        </button>

                        {[...Array(totalPages)].map((_, index) => (
                            <button
                                key={index + 1}
                                className={`pagination-number ${currentPage === index + 1 ? 'active' : ''}`}
                                onClick={() => handlePageChange(index + 1)}
                            >
                                {index + 1}
                            </button>
                        ))}

                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            →
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};