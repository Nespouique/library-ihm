import React from 'react';
import { motion } from 'framer-motion';

const AlphabeticalScroller = ({ onLetterClick }) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const allButtons = ['#', ...alphabet];

    return (
        <div className="alphabet-scroller-horizontal">
            <div className="flex justify-center gap-0.5 p-2 overflow-x-auto">
                {allButtons.map((char) => (
                    <motion.button
                        key={char}
                        className="alphabet-letter-btn"
                        onClick={() => onLetterClick(char)}
                        whileHover={{
                            scale: 1.1,
                            transition: { duration: 0.1 },
                        }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {char}
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

export default AlphabeticalScroller;
