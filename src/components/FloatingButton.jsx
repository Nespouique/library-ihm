import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const FloatingButton = ({ onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      className="floating-button"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
      whileTap={{ scale: 0.95 }}
    >
      <Plus className="h-7 w-7" />
    </motion.button>
  );
};

export default FloatingButton;