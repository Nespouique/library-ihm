import React from 'react';
import { Book, User, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

const BookCard = ({ book, index, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="book-card group"
      onClick={onClick}
    >
      <div className="flex items-start space-x-4 flex-grow">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary shadow-sm group-hover:bg-primary/20 transition-all duration-200">
            <Book className="h-6 w-6" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors truncate-text" title={book.title}>
            {book.title}
          </h3>
          <div className="space-y-1.5">
            <div className="flex items-center text-sm text-muted-foreground" title={book.author}>
              <User className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
              <span className="truncate-text block">{book.author}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Hash className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
              <span>ISBN: {book.isbn}</span>
            </div>
          </div>
        </div>
      </div>
      {book.shelf && (
        <div className="flex items-center text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground truncate-text" title={book.shelf}>
            {book.shelf}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default BookCard;