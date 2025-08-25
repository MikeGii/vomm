// src/components/dashboard/CacheNotification.tsx
import '../../styles/components/dashboard/CacheNotification.css';

export const CacheNotification: React.FC = () => {

    return (
        <div className="cache-notification">
            <div className="notification-content">
                <div className="notification-icon">
                    <span>⚠️</span>
                </div>
                <div className="notification-text">
                    <div className="notification-title">
                        Mängu täiustamise teadaanne
                    </div>
                    <div className="notification-message">
                        <strong>Aktiivse arenduse tõttu</strong> soovitame regulaarselt välja logida ja sisse logida.
                        Samuti vajuta <strong>Ctrl+F5</strong> (Windows) või <strong>Cmd+Shift+R</strong> (Mac)
                        brauseri cache (vahemälu) tühjendamiseks - see aitab vältida mängus tekkivaid vigu.
                    </div>
                </div>
            </div>
        </div>
    );
};