import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';

const BookLendDialog = ({ open, onOpenChange, book, onLendBook }) => {
    const [lentTo, setLentTo] = useState('');
    const [lentAt, setLentAt] = useState(null);

    useEffect(() => {
        if (open && book) {
            setLentTo(book.lentTo || '');
            setLentAt(book.lentAt ? new Date(book.lentAt) : null);
        }
    }, [open, book]);

    const handleReturn = () => {
        setLentTo('');
        setLentAt(null);
    };

    const formatDateForSubmission = useCallback((date) => {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    const handleConfirm = () => {
        if (onLendBook) {
            onLendBook(book.id, {
                lentTo: lentTo.trim() || null,
                lentAt: formatDateForSubmission(lentAt),
            });
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="main-title-text">
                        Prêt du livre
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-2 pb-1">
                    <div className="space-y-1">
                        <Label htmlFor="lentTo">Prêté à</Label>
                        <Input
                            id="lentTo"
                            value={lentTo}
                            onChange={(e) => setLentTo(e.target.value)}
                            placeholder="Nom de la personne"
                        />
                    </div>
                    <div className="space-y-1">
                        <DatePicker
                            date={lentAt}
                            setDate={setLentAt}
                            id="lentAt"
                            label="Date du prêt"
                        />
                    </div>

                    <div className="flex justify-center pt-2">
                        <Button
                            type="button"
                            variant="link"
                            onClick={handleReturn}
                            className="text-sm underline"
                        >
                            Livre retourné
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end sm:space-x-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Annuler
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        Confirmer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BookLendDialog;
