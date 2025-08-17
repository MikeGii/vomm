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
    // For Kadett students, automatically select Sisekaitseakadeemia
    React.useEffect(() => {
        if (isKadett && selectedDepartment !== 'Sisekaitseakadeemia') {
            onDepartmentSelect('Sisekaitseakadeemia');
        } else if (!isAbipolitseinik && !isKadett && currentDepartment) {
            onDepartmentSelect(currentDepartment);
        }
    }, [isKadett, isAbipolitseinik, currentDepartment, selectedDepartment, onDepartmentSelect]);

    // For academy students who are Kadett, show only Sisekaitseakadeemia
    const getAvailableDepartments = () => {
        if (isKadett) {
            return ['Sisekaitseakadeemia'];
        }
        return getDepartmentsByPrefecture(prefecture);
    };

    const departments = getAvailableDepartments();

    const getSelectorTitle = () => {
        if (isKadett) return 'Töökoht';
        return 'Vali tööpiirkond';
    };

    const getSelectorInfo = () => {
        if (isKadett) {
            return 'Kadettina töötad Sisekaitseakadeemias.';
        }
        if (isAbipolitseinik) {
            return 'Abipolitseinikuna saad valida oma prefektuuri mis tahes piirkonna.';
        }
        return null;
    };

    // Don't show selector for Kadett - just show the locked department
    if (isKadett) {
        return (
            <div className="department-selector">
                <h3>{getSelectorTitle()}</h3>
                <div className="department-locked kadett-department">
                    <p>Sinu töökoht: <strong>Sisekaitseakadeemia</strong></p>
                    <p className="info-text">{getSelectorInfo()}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="department-selector">
            <h3>{getSelectorTitle()}</h3>

            {isAbipolitseinik ? (
                <>
                    {getSelectorInfo() && (
                        <p className="selector-info">{getSelectorInfo()}</p>
                    )}
                    <select
                        className="department-dropdown"
                        value={selectedDepartment}
                        onChange={(e) => onDepartmentSelect(e.target.value)}
                    >
                        <option value="">-- Vali piirkond --</option>
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