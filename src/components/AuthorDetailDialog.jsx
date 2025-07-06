import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Users, BookOpen } from 'lucide-react';

const AuthorDetailDialog = ({
    author,
    books = [],
    open,
    onOpenChange,
    onNavigateToBooks,
}) => {
    if (!author) return null;

    const handleViewBooks = () => {
        onNavigateToBooks(`${author.firstName} ${author.lastName}`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="main-title-text text-2xl">
                        {author.firstName} {author.lastName}
                    </DialogTitle>
                    {/* Lien "En savoir plus" pour l'auteur */}
                    <div className="text-left mt-2">
                        <a
                            href={`https://www.google.com/search?q=Auteur+${encodeURIComponent(author.firstName + ' ' + author.lastName)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground underline text-sm italic transition-colors"
                        >
                            En savoir plus...
                        </a>
                    </div>
                </DialogHeader>

                <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto pr-2">
                    {books.length > 0 && (
                        <div>
                            <h4 className="font-medium mb-2 text-foreground flex items-center">
                                <BookOpen className="h-5 w-5 mr-2 text-primary" />
                                Livres dans la bibliothèque ({books.length}) :
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2">
                                {books.map((book) => (
                                    <li key={book.id}>{book.title}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {books.length === 0 && (
                        <div className="flex items-center text-sm text-muted-foreground">
                            <BookOpen className="h-5 w-5 mr-2 text-primary" />
                            Aucun livre de cet auteur dans la bibliothèque.
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
                        onClick={handleViewBooks}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        <Users className="h-4 w-4 mr-2" />
                        Voir les livres
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AuthorDetailDialog;
