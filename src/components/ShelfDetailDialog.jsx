import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { List, Siren, MapPin } from 'lucide-react';
import { areKubesAvailable } from '@/lib/kubeUtils';

const ShelfDetailDialog = ({ shelf, books = [], open, onOpenChange }) => {
    const navigate = useNavigate();
    const [kubesAvailable, setKubesAvailable] = useState(false);

    // Vérifier la disponibilité des kubes quand le dialog s'ouvre
    useEffect(() => {
        if (open) {
            areKubesAvailable().then(setKubesAvailable);
        }
    }, [open]);

    if (!shelf) return null;

    // Fonction pour naviguer vers la page kubes avec le kube spécifique mis en évidence
    const handleLocationClick = () => {
        if (shelf.location) {
            onOpenChange(false); // Fermer le dialog
            navigate(`/kubes?highlight=${shelf.location}`);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={books.length > 10 ? 'max-w-lg' : 'max-w-md'}
            >
                <DialogHeader>
                    <DialogTitle className="main-title-text text-2xl">
                        {shelf.name}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Détails de l'étagère et liste des livres qu'elle
                        contient
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                    {/* Emplacement avec icône MapPin - affiché seulement si les kubes sont disponibles */}
                    {kubesAvailable && (
                        <div className="flex items-center">
                            <MapPin className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                            <p>
                                <span className="font-medium">
                                    Emplacement :
                                </span>{' '}
                                {shelf.location ? (
                                    <button
                                        onClick={handleLocationClick}
                                        className="text-primary underline hover:text-primary/80 transition-colors cursor-pointer"
                                    >
                                        {shelf.location}
                                    </button>
                                ) : (
                                    <span className="text-muted-foreground">
                                        Aucun emplacement
                                    </span>
                                )}
                            </p>
                        </div>
                    )}

                    {/* Liste des livres avec icône List */}
                    <div className="flex items-start">
                        <List className="h-5 w-5 mr-3 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium mb-2">
                                {books.length > 0
                                    ? `${books.length} livre${books.length > 1 ? 's' : ''} dans cette étagère :`
                                    : '0 livre dans cette étagère :'}
                            </p>
                            {books.length > 0 ? (
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
                            ) : (
                                <p className="text-sm text-muted-foreground pl-2">
                                    Cette étagère est actuellement vide.
                                </p>
                            )}
                        </div>
                    </div>
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
