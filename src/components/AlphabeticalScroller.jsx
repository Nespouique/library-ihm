import React from 'react';
import { motion } from 'framer-motion';

const AlphabeticalScroller = ({ onLetterClick }) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const allButtons = ['#', ...alphabet];

    return (
        <motion.div
            className="alphabet-scroller-horizontal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <div className="flex justify-center gap-0.5 p-2 overflow-x-auto">
                {allButtons.map((char, index) => (
                    <motion.button
                        key={char}
                        className="alphabet-letter-btn"
                        onClick={() => onLetterClick(char)}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: index * 0.01 }}
                        whileHover={{ 
                            scale: 1.1,
                            transition: { duration: 0.1 }
                        }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {char}
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
};

export default AlphabeticalScroller;
