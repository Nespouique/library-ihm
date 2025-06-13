import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

const SearchBar = ({ placeholder, value, onChange }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative max-w-2xl mx-auto mb-12"
    >
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-12 h-12 text-md search-glow shadow-sm bg-white border-border"
        />
      </div>
    </motion.div>
  );
};

export default SearchBar;