import React from 'react';
import { motion } from 'framer-motion';

const AlphabeticalScroller = ({ onLetterClick }) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

  return (
    <motion.div
      className="alphabet-slider"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      {alphabet.map((letter, index) => (
        <motion.div
          key={letter}
          className="alphabet-letter"
          onClick={() => onLetterClick(letter)}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.02 }}
          whileHover={{ scale: 1.1, color: 'var(--primary)' }}
          whileTap={{ scale: 0.95 }}
        >
          {letter}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default AlphabeticalScroller;