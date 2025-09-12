// src/components/admin/UpdatesManagement.tsx
import React, {useState, useEffect, useCallback} from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { RichTextEditor } from '../ui/RichTextEditor';
import { DatabaseUpdate } from '../../types/updates';
import {
    getAllUpdatesForAdmin,
    createUpdate,
    updateUpdate,
    deleteUpdate,
    toggleUpdateNewStatus
} from '../../services/UpdatesService';
import '../../styles/components/admin/UpdatesManagement.css';

interface UpdateFormData {
    title: string;
    content: string;
    isNew: boolean;
}

export const UpdatesManagement: React.FC = () => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    const [updates, setUpdates] = useState<DatabaseUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingUpdate, setEditingUpdate] = useState<DatabaseUpdate | null>(null);
    const [formData, setFormData] = useState<UpdateFormData>({
        title: '',
        content: '',
        isNew: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadUpdates = useCallback(async () => {
        try {
            setLoading(true);
            const fetchedUpdates = await getAllUpdatesForAdmin();
            setUpdates(fetchedUpdates);
        } catch (error) {
            console.error('Error loading updates:', error);
            showToast('Viga uuenduste laadimisel', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    // Load updates on component mount
    useEffect(() => {
        loadUpdates();
    }, [loadUpdates]);

    const resetForm = () => {
        setFormData({ title: '', content: '', isNew: false });
        setIsCreating(false);
        setEditingUpdate(null);
    };

    const handleStartCreate = () => {
        resetForm();
        setIsCreating(true);
    };

    const handleStartEdit = (update: DatabaseUpdate) => {
        setFormData({
            title: update.title,
            content: update.content,
            isNew: update.isNew
        });
        setEditingUpdate(update);
        setIsCreating(false);
    };

    const handleSubmit = async () => {
        if (!currentUser) return;

        if (!formData.title.trim()) {
            showToast('Pealkiri on kohustuslik', 'error');
            return;
        }

        if (!formData.content.trim()) {
            showToast('Sisu on kohustuslik', 'error');
            return;
        }

        try {
            setIsSubmitting(true);

            if (editingUpdate) {
                // Update existing
                await updateUpdate(
                    editingUpdate.id!,
                    {
                        title: formData.title.trim(),
                        content: formData.content,
                        isNew: formData.isNew
                    },
                    currentUser.uid
                );
                showToast('Uuendus edukalt muudetud!', 'success');
            } else {
                // Create new
                await createUpdate(
                    {
                        title: formData.title.trim(),
                        content: formData.content,
                        isNew: formData.isNew
                    },
                    currentUser.uid
                );
                showToast('Uus uuendus edukalt lisatud!', 'success');
            }

            resetForm();
            await loadUpdates();
        } catch (error) {
            console.error('Error saving update:', error);
            showToast('Viga uuenduse salvestamisel', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (update: DatabaseUpdate) => {
        if (!window.confirm(`Kas oled kindel, et soovid kustutada uuenduse "${update.title}"?`)) {
            return;
        }

        try {
            await deleteUpdate(update.id!);
            showToast('Uuendus edukalt kustutatud', 'success');
            await loadUpdates();
        } catch (error) {
            console.error('Error deleting update:', error);
            showToast('Viga uuenduse kustutamisel', 'error');
        }
    };

    const handleToggleNew = async (update: DatabaseUpdate) => {
        if (!currentUser) return;

        try {
            await toggleUpdateNewStatus(update.id!, !update.isNew, currentUser.uid);
            showToast(
                update.isNew ? 'NEW märge eemaldatud' : 'NEW märge lisatud',
                'success'
            );
            await loadUpdates();
        } catch (error) {
            console.error('Error toggling NEW status:', error);
            showToast('Viga NEW märke muutmisel', 'error');
        }
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

        return dateObj.toLocaleDateString('et-EE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="updates-mgmt">
                <div className="updates-mgmt__loading">Laadin uuendusi...</div>
            </div>
        );
    }

    return (
        <div className="updates-mgmt">
            <div className="updates-mgmt__header">
                <h2>Uuenduste Haldus</h2>
                <p>Lisa, muuda ja halda mängu uuendusi</p>

                <button
                    className="updates-mgmt__btn updates-mgmt__btn--create"
                    onClick={handleStartCreate}
                    disabled={isCreating || editingUpdate !== null}
                >
                    + Lisa uus uuendus
                </button>
            </div>

            {/* Create/Edit Form */}
            {(isCreating || editingUpdate) && (
                <div className="updates-mgmt__form">
                    <h3>{editingUpdate ? 'Muuda uuendust' : 'Lisa uus uuendus'}</h3>

                    <div className="updates-mgmt__field">
                        <label htmlFor="update-title">Pealkiri:</label>
                        <input
                            id="update-title"
                            type="text"
                            className="updates-mgmt__input"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Sisesta uuenduse pealkiri..."
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="updates-mgmt__field">
                        <label>Sisu:</label>
                        <RichTextEditor
                            value={formData.content}
                            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                            placeholder="Kirjelda uuendust..."
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="updates-mgmt__field">
                        <label className="updates-mgmt__checkbox">
                            <input
                                type="checkbox"
                                checked={formData.isNew}
                                onChange={(e) => setFormData(prev => ({ ...prev, isNew: e.target.checked }))}
                                disabled={isSubmitting}
                            />
                            <span>Märgi kui "UUS" uuendus</span>
                        </label>
                    </div>

                    <div className="updates-mgmt__actions">
                        <button
                            className="updates-mgmt__btn updates-mgmt__btn--save"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
                        >
                            {isSubmitting ? 'Salvestamine...' :
                                editingUpdate ? 'Salvesta muudatused' : 'Lisa uuendus'}
                        </button>

                        <button
                            className="updates-mgmt__btn updates-mgmt__btn--cancel"
                            onClick={resetForm}
                            disabled={isSubmitting}
                        >
                            Tühista
                        </button>
                    </div>
                </div>
            )}

            {/* Updates List */}
            <div className="updates-mgmt__list">
                <h3>Kõik uuendused ({updates.length})</h3>

                {updates.length === 0 ? (
                    <div className="updates-mgmt__empty">
                        <p>Ühtegi uuendust pole veel lisatud.</p>
                    </div>
                ) : (
                    <div className="updates-mgmt__grid">
                        {updates.map(update => (
                            <div key={update.id} className="update-item">
                                <div className="update-item__header">
                                    <h4 className="update-item__title">
                                        {update.title}
                                        {update.isNew && <span className="update-item__badge">UUS</span>}
                                    </h4>

                                    <div className="update-item__actions">
                                        <button
                                            className="update-item__btn update-item__btn--toggle"
                                            onClick={() => handleToggleNew(update)}
                                            title={update.isNew ? 'Eemalda NEW märge' : 'Lisa NEW märge'}
                                        >
                                            {update.isNew ? '✓' : '+'}
                                        </button>

                                        <button
                                            className="update-item__btn update-item__btn--edit"
                                            onClick={() => handleStartEdit(update)}
                                            disabled={isCreating || editingUpdate !== null}
                                        >
                                            ✏️
                                        </button>

                                        <button
                                            className="update-item__btn update-item__btn--delete"
                                            onClick={() => handleDelete(update)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                <div
                                    className="update-item__content"
                                    dangerouslySetInnerHTML={{ __html: update.content }}
                                />

                                <div className="update-item__meta">
                                    <span>Loodud: {formatDate(update.createdAt)}</span>
                                    {update.updatedAt && update.updatedBy && (
                                        <span>Viimati muudetud: {formatDate(update.updatedAt)}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};