import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const FloatingButton = ({ onClick }) => {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            aria-label="Ajouter"
            className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-14 z-50 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg transition-colors duration-200 hover:bg-primary/90 md:bottom-8 md:right-8"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                delay: 0.2,
                type: 'spring',
            }}
        >
            <Plus className="h-5 w-5" />
            <span>Ajouter</span>
        </motion.button>
    );
};

export default FloatingButton;
