'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

export function AuthorCombobox({
    options = [],
    value,
    onValueChange,
    placeholder = 'Sélectionner une option...',
    searchPlaceholder = 'Rechercher...',
    className,
    disabled = false,
    onCreateAuthor, // Fonction appelée quand on clique sur "Cliquez ici pour l'ajouter"
}) {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState('');

    const selectedOption = options.find((option) => option.value === value);

    // Filtrage personnalisé pour recherche flexible
    const filteredOptions = React.useMemo(() => {
        if (!searchValue) return options;

        const normalizeString = (str) => {
            return str
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
                .trim();
        };

        const searchNormalized = normalizeString(searchValue);
        const searchWords = searchNormalized
            .split(/\s+/)
            .filter((word) => word.length > 0);

        return options.filter((option) => {
            const labelNormalized = normalizeString(option.label);
            const labelWords = labelNormalized
                .split(/\s+/)
                .filter((word) => word.length > 0);

            // Recherche directe dans le label complet
            if (labelNormalized.includes(searchNormalized)) {
                return true;
            }

            // Si on a plusieurs mots de recherche
            if (searchWords.length > 1) {
                // Vérifier si tous les mots de recherche sont présents (dans n'importe quel ordre)
                const allWordsMatch = searchWords.every((searchWord) =>
                    labelWords.some((labelWord) =>
                        labelWord.includes(searchWord)
                    )
                );

                if (allWordsMatch) return true;

                // Vérifier les correspondances d'ordre inversé pour "prénom nom" vs "nom prénom"
                if (searchWords.length === 2 && labelWords.length >= 2) {
                    const [search1, search2] = searchWords;

                    // Ordre normal : search1 avec premier mot, search2 avec deuxième mot
                    const normalOrder =
                        labelWords[0].includes(search1) &&
                        labelWords[1].includes(search2);

                    // Ordre inversé : search1 avec deuxième mot, search2 avec premier mot
                    const reverseOrder =
                        labelWords[0].includes(search2) &&
                        labelWords[1].includes(search1);

                    if (normalOrder || reverseOrder) return true;
                }
            } else {
                // Pour un seul mot de recherche, vérifier s'il correspond au début d'un mot
                const startsWithSearch = labelWords.some((word) =>
                    word.startsWith(searchNormalized)
                );
                if (startsWithSearch) return true;
            }

            return false;
        });
    }, [options, searchValue]);

    const handleCreateAuthor = () => {
        if (onCreateAuthor) {
            onCreateAuthor(searchValue);
            setOpen(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'h-12 w-full justify-between rounded-xl border border-input bg-background text-foreground backdrop-blur-sm px-4 py-3 text-sm font-normal ring-offset-background hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300',
                        !selectedOption && 'text-muted-foreground',
                        className
                    )}
                    disabled={disabled}
                >
                    <span className="truncate text-left">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[--radix-popover-trigger-width] min-w-[200px] p-0"
                align="start"
            >
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onValueChange={setSearchValue}
                    />
                    <CommandList className="max-h-60 overflow-y-auto">
                        {filteredOptions.length === 0 && searchValue ? (
                            <CommandEmpty>
                                <div className="py-2 px-2 text-sm text-muted-foreground">
                                    Aucun auteur trouvé.{' '}
                                    <button
                                        onClick={handleCreateAuthor}
                                        className="text-primary hover:text-primary/80 underline cursor-pointer"
                                    >
                                        Cliquez ici pour l'ajouter
                                    </button>
                                </div>
                            </CommandEmpty>
                        ) : filteredOptions.length === 0 ? (
                            <CommandEmpty>Aucun auteur trouvé.</CommandEmpty>
                        ) : (
                            <CommandGroup>
                                {filteredOptions.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        onSelect={() => {
                                            onValueChange(
                                                option.value === value
                                                    ? ''
                                                    : option.value
                                            );
                                            setSearchValue('');
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value === option.value
                                                    ? 'opacity-100'
                                                    : 'opacity-0'
                                            )}
                                        />
                                        {option.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
