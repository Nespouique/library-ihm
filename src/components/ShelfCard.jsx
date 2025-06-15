import React from 'react';
import { SquareLibrary } from 'lucide-react';
import { motion } from 'framer-motion';

const ShelfCard = ({ shelf, index, onClick }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="shelf-card group"
            onClick={onClick}
        >
            <div className="flex items-center space-x-4 flex-grow">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary shadow-sm group-hover:bg-primary/20 transition-all duration-200">
                        <SquareLibrary className="h-6 w-6" />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3
                        className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate-text"
                        title={shelf.name}
                    >
                        {shelf.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {shelf.bookCount || 0} livre(s) sur cette étagère
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default ShelfCard;
