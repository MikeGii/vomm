// src/components/home/DatabaseUpdates.tsx
import React, { useState, useEffect } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import { DatabaseUpdate } from '../../types/updates';
import { getUpdatesForPublic } from '../../services/UpdatesService';
import '../../styles/components/DatabaseUpdates.css';

export const DatabaseUpdates: React.FC = () => {
    const [updates, setUpdates] = useState<DatabaseUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [lastDocs, setLastDocs] = useState<{ [key: number]: DocumentSnapshot }>({});

    const updatesPerPage = 5;

    useEffect(() => {
        loadUpdates();
    }, []);

    const loadUpdates = async (page: number = 1, reset: boolean = true) => {
        try {
            setLoading(true);
            setError(null);

            let lastDoc: DocumentSnapshot | undefined;

            if (page > 1 && lastDocs[page - 1]) {
                lastDoc = lastDocs[page - 1];
            }

            const result = await getUpdatesForPublic(updatesPerPage, lastDoc);

            if (reset) {
                setUpdates(result.updates);
            }

            // Store the last document for this page
            if (result.lastDoc) {
                setLastDocs(prev => ({
                    ...prev,
                    [page]: result.lastDoc!
                }));
            }

            // Calculate total pages (approximation since we don't know exact count)
            // We'll show "Next" button if there are more results
            if (result.hasMore) {
                setTotalPages(page + 1); // At least one more page
            } else {
                setTotalPages(page); // This is the last page
            }

        } catch (error) {
            console.error('Error loading updates:', error);
            setError('Viga uuenduste laadimisel');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = async (pageNumber: number) => {
        if (pageNumber === currentPage) return;

        setCurrentPage(pageNumber);
        await loadUpdates(pageNumber);

        // Scroll to top of updates section
        document.querySelector('.db-updates')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    const formatDate = (date: any) => {
        let dateObj: Date;

        if (date?.toDate) {
            dateObj = date.toDate();
        } else if (date instanceof Date) {
            dateObj = date;
        } else {
            return 'Vigane kuupäev';
        }

        return dateObj.toLocaleDateString('et-EE');
    };

    // REMOVED: stripHtmlTags function - we want to keep HTML formatting

    if (loading && currentPage === 1) {
        return (
            <section className="db-updates">
                <div className="db-updates__container">
                    <h2 className="db-updates__title">Uuendused</h2>
                    <div className="db-updates__loading">
                        <p>Laadin uuendusi...</p>
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="db-updates">
                <div className="db-updates__container">
                    <h2 className="db-updates__title">Uuendused</h2>
                    <div className="db-updates__error">
                        <p>{error}</p>
                        <button
                            onClick={() => loadUpdates(1)}
                            className="db-updates__retry-btn"
                        >
                            Proovi uuesti
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    if (updates.length === 0) {
        return (
            <section className="db-updates">
                <div className="db-updates__container">
                    <h2 className="db-updates__title">Uuendused</h2>
                    <div className="db-updates__empty">
                        <p>Uuendusi ei ole veel lisatud.</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="db-updates">
            <div className="db-updates__container">
                <h2 className="db-updates__title">Uuendused</h2>
                <div className="db-updates__list">
                    {updates.map((update) => (
                        <div key={update.id} className="db-update-card">
                            {update.isNew && <span className="db-update-card__badge">UUS</span>}
                            <div className="db-update-card__content">
                                <h3 className="db-update-card__title">{update.title}</h3>
                                {/* CHANGED: Now using dangerouslySetInnerHTML to display rich text */}
                                <div
                                    className="db-update-card__description"
                                    dangerouslySetInnerHTML={{ __html: update.content }}
                                />
                                <time className="db-update-card__date">
                                    {formatDate(update.createdAt)}
                                </time>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="db-updates__pagination">
                        <button
                            className="db-updates__pagination-btn"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || loading}
                        >
                            ←
                        </button>

                        <span className="db-updates__pagination-info">
                            Lehekülg {currentPage} / {totalPages}+
                        </span>

                        <button
                            className="db-updates__pagination-btn"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages || loading}
                        >
                            →
                        </button>
                    </div>
                )}

                {loading && currentPage > 1 && (
                    <div className="db-updates__loading-pagination">
                        <p>Laadin...</p>
                    </div>
                )}
            </div>
        </section>
    );
};