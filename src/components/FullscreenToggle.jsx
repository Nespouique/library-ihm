import React, { useState, useEffect } from 'react';
import { Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';

const FullscreenToggle = () => {
    const [isFullscreenMode, setIsFullscreenMode] = useState(false);

    // Détection du mode plein écran
    const checkFullscreen = () => {
        const isFullScreen =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.matchMedia('(display-mode: fullscreen)').matches ||
            window.navigator.standalone === true;

        return isFullScreen;
    };

    useEffect(() => {
        // Vérifier l'état initial
        setIsFullscreenMode(checkFullscreen());

        const handleChange = () => {
            setIsFullscreenMode(checkFullscreen());
        };

        document.addEventListener('fullscreenchange', handleChange);
        window.addEventListener('resize', handleChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleChange);
            window.removeEventListener('resize', handleChange);
        };
    }, []);

    const handleFullscreenClick = () => {
        const elem = document.documentElement;

        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            // Safari
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            // IE/Edge
            elem.msRequestFullscreen();
        }
    };

    return (
        <div className="fixed bottom-8 left-8 z-50">
            {!isFullscreenMode && (
                <motion.button
                    onClick={handleFullscreenClick}
                    className="floating-button fixed bottom-8 left-8 z-50"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        delay: 0.2,
                        type: 'spring',
                    }}
                >
                    <Maximize2 className="h-7 w-7" />
                </motion.button>
            )}
        </div>
    );
};

export default FullscreenToggle;
