// src/components/home/DatabaseUpdates.tsx - PARANDATUD VERSIOON
import React, { useState, useEffect, useCallback, useRef } from 'react';
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

    // MUUTUS: kasutame useRef'i pagination jaoks
    const lastDocsRef = useRef<{ [key: number]: DocumentSnapshot }>({});

    const updatesPerPage = 5;

    const loadUpdates = useCallback(async (page: number = 1, reset: boolean = true) => {
        try {
            setLoading(true);
            setError(null);

            let lastDoc: DocumentSnapshot | undefined;

            // MUUTUS: kasutame ref'i mitte state'i
            if (page > 1 && lastDocsRef.current[page - 1]) {
                lastDoc = lastDocsRef.current[page - 1];
            }

            const result = await getUpdatesForPublic(updatesPerPage, lastDoc);

            if (reset) {
                setUpdates(result.updates);
            }

            // MUUTUS: salvestame ref'i, mitte state'i
            if (result.lastDoc) {
                lastDocsRef.current = {
                    ...lastDocsRef.current,
                    [page]: result.lastDoc
                };
            }

            // Calculate total pages
            if (result.hasMore) {
                setTotalPages(page + 1);
            } else {
                setTotalPages(page);
            }

        } catch (error: any) {
            console.error('Error loading updates:', error);
            setError('Viga uuenduste laadimisel');
        } finally {
            setLoading(false);
        }
    }, [updatesPerPage]); // Nüüd pole `lastDocs` dependency's

    // MUUTUS: lisame loadUpdates dependency, aga see ei põhjusta loop'i
    useEffect(() => {
        loadUpdates();
    }, [loadUpdates]);

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
                            className="db-updates__retry-btn"
                            onClick={() => loadUpdates()}
                        >
                            Proovi uuesti
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    if (!loading && updates.length === 0) {
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
                    {updates.map((update, index) => (
                        <div key={update.id || index} className="db-update-card">
                            {update.isNew && (
                                <span className="db-update-card__badge">UUS</span>
                            )}
                            <div className="db-update-card__content">
                                <h3 className="db-update-card__title">{update.title}</h3>
                                <div
                                    className="db-update-card__description"
                                    dangerouslySetInnerHTML={{ __html: update.content }}
                                />
                                <span className="db-update-card__date">
                                    {formatDate(update.createdAt)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="db-updates__pagination">
                        <button
                            className="db-updates__pagination-btn"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                        >
                            ‹
                        </button>
                        <span className="db-updates__pagination-info">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            className="db-updates__pagination-btn"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                        >
                            ›
                        </button>
                    </div>
                )}

                {loading && currentPage > 1 && (
                    <div className="db-updates__loading-pagination">
                        <p>Laadin järgmist lehte...</p>
                    </div>
                )}
            </div>
        </section>
    );
};