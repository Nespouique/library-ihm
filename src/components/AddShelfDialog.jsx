import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

const AddShelfDialog = ({ open, onOpenChange, onAddShelf }) => {
  const [formData, setFormData] = useState({
    name: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir le nom de l'étagère.",
        variant: "destructive"
      });
      return;
    }
    
    onAddShelf({
      ...formData,
      id: Date.now().toString(),
      bookCount: 0
    });
    
    setFormData({
      name: ''
    });
    
    onOpenChange(false);
    
    toast({
      title: "Étagère ajoutée !",
      description: "L'étagère a été ajoutée avec succès à la bibliothèque."
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="main-title-text">Ajouter une étagère</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="name">Nom de l'étagère *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nom de l'étagère"
              required
            />
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

export default AddShelfDialog;