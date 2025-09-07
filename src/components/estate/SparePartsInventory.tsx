// src/components/estate/SparePartsInventory.tsx

import React, {useState, useEffect, useCallback} from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
    getUninstalledParts,
    installPartOnCar,
    sellPartFromInventory,
    InventoryItem
} from '../../services/InventoryService';
import { getPartById, getPartSellPrice } from '../../data/vehicles/spareParts';
import { getBaseIdFromInventoryId } from '../../utils/inventoryUtils';
import '../../styles/components/estate/SparePartsInventory.css';

interface SparePartsInventoryProps {
    selectedCarId: string | null;
    onPartInstalled: () => void;
}

const SparePartsInventory: React.FC<SparePartsInventoryProps> = ({
                                                                     selectedCarId,
                                                                     onPartInstalled
                                                                 }) => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    const [spareParts, setSpareParts] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [installingPartId, setInstallingPartId] = useState<string | null>(null);
    const [sellingPartId, setSellingPartId] = useState<string | null>(null);

    const loadSpareParts = useCallback(async () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            const parts = await getUninstalledParts(currentUser.uid);
            setSpareParts(parts);
        } catch (error) {
            console.error('Viga varuosade laadimisel:', error);
            showToast('Viga varuosade laadimisel', 'error');
        } finally {
            setLoading(false);
        }
    }, [currentUser, showToast]);

    useEffect(() => {
        loadSpareParts();
    }, [loadSpareParts]);

    const handleInstallPart = async (inventoryItem: InventoryItem) => {
        if (!currentUser || !selectedCarId) return;

        setInstallingPartId(inventoryItem.itemId);

        try {
            await installPartOnCar(currentUser.uid, selectedCarId, inventoryItem.itemId);
            showToast('Osa paigaldatud!', 'success');
            await loadSpareParts();
            onPartInstalled();
        } catch (error: any) {
            console.error('Viga osa paigaldamisel:', error);
            showToast(error.message || 'Viga osa paigaldamisel', 'error');
        } finally {
            setInstallingPartId(null);
        }
    };

    const handleSellPart = async (inventoryItem: InventoryItem) => {
        if (!currentUser) return;

        const baseId = getBaseIdFromInventoryId(inventoryItem.itemId);
        const partData = getPartById(baseId);
        if (!partData) return;

        // UPDATED: Use the actual purchase price for sell calculation
        const sellPrice = getPartSellPrice(baseId, inventoryItem.purchasePrice);

        if (!window.confirm(`Kas oled kindel, et tahad müüa ${partData.name} hinnaga $${sellPrice}?`)) {
            return;
        }

        setSellingPartId(inventoryItem.itemId);

        try {
            await sellPartFromInventory(currentUser.uid, inventoryItem.itemId);
            showToast(`Müüsid ${partData.name} hinnaga $${sellPrice}`, 'success');
            await loadSpareParts();
        } catch (error: any) {
            console.error('Viga osa müümisel:', error);
            showToast(error.message || 'Viga osa müümisel', 'error');
        } finally {
            setSellingPartId(null);
        }
    };

    const getPartIcon = (category: string): string => {
        return `/images/${category}.png`;
    };

    if (loading) {
        return (
            <div className="spare-parts-inventory">
                <div className="loading">Laadin varuosi...</div>
            </div>
        );
    }

    return (
        <div className="spare-parts-inventory">
            <div className="inventory-header">
                <h3>📦 Ostetud varuosad</h3>
                <p>Sinu inventaaris olevad osad ({spareParts.length})</p>
            </div>

            {spareParts.length === 0 ? (
                <div className="no-parts">
                    <p>Sul ei ole ühtegi varuosa inventaaris.</p>
                    <p>Osta varuosi autoturul!</p>
                </div>
            ) : (
                <div className="inventory-grid">
                    {spareParts.map(item => {
                        const baseId = getBaseIdFromInventoryId(item.itemId);
                        const partData = getPartById(baseId);

                        if (!partData) return null;

                        const isInstalling = installingPartId === item.itemId;
                        const isSelling = sellingPartId === item.itemId;
                        const canInstall = selectedCarId !== null;

                        // UPDATED: Calculate sell price using purchase price
                        const sellPrice = getPartSellPrice(baseId, item.purchasePrice);

                        return (
                            <div key={item.itemId} className="inventory-part">
                                <div className="part-header">
                                    <img
                                        src={getPartIcon(partData.category)}
                                        alt={partData.category}
                                        className="part-icon"
                                    />
                                    <span className="part-level">
                                        {partData.level.toUpperCase()}
                                    </span>
                                </div>

                                <h4>{partData.name}</h4>
                                <p className="part-boost">+{partData.powerBoost}% võimsust</p>
                                <p className="part-purchase-info">
                                    Ostetud: ${item.purchasePrice?.toLocaleString() || 'N/A'}
                                </p>

                                <div className="part-actions">
                                    <button
                                        className={`btn-install ${!canInstall ? 'disabled' : ''}`}
                                        onClick={() => handleInstallPart(item)}
                                        disabled={!canInstall || isInstalling || isSelling}
                                        title={!canInstall ? 'Vali enne auto' : 'Paigalda autole'}
                                    >
                                        {isInstalling ? '...' : 'Paigalda'}
                                    </button>

                                    <button
                                        className="btn-sell"
                                        onClick={() => handleSellPart(item)}
                                        disabled={isInstalling || isSelling}
                                        title={`Müü $${sellPrice} eest`}
                                    >
                                        {isSelling ? '...' : `Müü $${sellPrice}`}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SparePartsInventory;