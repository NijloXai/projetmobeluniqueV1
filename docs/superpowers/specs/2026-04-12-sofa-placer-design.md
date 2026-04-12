# Sofa Placer — Placement guide par bounding box

**Date :** 2026-04-12
**Statut :** Approuve
**Scope :** Feature "Visualiser chez moi" — ajout d'une etape de placement guide

## Contexte

La simulation publique ("Visualiser chez moi") envoie la photo du salon a Gemini avec un prompt textuel. Le resultat souffre de problemes d'echelle : le canape est souvent trop grand, trop petit, ou mal place car Gemini ne comprend pas les dimensions reelles de la piece depuis une photo 2D.

La solution : l'utilisateur place un rectangle pre-proportionne (ratio du canape) sur sa photo pour indiquer ou et a quelle taille le canape doit apparaitre. Le serveur genere un masque d'inpainting noir/blanc + des coordonnees textuelles dans le prompt pour guider Gemini precisement.

## Decisions de design

| Decision | Choix | Raison |
|----------|-------|--------|
| Moment d'apparition du rectangle | Automatique des l'upload | Evite un clic supplementaire, intuitif |
| Controle de taille | Slider horizontal sous l'image | Fiable sur mobile, pas de conflit de gestes |
| Informations affichees | Dimensions au-dessus du rectangle (badge externe) | Lisible sans encombrer le rectangle |
| Envoi a Gemini | Masque PNG noir/blanc + coordonnees textuelles | Inpainting natif Gemini + renfort textuel |
| Etape obligatoire ou optionnelle | Obligatoire | Simplifie le code, garantit un meilleur resultat |
| Organisation du code | Composant separe SofaPlacer.tsx | ConfiguratorModal deja 849 lignes |
| Pipeline masque | Cote serveur (Sharp) | Controle total, Sharp deja present, client leger |

## Flow utilisateur

```
1. Configurateur : choisir modele + tissu
2. Clic "Visualiser chez moi"
3. Upload photo (drag & drop ou file picker)
4. → Etat "placing" : photo affichee avec rectangle ambre pre-proportionne
   - Le rectangle est centre sur la moitie basse de l'image
   - Drag pour deplacer (Pointer Events)
   - Slider pour ajuster la taille (20% a 80% de la largeur image)
   - Badge dimensions au-dessus du rectangle ("280 x 180 cm")
   - Bouton "Changer de photo" en overlay coin superieur droit
5. Clic "Lancer la simulation"
6. → Etat "generating" : progression animee (identique a l'existant)
7. → Etat "done" : resultat avec watermark + boutons action
```

## Machine d'etat

**Avant :**
```
idle → preview → generating → done | error
```

**Apres :**
```
idle → placing → generating → done | error
```

L'etat `preview` est remplace par `placing`. Les etats `idle`, `generating`, `done`, `error` restent identiques.

## Architecture des composants

### SofaPlacer.tsx (nouveau)

**Fichier :** `src/components/public/Catalogue/SofaPlacer.tsx`
**CSS :** `src/components/public/Catalogue/SofaPlacer.module.css`

**Props :**
```typescript
interface SofaPlacerProps {
  imageUrl: string          // Object URL de la photo uploadee
  sofaName: string          // ex: "Molde"
  sofaWidth: number         // cm, ex: 280
  sofaDepth: number         // cm, ex: 180
  onLaunch: (rect: PlacementRect) => void
  onChangePhoto: () => void
}

interface PlacementRect {
  x: number      // pourcentage 0-100
  y: number
  width: number
  height: number
}
```

**Comportement :**
- Photo en fond dans un conteneur `touch-action: none`
- Rectangle : contour ambre `#E49400` 2px, fond ambre 15% opacite, `border-radius: var(--radius-sm)`
- Ratio verrouille `sofaWidth / sofaDepth`
- Position initiale : centre horizontalement, moitie basse verticalement
- Drag via Pointer Events (`onPointerDown/Move/Up` + `setPointerCapture`)
- Clamp : le rectangle ne sort jamais de l'image
- Slider `<input type="range">` : track ambre, thumb blanc avec ombre, range 20%-80%
- Badge dimensions : au-dessus du rectangle, fond `rgba(0,0,0,0.7)`, texte blanc, Montserrat 600
- Bouton "Changer de photo" : overlay semi-transparent, coin superieur droit
- Bouton "Lancer la simulation" : style ambre existant (`ctaSimulation`)

**Accessibilite :**
- Rectangle : `role="application"`, `aria-label="Zone de placement du canape — deplacer avec le doigt ou la souris"`
- Slider : `aria-label="Taille apparente du canape"`

### ConfiguratorModal.tsx (modifie)

**Changements :**
- Type `SimulationState` : `'preview'` remplace par `'placing'`
- Apres validation fichier : `setSimulationState('placing')` au lieu de `'preview'`
- Bloc `simulationState === 'preview'` (lignes 684-708) remplace par `<SofaPlacer />`
- Nouvelle fonction `parseDimensions()` appelee pour extraire width/depth
- `handleLancerSimulation(rect: PlacementRect)` : ajoute `rect` au FormData comme JSON stringifie
- Le reste du composant (idle, generating, done, error) ne change pas

### masking.ts (nouveau)

**Fichier :** `src/lib/ai/masking.ts`

**Export :**
```typescript
export async function generatePlacementMask(
  imageWidth: number,
  imageHeight: number,
  rect: PlacementRect
): Promise<Buffer>
```

**Implementation :**
- Cree un SVG noir plein (`imageWidth x imageHeight`)
- Rectangle blanc aux coordonnees converties de pourcentages en pixels
- Dilatation de 10px (le blanc deborde legerement pour un blend naturel)
- Rendu Sharp → PNG buffer
- Performance : ~50ms pour 1024px

## Pipeline serveur

**Dans `simulate/route.ts` :**

1. Parse `rect` depuis FormData + validation Zod :
   ```typescript
   const placementRectSchema = z.object({
     x: z.number().min(0).max(100),
     y: z.number().min(0).max(100),
     width: z.number().min(5).max(100),
     height: z.number().min(5).max(100),
   })
   ```
2. Apres le resize de l'image a 1024px, appel `generatePlacementMask()` avec les dimensions de l'image resizee (garantit le match de dimensions)
3. Encode le masque en `data:image/png;base64,...`
4. Passe `maskDataUrl` dans le `GenerateRequest`

**Dans `nano-banana.ts` :**

Si `maskDataUrl` est present :
- Resoudre le masque en `Part` via `resolveImagePart()`
- Contents : `[prompt, photoPart, maskPart]`

**Dans `prompts.ts` — nouvelle fonction `buildSimulateWithMaskPrompt()` :**

```
The first image is a photograph of a customer's room.
The second image is a binary mask: the white region indicates exactly
where the sofa must be placed. The black region must be preserved unchanged.

Place the "{modelName}" sofa ({dimensions}), upholstered in "{fabricName}"
fabric, precisely within the white masked area.

The sofa occupies approximately {x}%-{x+w}% horizontally
and {y}%-{y+h}% vertically in the image.

Scale and positioning:
- The sofa measures {dimensions}.
- The sofa must rest firmly on the floor with realistic contact shadows.
- The sofa must not overlap existing furniture or walls.

Lighting and integration:
- Analyze the room's existing light sources, shadow directions, and color temperature.
- Match the sofa's illumination to the room's ambient lighting.
- Generate shadows consistent with the existing shadow direction.

Preservation:
- Preserve all architectural elements exactly as in the original photograph.
- Only add the sofa — do not modify or remove any existing elements.
```

**Dans `types.ts` :**

Ajout de `maskDataUrl?: string` a `GenerateRequest`.

## Gestion des erreurs et cas limites

**Client (SofaPlacer) :**
- Image tres horizontale/verticale : rectangle initial clampe a 80% de la plus petite dimension
- Dimensions non parsables (`model.dimensions` null ou mal formate) : fallback ratio 16:9
- Drag hors image : clamp a `[0, 100 - rect.size]` a chaque mouvement
- Resize fenetre / rotation mobile : coordonnees en pourcentages, repositionnement naturel

**Serveur :**
- `rect` absent ou invalide : retour 400 avec message d'erreur
- `rect` deborde (x + width > 100) : clamp cote serveur
- Masque echoue (Sharp plante) : fallback au prompt sans masque (coordonnees textuelles seules)
- Dimensions masque/image mismatch : impossible car generes depuis les memes dimensions post-resize

## Fichiers concernes

**Nouveaux (3) :**
- `src/components/public/Catalogue/SofaPlacer.tsx`
- `src/components/public/Catalogue/SofaPlacer.module.css`
- `src/lib/ai/masking.ts`

**Modifies (5) :**
- `src/components/public/Catalogue/ConfiguratorModal.tsx` — state placing, import SofaPlacer, parse dimensions, rect dans FormData
- `src/app/api/simulate/route.ts` — parse rect, generer masque, passer maskDataUrl
- `src/lib/ai/types.ts` — ajout `maskDataUrl?: string`
- `src/lib/ai/prompts.ts` — nouvelle fonction `buildSimulateWithMaskPrompt()`
- `src/lib/ai/nano-banana.ts` — si maskDataUrl, ajouter au contents

**Nouvelle util :**
- `parseDimensions(str)` dans `src/lib/utils.ts` — parse "L 280 x P 180 x H 85 cm" → `{ width: 280, depth: 180 } | null`

**Inchanges :** `mock.ts`, routes admin generate/generate-all, CSS ConfiguratorModal.

**Zero nouvelle dependance npm.**

## Charte graphique

- Rectangle : `#E49400` (primary), fond 15% opacite
- Slider track : `#E49400`, thumb blanc avec box-shadow
- Badge dimensions : fond `rgba(0,0,0,0.7)`, texte blanc
- Bouton "Lancer" : style ambre existant
- Radius : `var(--radius-sm)` pour le rectangle
- Font : Montserrat 600 pour le badge
- Tous les tokens CSS depuis `globals.css`
