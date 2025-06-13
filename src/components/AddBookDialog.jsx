import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AddBookDialog = ({ open, onOpenChange, onAddBook }) => {
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        isbn: '',
        description: '',
        shelf: '',
        publicationDate: '',
        coverUrl: '',
        status: 'unread',
        pageCount: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.author) {
            toast({
                title: 'Erreur',
                description: "Veuillez remplir au moins le titre et l'auteur.",
                variant: 'destructive',
            });
            return;
        }

        onAddBook({
            ...formData,
            id: Date.now().toString(),
            pageCount: formData.pageCount ? parseInt(formData.pageCount) : 0,
        });

        setFormData({
            title: '',
            author: '',
            isbn: '',
            description: '',
            shelf: '',
            publicationDate: '',
            coverUrl: '',
            status: 'unread',
            pageCount: '',
        });

        onOpenChange(false);

        toast({
            title: 'Livre ajouté !',
            description: 'Le livre a été ajouté avec succès à la bibliothèque.',
        });
    };

    const handleScanBarcode = () => {
        toast({
            title: "🚧 Cette fonctionnalité n'est pas encore implémentée—mais ne vous inquiétez pas ! Vous pouvez la demander dans votre prochaine requête ! 🚀",
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-start space-x-3">
                        <DialogTitle className="main-title-text">
                            Ajouter un livre
                        </DialogTitle>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleScanBarcode}
                            className="rounded-full w-8 h-8"
                        >
                            <Camera className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-3 pt-2">
                    <div className="space-y-1">
                        <Label htmlFor="title">Titre *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    title: e.target.value,
                                })
                            }
                            placeholder="Titre du livre"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="author">Auteur *</Label>
                        <Input
                            id="author"
                            value={formData.author}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    author: e.target.value,
                                })
                            }
                            placeholder="Nom de l'auteur"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="isbn">ISBN</Label>
                            <Input
                                id="isbn"
                                value={formData.isbn}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        isbn: e.target.value,
                                    })
                                }
                                placeholder="ISBN"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="shelf">Étagère</Label>
                            <Input
                                id="shelf"
                                value={formData.shelf}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        shelf: e.target.value,
                                    })
                                }
                                placeholder="Étagère"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="publicationDate">
                                Date de parution
                            </Label>
                            <Input
                                id="publicationDate"
                                type="date"
                                value={formData.publicationDate}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        publicationDate: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="pageCount">Nombre de pages</Label>
                            <Input
                                id="pageCount"
                                type="number"
                                value={formData.pageCount}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        pageCount: e.target.value,
                                    })
                                }
                                placeholder="Pages"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="coverUrl">URL de la couverture</Label>
                        <Input
                            id="coverUrl"
                            value={formData.coverUrl}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    coverUrl: e.target.value,
                                })
                            }
                            placeholder="https://exemple.com/couverture.jpg"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    description: e.target.value,
                                })
                            }
                            placeholder="Description du livre"
                            rows={2}
                        />
                    </div>

                    <div className="flex justify-end space-x-2 pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            Ajouter
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddBookDialog;
