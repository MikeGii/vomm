// src/components/patrol/DepartmentSelector.tsx
import React from 'react';
import { getDepartmentsByPrefecture } from '../../data/prefectures';
import '../../styles/components/patrol/DepartmentSelector.css';

interface DepartmentSelectorProps {
    prefecture: string;
    isAbipolitseinik: boolean;
    currentDepartment?: string | null;
    selectedDepartment: string;
    onDepartmentSelect: (department: string) => void;
    isKadett?: boolean;
}

export const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({
                                                                          prefecture,
                                                                          isAbipolitseinik,
                                                                          currentDepartment,
                                                                          selectedDepartment,
                                                                          onDepartmentSelect,
                                                                          isKadett = false
                                                                      }) => {
    // For academy students, use different departments
    const getAvailableDepartments = () => {
        if (isKadett) {
            return [
                'Sisekaitseakadeemia',
                'Põhja prefektuur',
                'Lääne prefektuur',
                'Lõuna prefektuur',
                'Ida prefektuur'
            ];
        }
        return getDepartmentsByPrefecture(prefecture);
    };

    const departments = getAvailableDepartments();

    // Auto-select for non-abipolitseinik
    React.useEffect(() => {
        if (!isAbipolitseinik && !isKadett && currentDepartment) {
            onDepartmentSelect(currentDepartment);
        }
    }, [isAbipolitseinik, isKadett, currentDepartment, onDepartmentSelect]);

    const getSelectorTitle = () => {
        if (isKadett) return 'Vali praktikakoht';
        return 'Vali tööpiirkond';
    };

    const getSelectorInfo = () => {
        if (isKadett) {
            return 'Kadettina saad valida, kus soovid praktikat läbida või tööampsu teha.';
        }
        if (isAbipolitseinik) {
            return 'Abipolitseinikuna saad valida oma prefektuuri mis tahes piirkonna.';
        }
        return null;
    };

    return (
        <div className="department-selector">
            <h3>{getSelectorTitle()}</h3>

            {(isAbipolitseinik || isKadett) ? (
                <>
                    {getSelectorInfo() && (
                        <p className="selector-info">{getSelectorInfo()}</p>
                    )}
                    <select
                        className="department-dropdown"
                        value={selectedDepartment}
                        onChange={(e) => onDepartmentSelect(e.target.value)}
                    >
                        <option value="">
                            {isKadett ? '-- Vali praktikakoht --' : '-- Vali piirkond --'}
                        </option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>
                                {dept}
                            </option>
                        ))}
                    </select>
                </>
            ) : (
                <div className="department-locked">
                    <p>Sinu määratud piirkond: <strong>{currentDepartment || 'Määramata'}</strong></p>
                    <p className="info-text">Politseiametnikuna oled määratud oma osakonna piirkonda.</p>
                </div>
            )}
        </div>
    );
};