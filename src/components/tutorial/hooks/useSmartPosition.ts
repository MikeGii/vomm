// src/components/tutorial/hooks/useSmartPosition.ts
import { useState, useEffect, useCallback } from 'react';

interface Position {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
    transform?: string;
}

export const useSmartPosition = (
    targetSelector: string,
    preferredPosition: 'top' | 'bottom' | 'left' | 'right',
    isActive: boolean = true
) => {
    const [position, setPosition] = useState<Position>({});
    const [arrowPosition, setArrowPosition] = useState<string>('');

    const calculatePosition = useCallback(() => {
        if (!isActive || !targetSelector || targetSelector.trim() === '') {
            // Default position if not active or selector is empty
            setPosition({
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)'
            });
            setArrowPosition('');
            return;
        }

        const target = document.querySelector(targetSelector);
        if (!target) {
            // Default position if target not found
            setPosition({
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)'
            });
            setArrowPosition('');
            return;
        }

        const targetRect = target.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const isMobile = viewportWidth < 768;

        const TUTORIAL_BOX_WIDTH = isMobile ? viewportWidth * 0.9 : 400;
        const TUTORIAL_BOX_HEIGHT = 250; // Approximate
        const MARGIN = 20;

        let finalPosition: Position = {};
        let arrow = '';

        // Mobile-first positioning
        if (isMobile) {
            // Always position at bottom of screen for mobile
            finalPosition = {
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
            };

            // Calculate arrow position based on element location
            const centerX = targetRect.left + targetRect.width / 2;
            const screenCenterX = viewportWidth / 2;

            if (Math.abs(centerX - screenCenterX) < 50) {
                arrow = 'bottom-arrow';
            } else if (centerX < screenCenterX) {
                arrow = 'bottom-arrow-left';
            } else {
                arrow = 'bottom-arrow-right';
            }
        } else {
            // Desktop positioning logic
            const spaceAbove = targetRect.top;
            const spaceBelow = viewportHeight - targetRect.bottom;

            // Try preferred position first, then find best alternative
            if (preferredPosition === 'bottom' && spaceBelow > TUTORIAL_BOX_HEIGHT + MARGIN) {
                finalPosition = {
                    top: `${targetRect.bottom + MARGIN}px`,
                    left: `${Math.max(MARGIN, Math.min(targetRect.left, viewportWidth - TUTORIAL_BOX_WIDTH - MARGIN))}px`
                };
                arrow = 'top-arrow';
            } else if (preferredPosition === 'top' && spaceAbove > TUTORIAL_BOX_HEIGHT + MARGIN) {
                finalPosition = {
                    bottom: `${viewportHeight - targetRect.top + MARGIN}px`,
                    left: `${Math.max(MARGIN, Math.min(targetRect.left, viewportWidth - TUTORIAL_BOX_WIDTH - MARGIN))}px`
                };
                arrow = 'bottom-arrow';
            } else if (spaceBelow > spaceAbove) {
                finalPosition = {
                    top: `${targetRect.bottom + MARGIN}px`,
                    left: `${Math.max(MARGIN, Math.min(targetRect.left, viewportWidth - TUTORIAL_BOX_WIDTH - MARGIN))}px`
                };
                arrow = 'top-arrow';
            } else {
                finalPosition = {
                    bottom: `${viewportHeight - targetRect.top + MARGIN}px`,
                    left: `${Math.max(MARGIN, Math.min(targetRect.left, viewportWidth - TUTORIAL_BOX_WIDTH - MARGIN))}px`
                };
                arrow = 'bottom-arrow';
            }
        }

        setPosition(finalPosition);
        setArrowPosition(arrow);
    }, [targetSelector, preferredPosition, isActive]);

    useEffect(() => {
        if (!isActive || !targetSelector || targetSelector.trim() === '') return;

        calculatePosition();

        const handleResize = () => calculatePosition();
        const handleScroll = () => calculatePosition();

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, true);

        // Use a more conservative observer
        const timeoutId = setTimeout(() => {
            calculatePosition();
        }, 100);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll, true);
            clearTimeout(timeoutId);
        };
    }, [calculatePosition, isActive, targetSelector]);

    return { position, arrowPosition };
};