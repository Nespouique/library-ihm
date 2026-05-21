# Feuille de route responsive

Objectif : rendre `library-ihm` utilisable confortablement sur mobile sans perdre la coherence desktop, en introduisant des composants reutilisables plutot que des correctifs locaux disperses.

## Principes

- Mobile-first pour les composants de layout.
- Une seule source pour les espacements, cibles tactiles et etats de page.
- Conserver Radix/shadcn comme base UI, sans migration globale.
- Preferer des composants applicatifs reutilisables aux classes Tailwind copiees dans chaque page.
- Les actions importantes doivent etre visibles ou accessibles au tactile, jamais seulement au hover.
- Les listes longues doivent rester navigables sans dependance a un geste horizontal invisible.

## Phase 1 - Fondations responsive

### A creer

`ResponsiveDialogContent`

- Enveloppe `DialogContent` existant.
- Mobile : bottom sheet ou plein ecran selon variante.
- Desktop : comportement centre actuel.
- Props recommandees : `size="sm|md|lg|xl"`, `mobileMode="sheet|fullscreen|centered"`.

`PageHeader`

- Titre responsive : `text-3xl sm:text-4xl`.
- Description ou action optionnelle.
- Marges verticales reduites sur mobile.

`SearchToolbar`

- Remplace l'usage brut de `SearchBar` dans les pages.
- Gere une action secondaire comme le livre aleatoire.
- Espacement `mb-6 sm:mb-10` au lieu d'un `mb-12` fixe.

`ResponsiveGrid`

- Base : `grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
- Evite de recopier la grille dans livres/auteurs/etageres.

`IconActionButton`

- Cible tactile minimum `h-10 w-10`.
- Variants `default`, `destructive`, `ghost`.
- Peut reutiliser `Button` avec `size="icon"` ou une nouvelle taille `touch`.

### Changements rapides

- `BookDialog.jsx` : `grid grid-cols-2` vers `grid grid-cols-1 sm:grid-cols-2`.
- `AuthorDialog.jsx` : `grid grid-cols-2` vers `grid grid-cols-1 sm:grid-cols-2`.
- `FloatingButton.jsx` et `FullscreenToggle.jsx` : utiliser `bottom-[calc(1rem+env(safe-area-inset-bottom))]` sur mobile.
- `BookDetailDialog.jsx` : bouton camera visible sur mobile avec `opacity-100 sm:opacity-0 sm:group-hover:opacity-100`.
- `KubesPage.jsx` : boutons edition/suppression visibles sur mobile avec le meme pattern.

## Phase 2 - Navigation mobile

Probleme actuel : `Layout.jsx` force le header desktop sur toutes les tailles.

Option recommandee : bottom navigation mobile.

- Header mobile : logo + `Kubotheque` + theme toggle.
- Bottom nav : 4 items `Livres`, `Auteurs`, `Etageres`, `Kubes`.
- Desktop : conserver la nav horizontale actuelle.
- Ajouter du padding bas au `main` mobile pour eviter que le contenu passe sous la bottom nav.

Alternative : `Sheet` menu mobile.

- Moins intrusif visuellement.
- Moins rapide pour passer d'une page a l'autre.
- Pertinent si l'on veut eviter une barre basse persistante.

Recommendation : bottom navigation, car l'application a seulement 4 sections principales et l'usage mobile demandera des allers-retours rapides.

## Phase 3 - Refonte de la navigation alphabetique

Composant cible : `AlphaNav`.

### API proposee

```jsx
<AlphaNav
    items={filteredBooks}
    getKey={(book) => book.title}
    onSelectLetter={handleLetterScroll}
    mode="auto"
/>
```

### Comportement

- Calcule les lettres disponibles depuis les items filtres.
- Desactive visuellement les lettres sans resultat ou les masque selon variante.
- Utilise des cibles tactiles de 40-44px sur mobile.
- Ajoute `aria-label` sur chaque bouton.
- Reste sticky sous le header sur les pages livres/auteurs.

### Variante mobile recommandee

Barre compacte + drawer :

- Afficher une barre sticky avec quelques raccourcis utiles : `#`, lettres disponibles principales, et un bouton `A-Z`.
- Le bouton `A-Z` ouvre une `Drawer` avec grille complete des lettres.
- La grille permet des cibles larges et evite un scroll horizontal cache.

### Variante mobile minimale

Si l'on veut une premiere correction rapide :

- Remplacer `justify-center` par `justify-start`.
- Ajouter `sticky top-16 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80`.
- Utiliser `overflow-x-auto overscroll-x-contain snap-x`.
- Passer `.alphabet-letter-btn` de `w-7 h-7` a `h-10 min-w-10`.
- Ajouter `px-4 -mx-4` pour aligner avec le contenu.

## Phase 4 - Dialogues et formulaires

Priorite des dialogues :

1. `BookDialog` : formulaire principal, scanner, creation auteur imbriquee.
2. `BookDetailDialog` : image, upload jaquette, description longue.
3. `ShelfDetailDialog` et `AuthorDetailDialog` : listes longues.
4. Confirmations de suppression : factoriser dans `ConfirmDialog`.

Corrections attendues :

- Tous les dialogues doivent avoir `max-h` et `overflow-y-auto` geres au meme endroit.
- Les footers doivent rester accessibles apres ouverture du clavier mobile.
- Les formulaires doivent passer en une colonne sous `sm`.
- Le scanner doit etre proche d'un mode fullscreen sur mobile.
- Les boutons de footer doivent pouvoir passer en pleine largeur mobile si necessaire.

## Phase 5 - Cards et listes

Composants cibles : `EntityCard`, `CardActions`, `EmptyState`, `LoadingState`.

Corrections attendues :

- Les actions modifier/supprimer utilisent des boutons tactiles.
- Les cards ne cachent pas les actions essentielles selon des conditions metier non voulues.
- `BookCard` doit afficher les actions meme si le livre n'a pas d'etagere.
- Les textes longs doivent utiliser `line-clamp` sur mobile plutot qu'une troncature systematique sur une ligne quand l'information est importante.
- Les empty/loading/error states doivent etre factorises entre pages.

## Phase 6 - Page Kubes

Probleme actuel : le SVG est trop reduit sur mobile et les actions sont cachees au hover.

Plan minimal :

- Wrapper mobile `overflow-auto rounded-xl border bg-card`.
- SVG avec `min-w-[900px] md:min-w-0`.
- Message d'aide mobile : "Faites glisser pour explorer le plan".
- Actions edition/suppression visibles sur mobile.
- Boutons tactiles `h-10 w-10` minimum.

Plan avance :

- Zoom/pan tactile.
- Recherche d'emplacement.
- Vue liste alternative des kubes assignes/libres.
- Highlight plus lisible sur petit ecran.

## Phase 7 - Factorisation data et logique

Apres les corrections UI, factoriser pour reduire les regressions :

- `useLibraryData` ou hooks separes `useBooks`, `useAuthors`, `useShelves`.
- Fonctions pures de mapping API vers UI.
- Tri commun des auteurs, livres, etageres.
- Fonction commune de scroll vers une entite avec offset header.
- `ConfirmDialog` reutilisable pour supprimer livre/auteur/etagere/fichier kubes.

Cette phase n'est pas indispensable pour le premier correctif responsive, mais elle evitera de corriger trois fois les memes comportements.

## Composants shadcn pertinents

Ajout recommande si besoin :

```bash
npx shadcn@latest add @shadcn/sheet @shadcn/drawer @shadcn/scroll-area @shadcn/tabs
```

Usage prevu :

- `sheet` : menu mobile ou panneau d'actions.
- `drawer` : navigation alphabetique mobile et formulaires courts.
- `scroll-area` : listes longues dans dialogues et barre alphabetique horizontale.
- `tabs` : details complexes si l'on separe informations, livres associes, emplacement.

## Checklist d'acceptation mobile

Largeurs a tester :

- 360px : Android compact.
- 390px : iPhone courant.
- 430px : grand mobile.
- 768px : tablette portrait.

Scenarios a valider :

- La navigation principale ne deborde jamais horizontalement.
- Le contenu principal n'est pas masque par le header, la bottom nav ou les FAB.
- Les boutons principaux sont utilisables au doigt sans precision excessive.
- Les dialogues restent scrollables et fermables avec le clavier ouvert.
- Les formulaires livre/auteur/etagere sont lisibles en une colonne sur mobile.
- La navigation alphabetique permet d'aller rapidement a une lettre sans scroll horizontal obligatoire.
- Les actions hover-only sont visibles ou accessibles sur tactile.
- La page Kubes reste exploitable par pan horizontal ou vue alternative.
- Aucun `overflow-x` global involontaire sur `body`.

## Ordre de travail conseille

1. Corriger `Layout` mobile et les FAB.
2. Remplacer `AlphabeticalScroller` par `AlphaNav`.
3. Introduire `ResponsiveDialogContent` et corriger les formulaires.
4. Corriger cards/actions tactiles.
5. Adapter `KubesPage`.
6. Factoriser les pages et etats communs.
