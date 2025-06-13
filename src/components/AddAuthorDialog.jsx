import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

const AddAuthorDialog = ({ open, onOpenChange, onAddAuthor }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    deathDate: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir le prénom et le nom.",
        variant: "destructive"
      });
      return;
    }
    
    onAddAuthor({
      ...formData,
      id: Date.now().toString(),
      bookCount: 0
    });
    
    setFormData({
      firstName: '',
      lastName: '',
      birthDate: '',
      deathDate: '',
    });
    
    onOpenChange(false);
    
    toast({
      title: "Auteur ajouté !",
      description: "L'auteur a été ajouté avec succès à la bibliothèque."
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="main-title-text">Ajouter un auteur</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Prénom"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Nom"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="birthDate">Date de naissance</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="deathDate">Date de décès</Label>
              <Input
                id="deathDate"
                type="date"
                value={formData.deathDate}
                onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Ajouter
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAuthorDialog;