import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const FloatingButton = ({ onClick }) => {
    return (
        <div className="fixed bottom-8 right-8 z-50">
            <motion.button
                onClick={onClick}
                className="floating-button fixed bottom-8 right-8 z-50"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                    delay: 0.2,
                    type: 'spring',
                }}
            >
                <Plus className="h-7 w-7" />
            </motion.button>
        </div>
    );
};

export default FloatingButton;
