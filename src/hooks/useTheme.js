import { useState, useEffect } from 'react';

export const useTheme = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkTheme = () => {
            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia(
                '(prefers-color-scheme: dark)'
            ).matches;
            const isDarkMode =
                savedTheme === 'dark' || (!savedTheme && prefersDark);
            setIsDark(isDarkMode);
        };

        // Vérifier le thème initial
        checkTheme();

        // Observer les changements de thème
        const observer = new MutationObserver(() => {
            const isDarkMode =
                document.documentElement.classList.contains('dark');
            setIsDark(isDarkMode);
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        // Observer les changements dans localStorage
        const handleStorageChange = (e) => {
            if (e.key === 'theme') {
                checkTheme();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            observer.disconnect();
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    return isDark;
};
