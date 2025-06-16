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

function formatDateForDisplay(date) {
    if (!date) {
        return '';
    }
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function parseDateFromString(dateString) {
    if (!dateString) return null;

    // Remove any non-digit characters except slashes
    const cleaned = dateString.replace(/[^\d\/]/g, '');

    // Check if it matches dd/mm/yyyy format
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = cleaned.match(dateRegex);

    if (match) {
        const [, day, month, year] = match;
        const date = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
        );

        // Validate the date is real (handles things like 31/02/2023)
        if (
            date.getDate() === day &&
            date.getMonth() === month - 1 &&
            date.getFullYear() === year
        ) {
            return date;
        }
    }

    return null;
}

function formatInputValue(value) {
    // Auto-format as user types: add slashes automatically
    const digits = value.replace(/\D/g, '');

    if (digits.length <= 2) {
        return digits;
    } else if (digits.length <= 4) {
        return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
        return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
}

export function DatePicker({
    date,
    setDate,
    placeholder = 'jj/mm/aaaa',
    label = null,
    id = 'date',
    disabled = false,
}) {
    const [open, setOpen] = React.useState(false);
    const [month, setMonth] = React.useState(date || new Date());
    const [inputValue, setInputValue] = React.useState(
        formatDateForDisplay(date)
    );

    // Synchroniser avec les props
    React.useEffect(() => {
        setInputValue(formatDateForDisplay(date));
        if (date) {
            setMonth(date);
        }
    }, [date]);
    return (
        <div className="flex flex-col space-y-1">
            {label && <Label htmlFor={id}>{label}</Label>}
            <div className="relative flex gap-2">
                <Input
                    id={id}
                    type="text"
                    value={inputValue}
                    placeholder={placeholder}
                    className="bg-background pr-10"
                    disabled={disabled}
                    maxLength={10}
                    onChange={(e) => {
                        const formatted = formatInputValue(e.target.value);
                        setInputValue(formatted);

                        // Try to parse the date
                        const parsedDate = parseDateFromString(formatted);
                        if (parsedDate) {
                            setDate(parsedDate);
                            setMonth(parsedDate);
                        } else if (formatted === '') {
                            setDate(null);
                        }
                    }}
                    onBlur={() => {
                        // On blur, if we have a partial date, try to parse it
                        if (inputValue && !parseDateFromString(inputValue)) {
                            // If invalid, reset to the current date or empty
                            setInputValue(formatDateForDisplay(date));
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setOpen(true);
                        }
                        // Allow backspace, delete, arrow keys, etc.
                        if (
                            e.key === 'Backspace' ||
                            e.key === 'Delete' ||
                            e.key === 'ArrowLeft' ||
                            e.key === 'ArrowRight'
                        ) {
                            return;
                        }
                        // Only allow digits and slash
                        if (!/[\d\/]/.test(e.key)) {
                            e.preventDefault();
                        }
                    }}
                />{' '}
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
                                setDate(selectedDate);
                                setInputValue(
                                    formatDateForDisplay(selectedDate)
                                );
                                setOpen(false);
                            }}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
