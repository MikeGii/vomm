// src/components/tutorial/config/tutorialConfig.ts
export const TUTORIAL_CONFIG = {
    // Waiting times for different actions
    waitingTimes: {
        course: 20, // seconds
        work: 20, // seconds
        navigation: 500 // milliseconds
    },

    // Mobile breakpoint
    mobileBreakpoint: 768,

    // Tutorial box dimensions
    boxDimensions: {
        desktop: {
            maxWidth: 400,
            maxHeight: 'auto'
        },
        mobile: {
            maxWidth: '90%',
            maxHeight: '40vh'
        }
    },

    // Animation durations
    animations: {
        fadeIn: 500,
        slideIn: 300,
        highlight: 2000
    }
};