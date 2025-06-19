'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

function formatDate(date) {
    if (!date) {
        return '';
    }
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function isValidDate(date) {
    if (!date) {
        return false;
    }
    return !isNaN(date.getTime());
}

function parseDateFromString(value) {
    if (!value) return null;

    // Essayer d'abord le format dd/mm/yyyy
    const ddmmyyyyMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
        const [, day, month, year] = ddmmyyyyMatch;
        // Créer la date avec le format correct (year, month-1, day)
        const date = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
        );

        // Vérifier que la date est valide (gère les cas comme 31/02/2023)
        if (
            date.getDate() === parseInt(day) &&
            date.getMonth() === parseInt(month) - 1 &&
            date.getFullYear() === parseInt(year)
        ) {
            return date;
        }
    }

    return null;
}

export function DatePicker({
    date,
    setDate,
    placeholder = 'jj/mm/yyyy',
    label = null,
    id = 'date',
    disabled = false,
    onValidationChange = null, // Callback pour signaler si la date est valide
}) {
    const [open, setOpen] = React.useState(false);
    const [month, setMonth] = React.useState(date || new Date());
    const [value, setValue] = React.useState(formatDate(date));
    const [hasError, setHasError] = React.useState(false);

    // Mettre à jour la valeur affichée quand la prop date change
    React.useEffect(() => {
        setValue(formatDate(date));
        setMonth(date || new Date());
        // Reset l'erreur quand on reçoit une nouvelle date valide
        if (date && isValidDate(date)) {
            setHasError(false);
            onValidationChange?.(true);
        }
    }, [date, onValidationChange]);

    // Fonction pour valider l'input
    const validateInput = (inputValue) => {
        if (!inputValue) {
            // Champ vide = pas d'erreur
            setHasError(false);
            onValidationChange?.(true);
            return true;
        }

        const parsedDate = parseDateFromString(inputValue);
        const isValid = parsedDate !== null;
        setHasError(!isValid);
        onValidationChange?.(isValid);
        return isValid;
    };

    return (
        <div className="flex flex-col space-y-1">
            {label && <Label htmlFor={id}>{label}</Label>}
            <div className="relative flex gap-2">
                <Input
                    id={id}
                    type="text"
                    value={value}
                    placeholder={placeholder}
                    className={`bg-background pr-10 ${
                        hasError
                            ? 'border-destructive focus:border-destructive focus:ring-destructive'
                            : ''
                    }`}
                    maxLength={10}
                    disabled={disabled}
                    onChange={(e) => {
                        const inputValue = e.target.value;
                        setValue(inputValue);

                        const parsedDate = parseDateFromString(inputValue);
                        if (parsedDate) {
                            setDate?.(parsedDate);
                            setMonth(parsedDate);
                        } else if (inputValue === '') {
                            setDate?.(null);
                        }

                        // Valider l'input
                        validateInput(inputValue);
                    }}
                    onBlur={(e) => {
                        // Re-valider au blur pour s'assurer que l'état d'erreur est correct
                        validateInput(e.target.value);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setOpen(true);
                        }
                    }}
                />
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            id="date-picker"
                            variant="ghost"
                            className="absolute top-1/2 right-2 size-6 -translate-y-1/2 text-muted-foreground"
                            disabled={disabled}
                            aria-label="Sélectionner une date"
                        >
                            <CalendarIcon className="size-3.5 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="end"
                        alignOffset={-8}
                        sideOffset={10}
                    >
                        <Calendar
                            mode="single"
                            selected={date}
                            captionLayout="dropdown"
                            month={month}
                            onMonthChange={setMonth}
                            onSelect={(selectedDate) => {
                                setDate?.(selectedDate);
                                setValue(formatDate(selectedDate));
                                setHasError(false); // Reset l'erreur quand on sélectionne du calendrier
                                onValidationChange?.(true);
                                setOpen(false);
                            }}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
