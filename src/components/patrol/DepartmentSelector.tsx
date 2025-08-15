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
}

export const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({
                                                                          prefecture,
                                                                          isAbipolitseinik,
                                                                          currentDepartment,
                                                                          selectedDepartment,
                                                                          onDepartmentSelect
                                                                      }) => {
    const departments = getDepartmentsByPrefecture(prefecture);

    // If police officer with department, auto-select it
    React.useEffect(() => {
        if (!isAbipolitseinik && currentDepartment) {
            onDepartmentSelect(currentDepartment);
        }
    }, [isAbipolitseinik, currentDepartment, onDepartmentSelect]);

    return (
        <div className="department-selector">
            <h3>Vali tööpiirkond</h3>

            {isAbipolitseinik ? (
                <>
                    <p className="selector-info">
                        Abipolitseinikuna saad valida oma prefektuuri mis tahes piirkonna.
                    </p>
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