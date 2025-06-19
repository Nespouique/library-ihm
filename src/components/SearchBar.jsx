import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const SearchBar = ({ placeholder, value, onChange, rightIcon, onRightIconClick, rightIconTitle }) => {
    return (
        <div className="relative max-w-2xl mx-auto mb-12">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none" />
                <Input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="pl-12 h-12 text-md search-glow shadow-sm"
                />
                {rightIcon && (
                    <button
                        onClick={onRightIconClick}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-primary hover:text-primary/80 transition-colors cursor-pointer z-10"
                        title={rightIconTitle}
                        type="button"
                    >
                        {rightIcon}
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;
