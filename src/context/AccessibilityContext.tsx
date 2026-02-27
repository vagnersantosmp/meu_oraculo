import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface AccessibilityContextType {
    fontSize: number;
    setFontSize: (size: number) => void;
    highContrast: boolean;
    setHighContrast: (enabled: boolean) => void;
    contrastLevel: number;
    setContrastLevel: (level: number) => void;
    brightness: number;
    setBrightness: (level: number) => void;
    resetAccessibility: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
    // Load from local storage or set defaults
    const [fontSize, setFontSize] = useState<number>(() => {
        const stored = localStorage.getItem('a11y-font-size');
        return stored ? parseFloat(stored) : 1;
    });

    const [highContrast, setHighContrast] = useState<boolean>(() => {
        return localStorage.getItem('a11y-high-contrast') === 'true';
    });

    const [contrastLevel, setContrastLevel] = useState<number>(() => {
        const stored = localStorage.getItem('a11y-contrast-level');
        return stored ? parseFloat(stored) : 1;
    });

    const [brightness, setBrightness] = useState<number>(() => {
        const stored = localStorage.getItem('a11y-brightness');
        return stored ? parseFloat(stored) : 1;
    });

    // Save to localStorage when changed
    useEffect(() => {
        localStorage.setItem('a11y-font-size', fontSize.toString());
        localStorage.setItem('a11y-high-contrast', highContrast.toString());
        localStorage.setItem('a11y-contrast-level', contrastLevel.toString());
        localStorage.setItem('a11y-brightness', brightness.toString());
    }, [fontSize, highContrast, contrastLevel, brightness]);

    // Apply to Document HTML
    useEffect(() => {
        const html = document.documentElement;

        // CSS Variables for scaling, brightness, and contrast filter
        html.style.setProperty('--a11y-font-scale', `${fontSize * 16}px`);
        html.style.setProperty('--a11y-brightness', brightness.toString());
        html.style.setProperty('--a11y-contrast', contrastLevel.toString());

        // High contrast class
        if (highContrast) {
            html.classList.add('high-contrast');
        } else {
            html.classList.remove('high-contrast');
        }
    }, [fontSize, highContrast, contrastLevel, brightness]);

    const resetAccessibility = () => {
        setFontSize(1);
        setHighContrast(false);
        setContrastLevel(1);
        setBrightness(1);
    };

    return (
        <AccessibilityContext.Provider value={{
            fontSize, setFontSize,
            highContrast, setHighContrast,
            contrastLevel, setContrastLevel,
            brightness, setBrightness,
            resetAccessibility
        }}>
            {children}
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (context === undefined) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
}
