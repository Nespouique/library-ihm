import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const SearchBar = ({ placeholder, value, onChange }) => {
    return (
        <div className="relative max-w-2xl mx-auto mb-12">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="pl-12 h-12 text-md search-glow shadow-sm"
                />
            </div>
        </div>
    );
};

export default SearchBar;
