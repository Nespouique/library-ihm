import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, BookOpen, Image as ImageIcon, Tag, Info } from 'lucide-react';

const BookDetailDialog = ({ book, open, onOpenChange, onUpdateBook }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBook, setEditedBook] = useState(book);

  useEffect(() => {
    setEditedBook(book);
    setIsEditing(false); 
  }, [book]);

  if (!book) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedBook(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value) => {
    setEditedBook(prev => ({ ...prev, status: value }));
  };

  const handleSave = () => {
    onUpdateBook({ ...editedBook, pageCount: editedBook.pageCount ? parseInt(editedBook.pageCount) : 0 });
    setIsEditing(false);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const statusOptions = {
    unread: 'Non lu',
    reading: 'En cours',
    read: 'Lu'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="main-title-text text-2xl">{isEditing ? 'Modifier le livre' : book.title}</DialogTitle>
          {!isEditing && <DialogDescription>{book.author}</DialogDescription>}
        </DialogHeader>

        {isEditing ? (
          <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-1">
              <Label htmlFor="edit-title">Titre</Label>
              <Input id="edit-title" name="title" value={editedBook.title} onChange={handleInputChange} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-author">Auteur</Label>
              <Input id="edit-author" name="author" value={editedBook.author} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-isbn">ISBN</Label>
                <Input id="edit-isbn" name="isbn" value={editedBook.isbn || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-shelf">Étagère</Label>
                <Input id="edit-shelf" name="shelf" value={editedBook.shelf || ''} onChange={handleInputChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-publicationDate">Date de parution</Label>
                <Input id="edit-publicationDate" name="publicationDate" type="date" value={editedBook.publicationDate || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-pageCount">Nombre de pages</Label>
                <Input id="edit-pageCount" name="pageCount" type="number" value={editedBook.pageCount || ''} onChange={handleInputChange} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-coverUrl">URL de la couverture</Label>
              <Input id="edit-coverUrl" name="coverUrl" value={editedBook.coverUrl || ''} onChange={handleInputChange} placeholder="https://"/>
            </div>
             <div className="space-y-1">
              <Label htmlFor="edit-status">Statut de lecture</Label>
              <Select name="status" value={editedBook.status} onValueChange={handleStatusChange}>
                <SelectTrigger id="edit-status">
                  <SelectValue placeholder="Sélectionner statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unread">{statusOptions.unread}</SelectItem>
                  <SelectItem value="reading">{statusOptions.reading}</SelectItem>
                  <SelectItem value="read">{statusOptions.read}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" name="description" value={editedBook.description || ''} onChange={handleInputChange} rows={3}/>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {book.coverUrl ? (
              <img-replace src={book.coverUrl} alt={`Couverture de ${book.title}`} className="w-full h-48 object-contain rounded-md mb-4" />
            ) : (
              <div className="w-full h-48 bg-secondary rounded-md flex items-center justify-center text-muted-foreground mb-4">
                <ImageIcon className="h-12 w-12" />
              </div>
            )}
            <div className="flex items-center">
              <CalendarDays className="h-5 w-5 mr-3 text-primary" />
              <p><span className="font-medium">Date de parution :</span> {formatDate(book.publicationDate)}</p>
            </div>
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 mr-3 text-primary" />
              <p><span className="font-medium">Nombre de pages :</span> {book.pageCount || 'N/A'}</p>
            </div>
            <div className="flex items-center">
              <Tag className="h-5 w-5 mr-3 text-primary" />
              <p><span className="font-medium">Statut :</span> <span className={`status-badge status-${book.status}`}>{statusOptions[book.status]}</span></p>
            </div>
            {book.isbn && (
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-primary" />
                <p><span className="font-medium">ISBN :</span> {book.isbn}</p>
              </div>
            )}
            {book.shelf && (
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-primary" />
                <p><span className="font-medium">Étagère :</span> {book.shelf}</p>
              </div>
            )}
            {book.description && (
              <div>
                <h4 className="font-medium mb-1 text-foreground">Description :</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{book.description}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-4">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => { setIsEditing(false); setEditedBook(book); }}>Annuler</Button>
              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">Enregistrer</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
              <Button onClick={() => setIsEditing(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">Modifier</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookDetailDialog;