import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen, List, Siren } from 'lucide-react';

const ShelfDetailDialog = ({ shelf, books = [], open, onOpenChange }) => {
    if (!shelf) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={books.length > 10 ? 'max-w-lg' : 'max-w-md'}
            >
                <DialogHeader>
                    <DialogTitle className="main-title-text text-2xl">
                        Étagère : {shelf.name}
                    </DialogTitle>
                    <DialogDescription>
                        Contient {books.length} livre(s)
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 max-h-[60vh] overflow-y-auto pr-2">
                    {books.length > 0 ? (
                        <div>
                            <h4 className="font-medium mb-2 text-foreground flex items-center">
                                <List className="h-5 w-5 mr-2 text-primary" />
                                Livres sur cette étagère :
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2">
                                {books.map((book) => (
                                    <li key={book.id}>
                                        {book.title}{' '}
                                        <span className="text-xs text-gray-400">
                                            ({book.author})
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="flex items-center text-sm text-muted-foreground">
                            <BookOpen className="h-5 w-5 mr-2 text-primary" />
                            Cette étagère est actuellement vide.
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Fermer
                    </Button>
                    <Button
                        onClick={() => {
                            // TODO: Implémenter la fonctionnalité de repérage d'étagère
                            console.log("Repérer l'étagère:", shelf.name);
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        <Siren className="h-4 w-4 mr-2" />
                        Repérer l'étagère
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ShelfDetailDialog;
