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
        month: 'long',
        year: 'numeric',
    });
}

function isValidDate(date) {
    if (!date) {
        return false;
    }
    return !isNaN(date.getTime());
}

export function DatePicker({
    date,
    setDate,
    placeholder = 'Sélectionner une date',
    label = null,
    id = 'date',
    disabled = false,
}) {
    const [open, setOpen] = React.useState(false);
    const [month, setMonth] = React.useState(date);
    const [value, setValue] = React.useState(formatDate(date));

    // Synchroniser avec les props
    React.useEffect(() => {
        setValue(formatDate(date));
        setMonth(date);
    }, [date]);
    return (
        <div className="flex flex-col space-y-1">
            {label && <Label htmlFor={id}>{label}</Label>}
            <div className="relative flex gap-2">
                <Input
                    id={id}
                    value={value}
                    placeholder={placeholder}
                    className="bg-background pr-10"
                    disabled={disabled}
                    onChange={(e) => {
                        const inputDate = new Date(e.target.value);
                        setValue(e.target.value);
                        if (isValidDate(inputDate)) {
                            setDate(inputDate);
                            setMonth(inputDate);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setOpen(true);
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
                                setValue(formatDate(selectedDate));
                                setOpen(false);
                            }}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
