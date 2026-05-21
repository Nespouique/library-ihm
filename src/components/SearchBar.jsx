import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const SearchBar = ({
    placeholder,
    value,
    onChange,
    rightIcon,
    onRightIconClick,
    rightIconTitle,
}) => {
    return (
        <div className="relative mx-auto mb-6 w-full max-w-none sm:mb-12 sm:max-w-2xl">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none" />
                <Input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`h-12 pl-12 text-base shadow-sm search-glow sm:text-sm ${rightIcon ? 'pr-14' : ''}`}
                />
                {rightIcon && (
                    <button
                        onClick={onRightIconClick}
                        className="absolute right-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-primary transition-colors hover:text-primary/80"
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
