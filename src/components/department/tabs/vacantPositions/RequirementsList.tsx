// src/components/department/tabs/vacantPositions/RequirementsList.tsx
import React from 'react';
import '../../../../styles/components/department/tabs/vacantPositions/RequirementsList.css';

interface RequirementsListProps {
    requirements: string[];
    missingRequirements: string[];
}

export const RequirementsList: React.FC<RequirementsListProps> = ({
                                                                      requirements,
                                                                      missingRequirements
                                                                  }) => {
    const createUnifiedRequirements = () => {
        const unifiedRequirements: Array<{text: string, status: 'met' | 'missing', id: string}> = [];
        const processedRequirements = new Set<string>();

        requirements.forEach((req, index) => {
            const reqId = `req-${index}-${req}`;

            if (!processedRequirements.has(req)) {
                processedRequirements.add(req);

                const isMissing = missingRequirements.some(missing => {
                    if (req.includes('Tase') && missing.includes('Tase')) return true;
                    if (req.includes('Kursus:') && missing.includes('Kursus:')) {
                        const reqCourse = req.split('Kursus:')[1]?.trim();
                        const missingCourse = missing.split('Kursus:')[1]?.trim();
                        return reqCourse === missingCourse;
                    }
                    if (req.includes('töötundi') && missing.includes('töötundi')) return true;
                    if ((req.includes('Jõud') && missing.includes('Jõud')) ||
                        (req.includes('Kiirus') && missing.includes('Kiirus')) ||
                        (req.includes('Osavus') && missing.includes('Osavus')) ||
                        (req.includes('Intelligentsus') && missing.includes('Intelligentsus')) ||
                        (req.includes('Vastupidavus') && missing.includes('Vastupidavus'))) return true;
                    if (req.includes('maine') && missing.includes('maine')) return true;
                    return false;
                });

                if (isMissing) {
                    const detailedMissing = missingRequirements.find(missing => {
                        if (req.includes('Tase') && missing.includes('Tase')) return true;
                        if (req.includes('Kursus:') && missing.includes('Kursus:')) {
                            const reqCourse = req.split('Kursus:')[1]?.trim();
                            const missingCourse = missing.split('Kursus:')[1]?.trim();
                            return reqCourse === missingCourse;
                        }
                        if (req.includes('töötundi') && missing.includes('töötundi')) return true;
                        if ((req.includes('Jõud') && missing.includes('Jõud')) ||
                            (req.includes('Kiirus') && missing.includes('Kiirus')) ||
                            (req.includes('Osavus') && missing.includes('Osavus')) ||
                            (req.includes('Intelligentsus') && missing.includes('Intelligentsus')) ||
                            (req.includes('Vastupidavus') && missing.includes('Vastupidavus'))) return true;
                        if (req.includes('maine') && missing.includes('maine')) return true;
                        return false;
                    });

                    unifiedRequirements.push({
                        text: detailedMissing || req,
                        status: 'missing',
                        id: reqId
                    });
                } else {
                    unifiedRequirements.push({
                        text: `${req} (täidetud)`,
                        status: 'met',
                        id: reqId
                    });
                }
            }
        });

        // Add any missing requirements that don't match existing requirements
        missingRequirements.forEach((missing, index) => {
            const missingId = `missing-${index}-${missing}`;

            const alreadyProcessed = unifiedRequirements.some(req =>
                req.text === missing || req.text.includes(missing.split('(')[0]?.trim() || missing)
            );

            if (!alreadyProcessed) {
                unifiedRequirements.push({
                    text: missing,
                    status: 'missing',
                    id: missingId
                });
            }
        });

        return unifiedRequirements;
    };

    const unifiedRequirements = createUnifiedRequirements();

    return (
        <div className="requirements-unified">
            <h4>Nõuded:</h4>
            <div className="requirements-list-unified">
                {unifiedRequirements.map((req, index) => (
                    <div
                        key={req.id}
                        className={`requirement-row ${req.status === 'met' ? 'requirement-met' : 'requirement-missing'}`}
                    >
                        <span className="requirement-number">{index + 1}.</span>
                        <span className="requirement-text">{req.text}</span>
                        <span className={`requirement-status ${req.status}`}>
                            {req.status === 'met' ? '✓' : '✗'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};