---
phase: 04-prerequis-catalogue-core
verified: 2026-03-28T07:26:00Z
status: passed
score: 8/8 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Scroll catalogue depuis CTA Hero"
    expected: "Cliquer le CTA 'Decouvrir nos canapes' dans le Hero scrolle en douceur vers la section #catalogue"
    why_human: "Comportement scroll-smooth defini par CSS dans globals.css — non verifiable sans navigateur"
  - test: "Rendu visuel catalogue avec donnees Supabase"
    expected: "Les ProductCards s'affichent avec images reelles depuis Supabase Storage, sans erreur 400 sur les images"
    why_human: "Necessite un serveur de developpement actif et une connexion Supabase avec donnees"
---

# Phase 04: Prerequis Catalogue Core — Rapport de Verification

**Phase Goal:** Configurer next/image pour les images Supabase, creer les composants presentationnels ProductCard/ProductCardSkeleton, puis construire CatalogueSection (Server Component async) + CatalogueClient (Client Component grille responsive) et integrer dans page.tsx avec Suspense.
**Verified:** 2026-03-28T07:26:00Z
**Status:** PASSED
**Re-verification:** Non — verification initiale

---

## Objectif Atteint

### Verites Observables

| #   | Verite                                                                                               | Statut     | Evidence                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| 1   | next/image peut charger des URLs Supabase Storage sans erreur 400                                   | VERIFIE    | `next.config.ts` L6-12 : remotePatterns `**.supabase.co`, pathname `/storage/v1/object/public/**` |
| 2   | Une card produit affiche l'image, le nom et le prix formate d'un canape                             | VERIFIE    | `ProductCard.tsx` : Image fill, h3 nom, `Intl.NumberFormat('fr-FR')`, 6 tests GREEN             |
| 3   | Un skeleton loading a les memes dimensions qu'une vraie card avec animation shimmer                 | VERIFIE    | `ProductCardSkeleton.module.css` L1-4 : `@keyframes shimmer`, aspect-ratio 4/5, 3 tests GREEN   |
| 4   | Les canapes actifs depuis Supabase sont visibles en grille responsive sur la page publique          | VERIFIE    | `CatalogueSection.tsx` fetch `.from('models').select('*, model_images(*)')`, passe a `CatalogueClient` |
| 5   | La grille affiche 1 colonne sur mobile, 2 colonnes sur tablette, 3 colonnes sur desktop             | VERIFIE    | `CatalogueSection.module.css` L43-79 : `1fr` / `repeat(2,1fr)` 640px / `repeat(3,1fr)` 1024px  |
| 6   | Un skeleton loading s'affiche pendant le chargement du catalogue via Suspense                       | VERIFIE    | `page.tsx` L22-24 : `<Suspense fallback={<CatalogueSkeletonGrid />}><CatalogueSection /></Suspense>` |
| 7   | Si aucun canape actif, le message 'Nos canapes arrivent bientot.' s'affiche                         | VERIFIE    | `CatalogueClient.tsx` L16 : `Nos canapes arrivent bientot.` — test GREEN                        |
| 8   | Le CTA Hero #catalogue scrolle vers la section catalogue                                            | VERIFIE (partiel) | `Hero.tsx` L34 : `href="#catalogue"`, `CatalogueClient.tsx` L14/23 : `id="catalogue"` — scroll CSS necessite test humain |

**Score:** 8/8 verites satisfaites (scroll smooth necessite verification humaine)

---

### Artefacts Requis

| Artefact                                                          | Fourni                                    | Niveau 1 (Existe) | Niveau 2 (Substantiel) | Niveau 3 (Cable) | Statut      |
| ----------------------------------------------------------------- | ----------------------------------------- | ----------------- | ---------------------- | ---------------- | ----------- |
| `next.config.ts`                                                  | remotePatterns Supabase Storage           | OUI               | OUI (hostname + pathname complets) | OUI (lu par Next.js) | VERIFIE |
| `src/components/public/Catalogue/ProductCard.tsx`                 | Card produit presentationnelle            | OUI               | OUI (64 lignes, logique complete) | OUI (importe par CatalogueClient) | VERIFIE |
| `src/components/public/Catalogue/ProductCard.module.css`          | Styles card tonal layering                | OUI               | OUI (116 lignes, .card, hover, scale) | OUI | VERIFIE |
| `src/components/public/Catalogue/ProductCardSkeleton.tsx`         | Skeleton placeholder loading              | OUI               | OUI (2 exports, 3 skeletons aria-busy) | OUI (importe par page.tsx) | VERIFIE |
| `src/components/public/Catalogue/ProductCardSkeleton.module.css`  | Animation shimmer CSS                     | OUI               | OUI (@keyframes shimmer present) | OUI | VERIFIE |
| `src/components/public/Catalogue/CatalogueSection.tsx`            | Server Component async fetch Supabase     | OUI               | OUI (37 lignes, fetch reel, gestion erreur) | OUI (importe dans page.tsx Suspense) | VERIFIE |
| `src/components/public/Catalogue/CatalogueSection.module.css`     | Styles section + grille responsive        | OUI               | OUI (91 lignes, grid responsive 3 breakpoints) | OUI | VERIFIE |
| `src/components/public/Catalogue/CatalogueClient.tsx`             | Client Component grille avec etat vide    | OUI               | OUI ('use client', .map ProductCard, etat vide) | OUI (recoit props de CatalogueSection) | VERIFIE |
| `src/app/page.tsx`                                                | Integration Suspense + CatalogueSection   | OUI               | OUI (Suspense present, ordre correct) | OUI | VERIFIE |

---

### Verification Liens Cles (Cablage)

| De                        | Vers                              | Via                                    | Statut  | Detail                                                              |
| ------------------------- | --------------------------------- | -------------------------------------- | ------- | ------------------------------------------------------------------- |
| `ProductCard.tsx`         | `src/types/database.ts`           | `import type { ModelWithImages, ModelImage }` | CABLE | L3 : `import type { ModelWithImages, ModelImage } from '@/types/database'` |
| `ProductCard.tsx`         | `next/image`                      | `Image` avec fill + sizes              | CABLE | L1 : `import Image from 'next/image'`, L29-35 : fill + sizes       |
| `next.config.ts`          | Supabase Storage                  | `hostname: '**.supabase.co'`           | CABLE | L8 : `hostname: '**.supabase.co'`                                   |
| `page.tsx`                | `CatalogueSection.tsx`            | `import` + `<Suspense fallback={<CatalogueSkeletonGrid />}>` | CABLE | L6-7 + L22-24 : Suspense enveloppant CatalogueSection                |
| `CatalogueSection.tsx`    | `src/lib/supabase/server.ts`      | `createClient()` fetch direct          | CABLE | L1 : `import { createClient }`, L7 : `await createClient()`        |
| `CatalogueSection.tsx`    | `CatalogueClient.tsx`             | passe `ModelWithImages[]` en props     | CABLE | L35 : `<CatalogueClient models={models} />`                         |
| `CatalogueClient.tsx`     | `ProductCard.tsx`                 | `.map()` avec `key=` et `model=`       | CABLE | L38-43 : `models.map((model) => <ProductCard key={model.id} model={model} ...>)` |
| `Hero CTA #catalogue`     | Section CatalogueClient           | `id="catalogue"` sur la section        | CABLE | `Hero.tsx` L34 : `href="#catalogue"`, `CatalogueClient.tsx` L14/23 : `id="catalogue"` |

---

### Trace du Flux de Donnees (Niveau 4)

| Composant               | Variable donnee  | Source                                           | Donnees reelles | Statut    |
| ----------------------- | ---------------- | ------------------------------------------------ | --------------- | --------- |
| `CatalogueSection.tsx`  | `data` (models)  | `supabase.from('models').select('*, model_images(*)')` + `.eq('is_active', true)` | OUI — requete DB Supabase | FLUX REEL |
| `CatalogueClient.tsx`   | `models` (props) | Transmis par `CatalogueSection` depuis Supabase  | OUI — props depuis Server Component | FLUX REEL |
| `ProductCard.tsx`       | `model` (props)  | `ModelWithImages` depuis `CatalogueClient.map()` | OUI — donnees reelles | FLUX REEL |

Note: `onConfigure={undefined}` dans `CatalogueClient` est un stub intentionnel documente (sera connecte au modal Phase 06 / CAT-04). Il ne bloque pas le rendu ni la navigation.

---

### Tests Comportementaux (Niveau 7b)

| Comportement                                  | Commande                      | Resultat                   | Statut    |
| --------------------------------------------- | ----------------------------- | -------------------------- | --------- |
| Tous les tests unitaires passent              | `npx vitest run`              | 41 tests, 7 fichiers GREEN | PASSE     |
| Zero erreur TypeScript                        | `npx tsc --noEmit`            | Aucune sortie d'erreur     | PASSE     |
| Test specifique nextconfig                    | `npx vitest run nextconfig`   | 1 test GREEN               | PASSE     |
| Test specifique ProductCard                   | Inclus dans vitest run        | 6 tests GREEN              | PASSE     |
| Test specifique ProductCardSkeleton           | Inclus dans vitest run        | 3 tests GREEN              | PASSE     |
| Test specifique CatalogueClient               | Inclus dans vitest run        | 5 tests GREEN              | PASSE     |

---

### Couverture des Exigences

| Exigence | Plan Source | Description                                                                    | Statut     | Evidence                                                                     |
| -------- | ----------- | ------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------- |
| TECH-01  | 04-01       | Les images Supabase Storage s'affichent via next/image (remotePatterns configure) | SATISFAIT | `next.config.ts` : remotePatterns `**.supabase.co` + pathname `/storage/v1/object/public/**` |
| CAT-01   | 04-01       | L'utilisateur voit les canapes disponibles sous forme de cards avec image, nom et prix | SATISFAIT | `ProductCard.tsx` : image (priorite 3/4), h3 nom, prix Intl fr-FR, CTA      |
| CAT-02   | 04-02       | Les cards s'affichent en grille responsive (1 col mobile / 2 col tablet / 3 col desktop) | SATISFAIT | `CatalogueSection.module.css` : breakpoints 640px / 1024px confirmes           |
| CAT-03   | 04-01       | Un skeleton loading s'affiche pendant le chargement des produits               | SATISFAIT | `ProductCardSkeleton.tsx` + `CatalogueSkeletonGrid` + `Suspense` dans page.tsx |

**Exigences orphelines (mentionnees dans REQUIREMENTS.md mais pas dans cette phase) :**
- CAT-04 : "Le nombre de produits affiches est visible" — assignee Phase 5, non reclamee ici. Non orpheline.

Toutes les 4 exigences declarees (TECH-01, CAT-01, CAT-02, CAT-03) sont satisfaites.

---

### Anti-Patterns Detectes

| Fichier                  | Ligne | Pattern                    | Severite | Impact                                                              |
| ------------------------ | ----- | -------------------------- | -------- | ------------------------------------------------------------------- |
| `CatalogueClient.tsx`    | 41    | `onConfigure={undefined}`  | INFO     | Stub intentionnel — documente dans SUMMARY, sera connecte Phase 06  |

Aucun blocker ni avertissement. Le seul pattern notable est un stub intentionnel et documente.

---

### Verification Humaine Requise

#### 1. Scroll catalogue depuis CTA Hero

**Test :** Ouvrir `http://localhost:3000`, cliquer le bouton "Decouvrir nos canapes" dans la section Hero
**Attendu :** La page scrolle en douceur vers la section #catalogue (les ProductCards ou le skeleton)
**Pourquoi humain :** Le scroll-smooth est pilote par CSS (`scroll-behavior: smooth` dans globals.css) — non testable sans navigateur

#### 2. Rendu visuel avec donnees Supabase reelles

**Test :** Ouvrir `http://localhost:3000` avec `npm run dev` et variables d'environnement Supabase configurees
**Attendu :** Les ProductCards s'affichent avec les images products depuis Supabase Storage sans erreur 400 dans la console
**Pourquoi humain :** Necessite connexion Supabase active et donnees de production

---

### Resume

La phase 04 a entierement atteint son objectif. Les 4 exigences declarees (TECH-01, CAT-01, CAT-02, CAT-03) sont implementees et verificables dans le code :

- `next.config.ts` debloque next/image pour Supabase Storage avec un double wildcard securise
- `ProductCard` est un composant presentationnel pur avec image, nom uppercase, prix Intl fr-FR, et CTA accessible
- `ProductCardSkeleton` / `CatalogueSkeletonGrid` fournit 3 skeletons avec animation shimmer et aria-busy
- `CatalogueSection` est un async Server Component qui fetch directement Supabase avec gestion d'erreur francaise
- `CatalogueClient` rend la grille responsive 1/2/3 colonnes avec etat vide et placeholder `onConfigure` pour Phase 06
- `page.tsx` integre le tout avec `Suspense` — le skeleton s'affiche pendant le fetch, Header/Hero/HowItWorks restent synchrones
- 41 tests unitaires passent, zero erreur TypeScript
- 4 commits confirmes dans git (`9c95fbe`, `c6d6418`, `92f6066`, `1e6bb37`)

Le seul point necessitant verification humaine est le comportement visuel scroll et le rendu avec donnees Supabase reelles.

---

_Verifie : 2026-03-28T07:26:00Z_
_Verificateur : Claude (gsd-verifier)_
