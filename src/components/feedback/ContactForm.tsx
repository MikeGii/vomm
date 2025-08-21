// src/components/feedback/ContactForm.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlayerStats } from '../../contexts/PlayerStatsContext';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { useToast } from '../../contexts/ToastContext';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../../config/emailjs';
import '../../styles/components/feedback/ContactForm.css';

// Initialize EmailJS with your public key
emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

interface ContactFormData {
    subject: string;
    message: string;
    category: 'bug' | 'suggestion' | 'feedback' | 'other';
}

export const ContactForm: React.FC = () => {
    const { currentUser } = useAuth();
    const { playerStats } = usePlayerStats();
    const { showToast } = useToast();

    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<ContactFormData>({
        subject: '',
        message: '',
        category: 'feedback'
    });

    // Load user data
    useEffect(() => {
        const loadUserData = async () => {
            if (!currentUser) return;

            // Get email from auth
            setEmail(currentUser.email || '');

            // Get username from users collection
            try {
                const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    setUsername(userDoc.data().username || '');
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };

        loadUserData();
    }, [currentUser]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const getCategoryLabel = (category: string): string => {
        switch(category) {
            case 'bug': return 'Viga';
            case 'suggestion': return 'Ettepanek';
            case 'feedback': return 'Tagasiside';
            case 'other': return 'Muu';
            default: return category;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.subject.trim() || !formData.message.trim()) {
            showToast('Palun täida kõik väljad!', 'error');
            return;
        }

        if (formData.message.length < 10) {
            showToast('Sõnum peab olema vähemalt 10 tähemärki pikk!', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Save to Firestore first
            await addDoc(collection(firestore, 'feedback'), {
                userId: currentUser?.uid,
                username: username,
                email: email,
                subject: formData.subject,
                message: formData.message,
                category: formData.category,
                status: 'new',
                createdAt: serverTimestamp(),
                playerLevel: playerStats?.level || 0,
                playerPosition: playerStats?.policePosition || null
            });

            // 2. Send email via EmailJS
            const templateParams = {
                from_name: username || 'Tundmatu kasutaja',
                from_email: email || 'email@puudub.ee',
                category: getCategoryLabel(formData.category),
                subject: formData.subject,
                message: formData.message,
                player_level: playerStats?.level || 0,
                player_position: playerStats?.policePosition || 'Algaja'
            };

            await emailjs.send(
                EMAILJS_CONFIG.SERVICE_ID,
                EMAILJS_CONFIG.TEMPLATE_ID,
                templateParams
            );

            showToast('Tagasiside edukalt saadetud! Täname!', 'success');

            // Reset form
            setFormData({
                subject: '',
                message: '',
                category: 'feedback'
            });
        } catch (error) {
            console.error('Error submitting feedback:', error);
            showToast('Viga tagasiside saatmisel. Proovi hiljem uuesti.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="contact-form-container">

            <div className="developer-notification">
                <div className="notification-icon">ℹ️</div>
                <div className="notification-content">
                    <p>
                        <strong>Head mängijad!</strong> Mäng on pidevas arengus ja alles väga värske ning kuna kogu mängu
                        arendamine ja haldamine on minu kui ainuühe inimese ellu viia, siis palun mõistvat suhtumist!
                        Südamesoov on siiski luua põnev ja kaasahaarav brauseripõhine rollimäng, mis hõlmab endas
                        võimalikult palju reaalseid aspekte politsei töömaastikult Eestis. Siiski on iga Teie ettepanek
                        ja tagasiside mulle oluline parema mängu loomise nimel ja ootan ettepanekuid!
                    </p>
                </div>
            </div>

            <h2 className="form-title">Saada sõnum</h2>
            <p className="form-description">
                Kas sul on mõni idee, probleem või tagasiside? Anna mulle teada!
            </p>

            <form onSubmit={handleSubmit} className="contact-form">
                {/* Category Selection */}
                <div className="form-group">
                    <label htmlFor="category">Kategooria *</label>
                    <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="form-select"
                    >
                        <option value="feedback">Tagasiside</option>
                        <option value="bug">Vea teade</option>
                        <option value="suggestion">Ettepanek</option>
                        <option value="other">Muu</option>
                    </select>
                </div>

                {/* Subject Input */}
                <div className="form-group">
                    <label htmlFor="subject">Teema *</label>
                    <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="Lühike kirjeldus teemast..."
                        className="form-input"
                        maxLength={100}
                        required
                    />
                    <span className="char-count">{formData.subject.length}/100</span>
                </div>

                {/* Message Textarea */}
                <div className="form-group">
                    <label htmlFor="message">Sõnum *</label>
                    <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Kirjelda oma mõtteid, probleemi või ettepanekut..."
                        className="form-textarea"
                        rows={8}
                        maxLength={1000}
                        required
                    />
                    <span className="char-count">{formData.message.length}/1000</span>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="submit-button"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saadan...' : 'Saada'}
                </button>
            </form>
        </div>
    );
};