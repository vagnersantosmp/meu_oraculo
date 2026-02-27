import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'soft';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        try {
            const saved = localStorage.getItem('theme');
            return (saved as Theme) || 'light';
        } catch (e) {
            return 'light';
        }
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove old classes
        root.classList.remove('light', 'dark', 'soft');

        // Add new class
        root.classList.add(theme);

        // Save to local storage
        localStorage.setItem('theme', theme);

        // Handle meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            if (theme === 'dark') metaThemeColor.setAttribute('content', '#111827'); // gray-900
            else if (theme === 'soft') metaThemeColor.setAttribute('content', '#fdfbf7'); // warm white
            else metaThemeColor.setAttribute('content', '#ffffff');
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};
