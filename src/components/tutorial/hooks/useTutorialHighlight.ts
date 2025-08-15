// src/components/tutorial/hooks/useTutorialHighlight.ts
import { useCallback } from 'react';

export const useTutorialHighlight = () => {
    const removeHighlight = useCallback(() => {
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
            el.classList.remove('tutorial-clickable');
        });
    }, []);

    const highlightElement = useCallback((selector: string, makeClickable: boolean = false) => {
        removeHighlight();
        const element = document.querySelector(selector);
        if (element) {
            element.classList.add('tutorial-highlight');
            if (makeClickable) {
                element.classList.add('tutorial-clickable');
            }
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [removeHighlight]);

    return { removeHighlight, highlightElement };
};