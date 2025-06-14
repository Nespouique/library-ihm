import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Vérifier si un thème est déjà sauvegardé
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia(
            '(prefers-color-scheme: dark)'
        ).matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);

        if (newTheme) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <div className="flex items-center space-x-2">
            <Sun className="w-4 h-4 text-muted-foreground" />
            <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-1 ${
                    isDark ? 'bg-primary' : 'bg-secondary'
                }`}
                role="switch"
                aria-checked={isDark}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform duration-200 shadow-lg ${
                        isDark ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
            </button>
            <Moon className="w-4 h-4 text-muted-foreground" />
        </div>
    );
};

export default ThemeToggle;
