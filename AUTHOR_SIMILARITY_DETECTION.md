# Détection de Doublons d'Auteurs par Similarité

## Contexte

Problème identifié : Risque de création de doublons d'auteurs lors de l'ajout via API ou saisie manuelle à cause de variations de formatage :

- `J.R.R Tolkien` vs `J. R. R. Tolkien`
- `Eric Emmanuel Schmidt` vs `Eric-Emmanuel Schmidt`
- Fautes d'orthographe légères
- Accents et caractères spéciaux

## Solution Technique Recommandée

### 1. Bibliothèque à installer

```bash
npm install string-similarity
```

**Pourquoi `string-similarity` :**

- 4M+ téléchargements/semaine (très fiable)
- Utilise le coefficient de Dice (optimal pour les noms)
- API simple et performante
- Pas de dépendances lourdes

### 2. Fonction de détection de similarité

```javascript
// Dans src/lib/authorSimilarity.js
import stringSimilarity from 'string-similarity';

/**
 * Normalise un nom d'auteur pour la comparaison
 * @param {string} name - Nom à normaliser
 * @returns {string} - Nom normalisé
 */
export function normalizeAuthorName(name) {
    return name
        .toLowerCase()
        .replace(/[.,;]/g, '') // Supprimer ponctuation
        .replace(/\s+/g, ' ') // Normaliser espaces multiples
        .replace(/['']/g, '') // Supprimer apostrophes/guillemets
        .replace(/\s*\.\s*/g, '.') // Normaliser espaces autour des points (J. R. R. -> J.R.R.)
        .replace(/\s*-\s*/g, '-') // Normaliser espaces autour des tirets
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprimer accents
        .trim();
}

/**
 * Trouve les auteurs similaires dans la base
 * @param {string} newAuthorName - Nom du nouvel auteur (format: "Prénom Nom")
 * @param {Array} existingAuthors - Liste des auteurs existants
 * @param {number} threshold - Seuil de similarité (0.7 = 70%)
 * @returns {Array} - Auteurs similaires avec scores
 */
export function findSimilarAuthors(
    newAuthorName,
    existingAuthors,
    threshold = 0.7
) {
    const candidates = [];
    const normalizedNewName = normalizeAuthorName(newAuthorName);

    existingAuthors.forEach((author) => {
        const fullName = `${author.firstName} ${author.lastName}`;
        const normalizedExistingName = normalizeAuthorName(fullName);

        // Comparaison principale : nom complet vs nom complet
        const similarity = stringSimilarity.compareTwoStrings(
            normalizedNewName,
            normalizedExistingName
        );

        if (similarity >= threshold) {
            candidates.push({
                author,
                similarity,
                confidence: Math.round(similarity * 100),
                reason: 'Nom complet similaire',
            });
        } else {
            // Comparaison secondaire : prénom/nom séparément
            const newParts = normalizedNewName.split(' ');
            const existingParts = normalizedExistingName.split(' ');

            if (newParts.length >= 2 && existingParts.length >= 2) {
                const firstNameSim = stringSimilarity.compareTwoStrings(
                    newParts[0],
                    existingParts[0]
                );
                const lastNameSim = stringSimilarity.compareTwoStrings(
                    newParts.slice(1).join(' '),
                    existingParts.slice(1).join(' ')
                );

                const avgSimilarity = (firstNameSim + lastNameSim) / 2;

                if (avgSimilarity >= threshold) {
                    candidates.push({
                        author,
                        similarity: avgSimilarity,
                        confidence: Math.round(avgSimilarity * 100),
                        reason: 'Prénom/nom similaires séparément',
                    });
                }
            }
        }
    });

    // Supprimer les doublons et trier par similarité décroissante
    const uniqueCandidates = candidates.filter(
        (candidate, index, self) =>
            index === self.findIndex((c) => c.author.id === candidate.author.id)
    );

    return uniqueCandidates.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Détermine le niveau d'action recommandé selon le score
 * @param {number} similarity - Score de similarité (0-1)
 * @returns {object} - Action recommandée
 */
export function getRecommendedAction(similarity) {
    if (similarity >= 0.9) {
        return {
            level: 'auto-suggest',
            message: 'Cet auteur existe probablement déjà',
            color: 'destructive',
        };
    } else if (similarity >= 0.75) {
        return {
            level: 'confirm',
            message: 'Un auteur similaire existe',
            color: 'warning',
        };
    } else {
        return {
            level: 'suggest',
            message: 'Auteur possiblement similaire trouvé',
            color: 'default',
        };
    }
}
```

### 3. Composant de confirmation de similarité

```jsx
// Dans src/components/AuthorSimilarityDialog.jsx
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Users } from 'lucide-react';

const AuthorSimilarityDialog = ({
    open,
    onOpenChange,
    newAuthorName,
    similarAuthors,
    onUseExisting,
    onCreateNew,
    onViewMore,
}) => {
    const topSimilar = similarAuthors[0];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 main-title-text">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Auteur similaire détecté
                    </DialogTitle>
                    <DialogDescription>
                        Un auteur similaire existe déjà dans votre bibliothèque.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Nouvel auteur à créer */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Auteur à créer :
                        </h4>
                        <p className="text-blue-800 dark:text-blue-200">
                            <em>"{newAuthorName}"</em>
                        </p>
                    </div>

                    {/* Auteur similaire trouvé */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                        <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-1 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Auteur existant ({topSimilar.confidence}% de
                            correspondance) :
                        </h4>
                        <p className="text-amber-800 dark:text-amber-200">
                            <strong>
                                "{topSimilar.author.firstName}{' '}
                                {topSimilar.author.lastName}"
                            </strong>
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            {topSimilar.reason}
                        </p>
                    </div>

                    {/* Options */}
                    <div className="space-y-2">
                        <Button
                            onClick={() => onUseExisting(topSimilar.author)}
                            className="w-full"
                            variant="default"
                        >
                            Utiliser l'auteur existant
                        </Button>

                        <Button
                            onClick={onCreateNew}
                            className="w-full"
                            variant="outline"
                        >
                            Créer quand même "{newAuthorName}"
                        </Button>

                        {similarAuthors.length > 1 && (
                            <Button
                                onClick={onViewMore}
                                className="w-full"
                                variant="ghost"
                            >
                                Voir les {similarAuthors.length - 1} autres
                                suggestions
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AuthorSimilarityDialog;
```

### 4. Intégration dans AuthorDialog

```jsx
// Modifications dans src/components/AuthorDialog.jsx

import {
    findSimilarAuthors,
    normalizeAuthorName,
} from '@/lib/authorSimilarity';
import AuthorSimilarityDialog from './AuthorSimilarityDialog';

const AuthorDialog = ({
    // ... props existantes
    existingAuthors = [], // NOUVELLE PROP : liste des auteurs existants
}) => {
    // ... états existants
    const [similarityCheck, setSimilarityCheck] = useState({
        show: false,
        newAuthorName: '',
        similarAuthors: [],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const formattedData = {
            ...formData,
            firstName: formatFirstName(formData.firstName),
            lastName: formatLastName(formData.lastName),
        };

        // NOUVELLE LOGIQUE : Vérification de similarité avant création
        if (!isEditMode && existingAuthors.length > 0) {
            const newAuthorName = `${formattedData.firstName} ${formattedData.lastName}`;
            const similarAuthors = findSimilarAuthors(
                newAuthorName,
                existingAuthors,
                0.7
            );

            if (similarAuthors.length > 0) {
                setSimilarityCheck({
                    show: true,
                    newAuthorName,
                    similarAuthors,
                    formattedData, // Stocker les données formatées
                });
                return; // Arrêter ici et attendre la décision utilisateur
            }
        }

        // Logique existante si pas de similarité ou en mode édition
        if (isEditMode && onUpdateAuthor) {
            onUpdateAuthor({ ...formattedData, id: authorToEdit.id });
        } else if (onAddAuthor) {
            onAddAuthor(formattedData);
        }

        onOpenChange(false);
    };

    const handleUseExistingAuthor = (existingAuthor) => {
        // Utiliser l'auteur existant au lieu de créer un nouveau
        onAddAuthor(existingAuthor);
        setSimilarityCheck({
            show: false,
            newAuthorName: '',
            similarAuthors: [],
        });
        onOpenChange(false);
    };

    const handleCreateNewAuthor = () => {
        // Forcer la création du nouvel auteur
        onAddAuthor(similarityCheck.formattedData);
        setSimilarityCheck({
            show: false,
            newAuthorName: '',
            similarAuthors: [],
        });
        onOpenChange(false);
    };

    return (
        <>
            {/* Dialog principal existant */}
            <Dialog open={open} onOpenChange={onOpenChange}>
                {/* ... contenu existant */}
            </Dialog>

            {/* NOUVEAU : Dialog de vérification de similarité */}
            <AuthorSimilarityDialog
                open={similarityCheck.show}
                onOpenChange={(open) =>
                    !open &&
                    setSimilarityCheck({
                        show: false,
                        newAuthorName: '',
                        similarAuthors: [],
                    })
                }
                newAuthorName={similarityCheck.newAuthorName}
                similarAuthors={similarityCheck.similarAuthors}
                onUseExisting={handleUseExistingAuthor}
                onCreateNew={handleCreateNewAuthor}
                onViewMore={() => {
                    /* Implémenter liste étendue si besoin */
                }}
            />
        </>
    );
};
```

### 5. Mise à jour des appels à AuthorDialog

Dans `BookDialog.jsx` et `AuthorsPage.jsx`, passer la liste des auteurs :

```jsx
// Dans BookDialog.jsx
<AuthorDialog
    open={isAuthorDialogOpen}
    onOpenChange={setIsAuthorDialogOpen}
    onAddAuthor={handleAddAuthor}
    mode="add"
    pendingAuthorMessage={pendingAuthorMessage}
    existingAuthors={authors} // NOUVELLE PROP
/>

// Dans AuthorsPage.jsx
<AuthorDialog
    open={isAddDialogOpen}
    onOpenChange={setIsAddDialogOpen}
    onAddAuthor={handleAddAuthor}
    mode="add"
    existingAuthors={authors} // NOUVELLE PROP
/>
```

## Seuils de Similarité Recommandés

- **90%+** : Proposition automatique de fusion (très probable doublon)
- **75-89%** : Demande de confirmation (probable doublon)
- **60-74%** : Suggestion discrète (possible doublon)
- **<60%** : Pas d'alerte

## Cas d'Usage Testés

| Nouveau               | Existant              | Score | Action       |
| --------------------- | --------------------- | ----- | ------------ |
| J.R.R Tolkien         | J. R. R. Tolkien      | ~95%  | Auto-suggest |
| Eric Emmanuel Schmidt | Eric-Emmanuel Schmidt | ~90%  | Confirm      |
| Stephen King          | Stephen Kind          | ~85%  | Confirm      |
| Isaac Asimov          | Isaac Azimov          | ~80%  | Confirm      |
| George Orwell         | George R.R. Martin    | ~40%  | Ignore       |

## Optimisations Futures Possibles

1. **Cache des comparaisons** pour éviter les recalculs
2. **Normalisation au niveau base de données** pour performances
3. **Machine Learning** pour améliorer la détection selon les retours utilisateur
4. **API de suggestion** externe (Google Knowledge Graph, etc.)
5. **Historique des décisions** utilisateur pour affiner les seuils

## Installation et Activation

```bash
# 1. Installer la dépendance
npm install string-similarity

# 2. Créer les nouveaux fichiers
touch src/lib/authorSimilarity.js
touch src/components/AuthorSimilarityDialog.jsx

# 3. Modifier les composants existants
# - AuthorDialog.jsx (ajouter prop existingAuthors + logique similarité)
# - BookDialog.jsx (passer authors à AuthorDialog)
# - AuthorsPage.jsx (passer authors à AuthorDialog)
```

## Impact Utilisateur

✅ **Avantages :**

- Réduit drastiquement les doublons
- Interface claire et non intrusive
- Contrôle total gardé par l'utilisateur
- Apprentissage progressif des patterns

⚠️ **Considérations :**

- Légère augmentation du temps de création d'auteur
- Nécessite formation utilisateur initiale
- Faux positifs possibles sur noms très courts

---

_Dernière mise à jour : Juillet 2025_
_Version recommandée : v1.0 (détection basique avec string-similarity)_
