# Public UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refonte UX du site public Mobel Unique — configurateur full-screen en 4 etapes + polish catalogue (cards, filtres, animations).

**Architecture:** Decomposition du ConfiguratorModal monolithique (848 lignes) en composants focuses (<150 lignes). Nouveau dossier `src/components/public/Configurator/` avec state machine explicite. Catalogue ameliore avec Motion pour les animations et filtres pills.

**Tech Stack:** Next.js 16 (App Router), TypeScript strict, CSS Modules, Motion (Framer Motion), Lucide React, Supabase.

---

## File Map

### New files to create:

```
src/components/public/Configurator/
  index.tsx                     — Conteneur dialog + state machine + orchestration
  ConfiguratorStepper.tsx       — Barre stepper 4 etapes
  ConfiguratorStepper.module.css
  StepTissu.tsx                 — Selection tissu (swatches, categories, preview)
  StepTissu.module.css
  StepApercu.tsx                — Navigation angles + CTAs
  StepApercu.module.css
  StepSimulation.tsx            — Upload + guidage + SofaPlacer
  StepSimulation.module.css
  StepResultat.tsx              — Slider avant/apres + actions
  StepResultat.module.css
  BeforeAfterSlider.tsx         — Composant slider reutilisable
  BeforeAfterSlider.module.css
  PhotoGuidance.tsx             — Exemples bon/mauvais cadrage
  PresetRooms.tsx               — Grille pieces predefinies
  SofaPlacer.tsx                — Copie amelioree depuis Catalogue/
  SofaPlacer.module.css
  Toast.tsx                     — Toast de confirmation
  Toast.module.css
  types.ts                      — Types et state machine
  configurator.module.css       — Layout global (dialog, colonnes, mobile)
```

### Files to modify:

```
src/components/public/Catalogue/CatalogueClient.tsx   — Ajout filtres pills + debounce + import nouveau Configurator
src/components/public/Catalogue/ProductCard.tsx        — Hover elevation + image swap + CTA au hover
src/components/public/Catalogue/ProductCard.module.css — Styles refaits
src/components/public/Catalogue/CatalogueSection.module.css — Tonal layering + animation styles
src/components/public/Catalogue/ProductCardSkeleton.module.css — Couleurs chaudes
src/app/globals.css                                    — Correction --color-muted contraste
```

### Files to delete (after migration):

```
src/components/public/Catalogue/ConfiguratorModal.tsx
src/components/public/Catalogue/ConfiguratorModal.module.css
src/components/public/Catalogue/SofaPlacer.tsx
src/components/public/Catalogue/SofaPlacer.module.css
```

---

## Task 1: Types et state machine du configurateur

**Files:**
- Create: `src/components/public/Configurator/types.ts`

- [ ] **Step 1: Creer le fichier types.ts**

```typescript
// src/components/public/Configurator/types.ts
import type { ModelWithImages, Fabric, VisualWithFabricAndImage } from '@/types/database'

export type ConfiguratorStep = 'tissu' | 'apercu' | 'simulation' | 'resultat'

export type SimulationStatus = 'idle' | 'placing' | 'generating' | 'done' | 'error'

export interface PlacementRect {
  x: number
  y: number
  width: number
  height: number
}

export interface ConfiguratorState {
  step: ConfiguratorStep
  selectedFabricId: string | null
  selectedAngle: string | null
  uploadedPhoto: File | null
  presetRoomId: string | null
  previewUrl: string | null
  sofaPosition: PlacementRect | null
  simulationStatus: SimulationStatus
  resultBlobUrl: string | null
  errorMessage: string | null
  progress: number
  progressStage: number
}

export interface ConfiguratorProps {
  model: ModelWithImages | null
  onClose: () => void
  fabrics: Fabric[]
  visuals: VisualWithFabricAndImage[]
}

export interface StepTissuProps {
  model: ModelWithImages
  fabrics: Fabric[]
  visuals: VisualWithFabricAndImage[]
  selectedFabricId: string | null
  selectedAngle: string | null
  onSelectFabric: (fabricId: string) => void
  onSelectAngle: (angleId: string) => void
  onNext: () => void
}

export interface StepApercuProps {
  model: ModelWithImages
  visuals: VisualWithFabricAndImage[]
  selectedFabricId: string | null
  selectedAngle: string | null
  onSelectAngle: (angleId: string) => void
  onSimulate: () => void
  fabricName: string | null
  isPremium: boolean
  totalPrice: number
}

export interface StepSimulationProps {
  model: ModelWithImages
  previewUrl: string | null
  simulationStatus: SimulationStatus
  errorMessage: string | null
  progress: number
  progressStage: number
  onFileSelected: (file: File) => void
  onPresetSelected: (presetId: string) => void
  onLaunch: (rect: PlacementRect) => void
  onChangePhoto: () => void
  onCancel: () => void
  fabricName: string | null
  selectedFabricId: string | null
}

export interface StepResultatProps {
  model: ModelWithImages
  previewUrl: string | null
  resultBlobUrl: string | null
  fabricName: string | null
  onDownload: () => void
  onShare: () => void
  onRetry: () => void
  shopifyUrl: string | null
}

export const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/heif'])
export const MAX_SIZE_BYTES = 15 * 1024 * 1024
export const PRESET_ROOMS = [
  { id: 'modern', label: 'Salon moderne', image: '/presets/salon-moderne.jpg' },
  { id: 'classic', label: 'Salon classique', image: '/presets/salon-classique.jpg' },
  { id: 'small', label: 'Petit espace', image: '/presets/petit-espace.jpg' },
  { id: 'loft', label: 'Loft', image: '/presets/loft.jpg' },
] as const
```

- [ ] **Step 2: Verifier TypeScript**

Run: `npx tsc --noEmit`
Expected: PASS (le fichier est self-contained avec imports valides)

- [ ] **Step 3: Commit**

```bash
git add src/components/public/Configurator/types.ts
git commit -m "feat(configurator): add types and state machine definitions"
```

---

## Task 2: Composant Toast reutilisable

**Files:**
- Create: `src/components/public/Configurator/Toast.tsx`
- Create: `src/components/public/Configurator/Toast.module.css`

- [ ] **Step 1: Creer Toast.module.css**

```css
/* src/components/public/Configurator/Toast.module.css */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(100%);
  background: var(--color-text);
  color: #ffffff;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 300;
  opacity: 0;
  transition: transform 300ms ease, opacity 300ms ease;
  pointer-events: none;
  box-shadow: var(--shadow-lg);
}

.toast.visible {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
  pointer-events: auto;
}

.icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.checkPath {
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
  animation: drawCheck 400ms ease forwards 100ms;
}

@keyframes drawCheck {
  to {
    stroke-dashoffset: 0;
  }
}

.closeButton {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 4px;
  margin-left: 8px;
  line-height: 1;
}

.closeButton:hover {
  color: #ffffff;
}
```

- [ ] **Step 2: Creer Toast.tsx**

```tsx
// src/components/public/Configurator/Toast.tsx
'use client'

import { useEffect, useRef } from 'react'
import styles from './Toast.module.css'

interface ToastProps {
  message: string
  visible: boolean
  onDismiss: () => void
  duration?: number
}

export function Toast({ message, visible, onDismiss, duration = 4000 }: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (visible) {
      timerRef.current = setTimeout(onDismiss, duration)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [visible, duration, onDismiss])

  return (
    <div
      className={`${styles.toast} ${visible ? styles.visible : ''}`}
      role="status"
      aria-live="polite"
    >
      <svg className={styles.icon} viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="8" stroke="#4CAF50" strokeWidth="1.5" />
        <path className={styles.checkPath} d="M5 9.5l2.5 2.5L13 6.5" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{message}</span>
      <button type="button" className={styles.closeButton} onClick={onDismiss} aria-label="Fermer">
        &times;
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Verifier TypeScript**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/public/Configurator/Toast.tsx src/components/public/Configurator/Toast.module.css
git commit -m "feat(configurator): add Toast notification component"
```

---

## Task 3: Composant ConfiguratorStepper

**Files:**
- Create: `src/components/public/Configurator/ConfiguratorStepper.tsx`
- Create: `src/components/public/Configurator/ConfiguratorStepper.module.css`

- [ ] **Step 1: Creer ConfiguratorStepper.module.css**

```css
/* src/components/public/Configurator/ConfiguratorStepper.module.css */
.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid rgba(216, 195, 173, 0.15);
  background: var(--surface);
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  padding: 4px;
  cursor: default;
  font-family: inherit;
}

.step.clickable {
  cursor: pointer;
}

.step.clickable:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

.circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  transition: background-color 400ms ease-in-out, color 400ms ease-in-out;
}

.circleActive {
  background: var(--color-primary);
  color: #ffffff;
}

.circleCompleted {
  background: var(--color-primary);
  color: #ffffff;
}

.circleFuture {
  background: var(--surface-container-highest);
  color: var(--color-muted);
}

.label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-muted);
  transition: color 400ms ease-in-out, font-weight 400ms ease-in-out;
}

.labelActive {
  color: var(--color-text);
  font-weight: 600;
}

.separator {
  width: 40px;
  height: 1px;
  background: var(--outline-variant);
}

/* Mobile: labels masques */
@media (max-width: 639px) {
  .stepper {
    gap: var(--spacing-md);
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .label {
    display: none;
  }

  .separator {
    width: 24px;
  }
}
```

- [ ] **Step 2: Creer ConfiguratorStepper.tsx**

```tsx
// src/components/public/Configurator/ConfiguratorStepper.tsx
'use client'

import { Check } from 'lucide-react'
import type { ConfiguratorStep } from './types'
import styles from './ConfiguratorStepper.module.css'

const STEPS: { key: ConfiguratorStep; label: string }[] = [
  { key: 'tissu', label: 'Tissu' },
  { key: 'apercu', label: 'Apercu' },
  { key: 'simulation', label: 'Simulation' },
  { key: 'resultat', label: 'Resultat' },
]

interface ConfiguratorStepperProps {
  currentStep: ConfiguratorStep
  completedSteps: Set<ConfiguratorStep>
  onNavigate: (step: ConfiguratorStep) => void
}

export function ConfiguratorStepper({ currentStep, completedSteps, onNavigate }: ConfiguratorStepperProps) {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep)

  return (
    <nav className={styles.stepper} aria-label="Etapes du configurateur">
      {STEPS.map((step, index) => {
        const isActive = step.key === currentStep
        const isCompleted = completedSteps.has(step.key)
        const canNavigate = isCompleted && !isActive

        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 'inherit' }}>
            <button
              type="button"
              className={`${styles.step} ${canNavigate ? styles.clickable : ''}`}
              onClick={canNavigate ? () => onNavigate(step.key) : undefined}
              disabled={!canNavigate}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Etape ${index + 1}: ${step.label}${isCompleted ? ' (terminee)' : ''}`}
            >
              <span className={`${styles.circle} ${isActive ? styles.circleActive : isCompleted ? styles.circleCompleted : styles.circleFuture}`}>
                {isCompleted && !isActive ? (
                  <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </span>
              <span className={`${styles.label} ${isActive ? styles.labelActive : ''}`}>
                {step.label}
              </span>
            </button>
            {index < STEPS.length - 1 && <span className={styles.separator} aria-hidden="true" />}
          </div>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 3: Verifier TypeScript**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/public/Configurator/ConfiguratorStepper.tsx src/components/public/Configurator/ConfiguratorStepper.module.css
git commit -m "feat(configurator): add stepper component with 4-step navigation"
```

---

## Task 4: Composant BeforeAfterSlider

**Files:**
- Create: `src/components/public/Configurator/BeforeAfterSlider.tsx`
- Create: `src/components/public/Configurator/BeforeAfterSlider.module.css`

- [ ] **Step 1: Creer BeforeAfterSlider.module.css**

```css
/* src/components/public/Configurator/BeforeAfterSlider.module.css */
.container {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-lg);
  overflow: hidden;
  user-select: none;
  touch-action: none;
}

.imageLayer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.afterClip {
  clip-path: inset(0 0 0 var(--slider-pos));
}

.beforeClip {
  clip-path: inset(0 calc(100% - var(--slider-pos)) 0 0);
}

.divider {
  position: absolute;
  top: 0;
  bottom: 0;
  left: var(--slider-pos);
  width: 2px;
  background: #ffffff;
  transform: translateX(-50%);
  pointer-events: none;
}

.handle {
  position: absolute;
  top: 50%;
  left: var(--slider-pos);
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ew-resize;
  z-index: 2;
}

.handle:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.handleIcon {
  width: 16px;
  height: 16px;
  color: var(--color-text);
}

.labelBefore,
.labelAfter {
  position: absolute;
  top: 12px;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.55);
  color: #ffffff;
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  pointer-events: none;
}

.labelBefore {
  left: 12px;
}

.labelAfter {
  right: 12px;
}

/* Mobile < 480px : toggle au lieu de slider */
@media (max-width: 479px) {
  .handle,
  .divider {
    display: none;
  }

  .toggleBar {
    display: flex;
    gap: 0;
    margin-top: var(--spacing-sm);
  }

  .toggleButton {
    flex: 1;
    padding: 10px;
    border: 1px solid var(--outline-variant);
    background: var(--surface-container-low);
    font-size: var(--font-size-sm);
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: background-color 300ms ease;
  }

  .toggleButton:first-child {
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
  }

  .toggleButton:last-child {
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }

  .toggleButtonActive {
    background: var(--color-primary);
    color: #ffffff;
    border-color: var(--color-primary);
  }
}

@media (min-width: 480px) {
  .toggleBar {
    display: none;
  }
}
```

- [ ] **Step 2: Creer BeforeAfterSlider.tsx**

```tsx
// src/components/public/Configurator/BeforeAfterSlider.tsx
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronsLeftRight } from 'lucide-react'
import styles from './BeforeAfterSlider.module.css'

interface BeforeAfterSliderProps {
  beforeSrc: string
  afterSrc: string
  beforeAlt: string
  afterAlt: string
}

export function BeforeAfterSlider({ beforeSrc, afterSrc, beforeAlt, afterAlt }: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50)
  const [mobileView, setMobileView] = useState<'before' | 'after'>('after')
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.max(0, Math.min(100, x)))
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    updatePosition(e.clientX)
  }, [updatePosition])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    updatePosition(e.clientX)
  }, [updatePosition])

  const handlePointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setPosition(p => Math.max(0, p - 5))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setPosition(p => Math.min(100, p + 5))
    }
  }, [])

  // Detect mobile for toggle mode
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 480)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div>
      <div
        ref={containerRef}
        className={styles.container}
        style={{ '--slider-pos': `${position}%` } as React.CSSProperties}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        aria-label="Comparaison avant et apres la simulation"
      >
        {isMobile ? (
          <img
            src={mobileView === 'before' ? beforeSrc : afterSrc}
            alt={mobileView === 'before' ? beforeAlt : afterAlt}
            className={styles.imageLayer}
          />
        ) : (
          <>
            <img src={beforeSrc} alt={beforeAlt} className={`${styles.imageLayer} ${styles.beforeClip}`} />
            <img src={afterSrc} alt={afterAlt} className={`${styles.imageLayer} ${styles.afterClip}`} />
            <div className={styles.divider} />
            <div
              className={styles.handle}
              role="slider"
              aria-label="Deplacer pour comparer avant et apres"
              aria-valuenow={Math.round(position)}
              aria-valuemin={0}
              aria-valuemax={100}
              tabIndex={0}
              onPointerDown={handlePointerDown}
              onKeyDown={handleKeyDown}
            >
              <ChevronsLeftRight className={styles.handleIcon} aria-hidden="true" />
            </div>
            <span className={styles.labelBefore}>Avant</span>
            <span className={styles.labelAfter}>Apres</span>
          </>
        )}
      </div>

      {/* Toggle mobile */}
      <div className={styles.toggleBar}>
        <button
          type="button"
          className={`${styles.toggleButton} ${mobileView === 'before' ? styles.toggleButtonActive : ''}`}
          onClick={() => setMobileView('before')}
        >
          Avant
        </button>
        <button
          type="button"
          className={`${styles.toggleButton} ${mobileView === 'after' ? styles.toggleButtonActive : ''}`}
          onClick={() => setMobileView('after')}
        >
          Apres
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verifier TypeScript**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/public/Configurator/BeforeAfterSlider.tsx src/components/public/Configurator/BeforeAfterSlider.module.css
git commit -m "feat(configurator): add BeforeAfterSlider with keyboard and mobile toggle"
```

---

## Task 5: Composants PhotoGuidance et PresetRooms

**Files:**
- Create: `src/components/public/Configurator/PhotoGuidance.tsx`
- Create: `src/components/public/Configurator/PresetRooms.tsx`

- [ ] **Step 1: Creer PhotoGuidance.tsx**

```tsx
// src/components/public/Configurator/PhotoGuidance.tsx
'use client'

import { Check, X as XIcon } from 'lucide-react'
import styles from './StepSimulation.module.css'

export function PhotoGuidance() {
  return (
    <div className={styles.guidance}>
      <p className={styles.guidanceTitle}>Conseils pour une bonne photo</p>
      <div className={styles.guidanceGrid}>
        <div className={styles.guidanceItem}>
          <Check size={14} className={styles.guidanceGood} aria-hidden="true" />
          <span>Bonne luminosite, sol visible</span>
        </div>
        <div className={styles.guidanceItem}>
          <XIcon size={14} className={styles.guidanceBad} aria-hidden="true" />
          <span>Trop sombre ou trop pres</span>
        </div>
        <div className={styles.guidanceItem}>
          <Check size={14} className={styles.guidanceGood} aria-hidden="true" />
          <span>Vue large de la piece</span>
        </div>
        <div className={styles.guidanceItem}>
          <XIcon size={14} className={styles.guidanceBad} aria-hidden="true" />
          <span>Photo floue ou en angle</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Creer PresetRooms.tsx**

```tsx
// src/components/public/Configurator/PresetRooms.tsx
'use client'

import Image from 'next/image'
import { PRESET_ROOMS } from './types'
import styles from './StepSimulation.module.css'

interface PresetRoomsProps {
  selectedId: string | null
  onSelect: (id: string) => void
}

export function PresetRooms({ selectedId, onSelect }: PresetRoomsProps) {
  return (
    <div className={styles.presets}>
      <p className={styles.presetsLabel}>Ou choisissez un salon type</p>
      <div className={styles.presetsGrid}>
        {PRESET_ROOMS.map(room => (
          <button
            key={room.id}
            type="button"
            className={`${styles.presetCard} ${selectedId === room.id ? styles.presetCardActive : ''}`}
            onClick={() => onSelect(room.id)}
            aria-pressed={selectedId === room.id}
          >
            <Image
              src={room.image}
              alt={room.label}
              width={120}
              height={80}
              className={styles.presetImage}
            />
            <span className={styles.presetLabel}>{room.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verifier TypeScript**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/public/Configurator/PhotoGuidance.tsx src/components/public/Configurator/PresetRooms.tsx
git commit -m "feat(configurator): add PhotoGuidance and PresetRooms components"
```

---

## Task 6: SofaPlacer ameliore

**Files:**
- Create: `src/components/public/Configurator/SofaPlacer.tsx`
- Create: `src/components/public/Configurator/SofaPlacer.module.css`

- [ ] **Step 1: Creer SofaPlacer.module.css**

Copier le CSS actuel depuis `src/components/public/Catalogue/SofaPlacer.module.css` et ajouter :

```css
/* Ajouts au SofaPlacer.module.css existant */

.resetButton {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 3;
  background: rgba(0, 0, 0, 0.55);
  color: #ffffff;
  border: none;
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.8;
  transition: opacity 300ms ease;
}

.resetButton:hover {
  opacity: 1;
}

.resetButton:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.guideLine {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  border-top: 1px dashed rgba(255, 255, 255, 0.3);
  pointer-events: none;
  z-index: 1;
}

.instructionLabel {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.55);
  color: #ffffff;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
  pointer-events: none;
  white-space: nowrap;
  transition: opacity 400ms ease-in-out;
  z-index: 3;
}

.instructionLabelHidden {
  opacity: 0;
}

.rectDragging {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
```

- [ ] **Step 2: Creer SofaPlacer.tsx ameliore**

Copier la logique de `src/components/public/Catalogue/SofaPlacer.tsx` et ajouter :
- Bouton reset position
- Lignes de guidage a 33% et 66%
- Label d'instruction qui disparait apres le 1er drag
- Shadow pendant le drag

```tsx
// src/components/public/Configurator/SofaPlacer.tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { RotateCcw } from 'lucide-react'
import type { PlacementRect } from './types'
import styles from './SofaPlacer.module.css'

interface SofaPlacerProps {
  imageUrl: string
  sofaWidth: number
  sofaDepth: number
  onLaunch: (rect: PlacementRect) => void
  onChangePhoto: () => void
}

const MIN_SCALE = 20
const MAX_SCALE = 80
const DEFAULT_SCALE = 45
const DEFAULT_Y = 55

export function SofaPlacer({ imageUrl, sofaWidth, sofaDepth, onLaunch, onChangePhoto }: SofaPlacerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const aspectRatio = sofaWidth / sofaDepth

  const [scale, setScale] = useState(DEFAULT_SCALE)
  const rectW = scale
  const rectH = Math.min(scale / aspectRatio, 90)

  const [pos, setPos] = useState({ x: (100 - DEFAULT_SCALE) / 2, y: DEFAULT_Y - rectH / 2 })
  const [hasDragged, setHasDragged] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragging = useRef(false)
  const dragStart = useRef({ px: 0, py: 0, startX: 0, startY: 0 })

  const clamp = useCallback((x: number, y: number, w: number, h: number) => ({
    x: Math.max(0, Math.min(x, 100 - w)),
    y: Math.max(0, Math.min(y, 100 - h)),
  }), [])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true
    setIsDragging(true)
    setHasDragged(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    dragStart.current = { px: e.clientX, py: e.clientY, startX: pos.x, startY: pos.y }
  }, [pos])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const dx = ((e.clientX - dragStart.current.px) / rect.width) * 100
    const dy = ((e.clientY - dragStart.current.py) / rect.height) * 100
    setPos(clamp(dragStart.current.startX + dx, dragStart.current.startY + dy, rectW, rectH))
  }, [clamp, rectW, rectH])

  const handlePointerUp = useCallback(() => {
    dragging.current = false
    setIsDragging(false)
  }, [])

  const handleReset = useCallback(() => {
    setScale(DEFAULT_SCALE)
    const newW = DEFAULT_SCALE
    const newH = Math.min(DEFAULT_SCALE / aspectRatio, 90)
    setPos({ x: (100 - newW) / 2, y: DEFAULT_Y - newH / 2 })
  }, [aspectRatio])

  const handleScaleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = Number(e.target.value)
    setScale(newScale)
    const newW = newScale
    const newH = Math.min(newScale / aspectRatio, 90)
    setPos(prev => clamp(prev.x, prev.y, newW, newH))
  }, [aspectRatio, clamp])

  const handleLaunch = useCallback(() => {
    onLaunch({ x: pos.x, y: pos.y, width: rectW, height: rectH })
  }, [onLaunch, pos, rectW, rectH])

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.container}>
        <img src={imageUrl} alt="" className={styles.backgroundImage} />

        {/* Lignes de guidage */}
        <div className={styles.guideLine} style={{ top: '33%' }} />
        <div className={styles.guideLine} style={{ top: '66%' }} />

        {/* Bouton reset */}
        <button type="button" className={styles.resetButton} onClick={handleReset} aria-label="Reinitialiser la position">
          <RotateCcw size={12} aria-hidden="true" />
          Reset
        </button>

        {/* Rectangle de placement */}
        <div
          className={`${styles.rect} ${isDragging ? styles.rectDragging : ''}`}
          style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${rectW}%`, height: `${rectH}%` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <span className={styles.dimensionBadge}>
            {sofaWidth} &times; {sofaDepth} cm
          </span>
        </div>

        {/* Label instruction */}
        <span className={`${styles.instructionLabel} ${hasDragged ? styles.instructionLabelHidden : ''}`}>
          Deplacez le rectangle pour positionner votre canape
        </span>
      </div>

      {/* Slider taille */}
      <div className={styles.sliderRow}>
        <label htmlFor="sofa-scale" className={styles.sliderLabel}>Taille du canape</label>
        <input
          id="sofa-scale"
          type="range"
          min={MIN_SCALE}
          max={MAX_SCALE}
          value={scale}
          onChange={handleScaleChange}
          className={styles.slider}
        />
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button type="button" className={styles.launchButton} onClick={handleLaunch}>
          Lancer la simulation
        </button>
        <button type="button" className={styles.changePhotoButton} onClick={onChangePhoto}>
          Changer la photo
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verifier TypeScript**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/public/Configurator/SofaPlacer.tsx src/components/public/Configurator/SofaPlacer.module.css
git commit -m "feat(configurator): add improved SofaPlacer with reset, guides, instructions"
```

---

## Task 7: StepTissu — selection tissu avec categories

**Files:**
- Create: `src/components/public/Configurator/StepTissu.tsx`
- Create: `src/components/public/Configurator/StepTissu.module.css`

- [ ] **Step 1: Creer StepTissu.module.css**

```css
/* src/components/public/Configurator/StepTissu.module.css */
.container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  height: 100%;
}

.categoryTabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.categoryPill {
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  border: 1px solid rgba(216, 195, 173, 0.15);
  background: var(--surface-container-low);
  color: var(--color-text);
  cursor: pointer;
  transition: background-color 300ms ease, color 300ms ease, border-color 300ms ease;
}

.categoryPill:hover {
  background: var(--surface-container-high);
}

.categoryPill:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.categoryPillActive {
  background: var(--color-primary);
  color: #ffffff;
  border-color: var(--color-primary);
}

.swatchGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
  gap: 10px;
}

.swatch {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid rgba(216, 195, 173, 0.15);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 250ms ease;
  padding: 0;
  background: none;
}

.swatch:hover {
  transform: scale(1.08);
}

.swatch:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 4px;
}

.swatchSelected {
  border: 2px solid var(--color-primary);
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.swatchImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.fabricInfo {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  font-weight: 500;
}

.fabricInfoPremium {
  color: var(--color-muted);
  font-weight: 400;
}

.priceBlock {
  margin-top: auto;
  padding-top: var(--spacing-lg);
  border-top: 1px solid rgba(216, 195, 173, 0.15);
}

.totalLabel {
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-muted);
  margin-bottom: 4px;
}

.totalPrice {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-primary);
}

.ctaNext {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  color: #ffffff;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  font-family: inherit;
  transition: transform 300ms ease, box-shadow 300ms ease;
  margin-top: var(--spacing-md);
}

.ctaNext:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.ctaNext:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 4px;
}

.ctaNext:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.emptyMessage {
  color: var(--color-muted);
  font-size: var(--font-size-sm);
  font-style: italic;
}
```

- [ ] **Step 2: Creer StepTissu.tsx**

```tsx
// src/components/public/Configurator/StepTissu.tsx
'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import type { StepTissuProps } from './types'
import { calculatePrice, formatPrice } from '@/lib/utils'
import styles from './StepTissu.module.css'

export function StepTissu({
  model,
  fabrics,
  visuals,
  selectedFabricId,
  selectedAngle,
  onSelectFabric,
  onSelectAngle,
  onNext,
}: StepTissuProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Filtrage tissus eligibles (ayant au moins un rendu publie pour ce modele)
  const eligibleFabricIds = useMemo(() => new Set(
    visuals
      .filter(v => v.model_id === model.id && v.is_published)
      .map(v => v.fabric_id)
  ), [visuals, model.id])

  const eligibleFabrics = useMemo(() =>
    fabrics.filter(f => eligibleFabricIds.has(f.id) && f.swatch_url !== null),
    [fabrics, eligibleFabricIds]
  )

  // Categories uniques
  const categories = useMemo(() => {
    const cats = new Set(eligibleFabrics.map(f => f.category).filter(Boolean) as string[])
    return Array.from(cats).sort()
  }, [eligibleFabrics])

  // Filtrage par categorie
  const filteredFabrics = activeCategory
    ? eligibleFabrics.filter(f => f.category === activeCategory)
    : eligibleFabrics

  const selectedFabric = selectedFabricId
    ? eligibleFabrics.find(f => f.id === selectedFabricId) ?? null
    : null

  const handleFabricSelect = (fabricId: string) => {
    onSelectFabric(fabricId)

    // Preservation angle : verifier si l'angle courant a un rendu pour ce tissu
    const hasRenderForCurrentAngle = selectedAngle !== null && visuals.some(
      v => v.model_id === model.id && v.fabric_id === fabricId && v.model_image_id === selectedAngle && v.is_published
    )
    if (!hasRenderForCurrentAngle) {
      const anglesForFabric = model.model_images.filter(img =>
        visuals.some(v => v.model_id === model.id && v.model_image_id === img.id && v.fabric_id === fabricId && v.is_published)
      )
      const default34 = anglesForFabric.find(img => img.view_type === '3/4')
      onSelectAngle(default34?.id ?? anglesForFabric[0]?.id ?? model.model_images[0]?.id ?? '')
    }
  }

  return (
    <div className={styles.container}>
      {/* Categories */}
      {categories.length > 1 && (
        <div className={styles.categoryTabs} role="tablist" aria-label="Filtrer par categorie de tissu">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === null}
            className={`${styles.categoryPill} ${activeCategory === null ? styles.categoryPillActive : ''}`}
            onClick={() => setActiveCategory(null)}
          >
            Tous
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat}
              className={`${styles.categoryPill} ${activeCategory === cat ? styles.categoryPillActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Swatches */}
      {filteredFabrics.length > 0 ? (
        <div role="radiogroup" aria-label="Choisissez votre tissu" className={styles.swatchGrid}>
          {filteredFabrics.map(fabric => (
            <button
              key={fabric.id}
              type="button"
              role="radio"
              aria-checked={selectedFabricId === fabric.id}
              aria-label={`${fabric.name}${fabric.is_premium ? ' — Premium (+80 €)' : ''}`}
              className={`${styles.swatch} ${selectedFabricId === fabric.id ? styles.swatchSelected : ''}`}
              onClick={() => handleFabricSelect(fabric.id)}
            >
              <Image src={fabric.swatch_url!} alt="" fill sizes="48px" className={styles.swatchImage} />
            </button>
          ))}
        </div>
      ) : (
        <p className={styles.emptyMessage}>Aucun tissu disponible pour ce modele.</p>
      )}

      {/* Info tissu selectionne */}
      {selectedFabric && (
        <p className={styles.fabricInfo}>
          {selectedFabric.name}
          {selectedFabric.is_premium && (
            <span className={styles.fabricInfoPremium}> — Premium (+80 &euro;)</span>
          )}
        </p>
      )}

      {/* Prix + CTA */}
      <div className={styles.priceBlock}>
        <p className={styles.totalLabel}>Total</p>
        <p className={styles.totalPrice}>
          {selectedFabric
            ? formatPrice(calculatePrice(model.price, selectedFabric.is_premium))
            : formatPrice(model.price)}
        </p>
        <button
          type="button"
          className={styles.ctaNext}
          onClick={onNext}
          disabled={!selectedFabricId}
        >
          Suivant &mdash; Apercu des angles
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verifier TypeScript**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/public/Configurator/StepTissu.tsx src/components/public/Configurator/StepTissu.module.css
git commit -m "feat(configurator): add StepTissu with category tabs and swatch selector"
```

---

## Task 8: StepApercu — navigation angles

**Files:**
- Create: `src/components/public/Configurator/StepApercu.tsx`
- Create: `src/components/public/Configurator/StepApercu.module.css`

- [ ] **Step 1: Creer StepApercu.module.css**

```css
/* src/components/public/Configurator/StepApercu.module.css */
.container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  height: 100%;
}

.title {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--color-text);
}

.subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.thumbnailRow {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 4px 0;
}

.thumbnailRow::-webkit-scrollbar {
  display: none;
}

.thumbnail {
  flex-shrink: 0;
  width: 72px;
  height: 54px;
  border-radius: var(--radius-sm);
  border: 2px solid transparent;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  padding: 0;
  background: none;
  transition: border-color 300ms ease;
}

.thumbnail:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.thumbnailActive {
  border-color: var(--color-primary);
}

.thumbnailImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.actions {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.ctaPrimary {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  color: #ffffff;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  font-family: inherit;
  transition: transform 300ms ease, box-shadow 300ms ease;
}

.ctaPrimary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.ctaPrimary:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 4px;
}

.ctaSecondary {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: var(--font-size-sm);
  cursor: pointer;
  font-family: inherit;
  text-decoration: none;
  text-align: center;
  transition: background-color 300ms ease, color 300ms ease;
}

.ctaSecondary:hover {
  background: var(--color-primary);
  color: #ffffff;
}

.ctaSecondary:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 4px;
}

.priceRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) 0;
  border-top: 1px solid rgba(216, 195, 173, 0.15);
}

.priceLabel {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.priceValue {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-primary);
}
```

- [ ] **Step 2: Creer StepApercu.tsx**

```tsx
// src/components/public/Configurator/StepApercu.tsx
'use client'

import Image from 'next/image'
import type { StepApercuProps } from './types'
import { formatPrice } from '@/lib/utils'
import styles from './StepApercu.module.css'

export function StepApercu({
  model,
  visuals,
  selectedFabricId,
  selectedAngle,
  onSelectAngle,
  onSimulate,
  fabricName,
  isPremium,
  totalPrice,
}: StepApercuProps) {
  // Angles disponibles filtres par tissu selectionne
  const availableAngles = selectedFabricId
    ? model.model_images.filter(img =>
        visuals.some(v =>
          v.model_id === model.id &&
          v.model_image_id === img.id &&
          v.fabric_id === selectedFabricId &&
          v.is_published
        )
      )
    : model.model_images

  return (
    <div className={styles.container}>
      <div>
        <h3 className={styles.title}>{model.name}</h3>
        {fabricName && (
          <p className={styles.subtitle}>
            Tissu : {fabricName}{isPremium ? ' (Premium)' : ''}
          </p>
        )}
      </div>

      {/* Thumbnails angles */}
      {availableAngles.length > 1 && (
        <div className={styles.thumbnailRow} role="radiogroup" aria-label="Choisir l'angle de vue">
          {availableAngles.map(img => (
            <button
              key={img.id}
              type="button"
              role="radio"
              aria-checked={selectedAngle === img.id}
              aria-label={`Vue ${img.view_type}`}
              className={`${styles.thumbnail} ${selectedAngle === img.id ? styles.thumbnailActive : ''}`}
              onClick={() => onSelectAngle(img.id)}
            >
              <Image src={img.image_url} alt="" fill sizes="72px" className={styles.thumbnailImage} />
            </button>
          ))}
        </div>
      )}

      {/* Prix */}
      <div className={styles.priceRow}>
        <span className={styles.priceLabel}>Prix total</span>
        <span className={styles.priceValue}>{formatPrice(totalPrice)}</span>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button type="button" className={styles.ctaPrimary} onClick={onSimulate}>
          Simuler chez moi
        </button>
        {model.shopify_url && (
          <a
            href={model.shopify_url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaSecondary}
          >
            Commander sur Shopify
          </a>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verifier TypeScript**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/public/Configurator/StepApercu.tsx src/components/public/Configurator/StepApercu.module.css
git commit -m "feat(configurator): add StepApercu with angle navigation and CTAs"
```

---

## Task 9: StepSimulation — upload + placement

**Files:**
- Create: `src/components/public/Configurator/StepSimulation.tsx`
- Create: `src/components/public/Configurator/StepSimulation.module.css`

- [ ] **Step 1: Creer StepSimulation.module.css**

```css
/* src/components/public/Configurator/StepSimulation.module.css */
.container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.uploadZone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
  border: 2px dashed var(--outline-variant);
  border-radius: var(--radius-lg);
  background: var(--surface-container-low);
  cursor: pointer;
  transition: border-color 400ms ease-in-out, background-color 400ms ease-in-out;
  min-height: 200px;
}

.uploadZone:hover,
.uploadZoneDragging {
  border-color: var(--color-primary);
  background: var(--surface-container);
}

.uploadIcon {
  width: 40px;
  height: 40px;
  color: var(--color-muted);
}

.uploadText {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text);
}

.uploadOr {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.uploadButton {
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  color: #ffffff;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: var(--font-size-sm);
  cursor: pointer;
  font-family: inherit;
}

.uploadFormats {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

.hiddenInput {
  display: none;
}

.errorMessage {
  color: var(--color-error);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

/* Guidance */
.guidance {
  padding: var(--spacing-md);
  background: var(--surface-container-low);
  border-radius: var(--radius-md);
}

.guidanceTitle {
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-muted);
  margin-bottom: var(--spacing-sm);
}

.guidanceGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.guidanceItem {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-xs);
  color: var(--color-text);
}

.guidanceGood {
  color: var(--color-success);
}

.guidanceBad {
  color: var(--color-error);
}

/* Presets */
.presets {
  padding-top: var(--spacing-md);
}

.presetsLabel {
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-muted);
  margin-bottom: var(--spacing-sm);
}

.presetsGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
}

.presetCard {
  border: 1px solid rgba(216, 195, 173, 0.15);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  background: none;
  padding: 0;
  font-family: inherit;
  transition: border-color 300ms ease, transform 300ms ease;
}

.presetCard:hover {
  transform: translateY(-2px);
}

.presetCard:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.presetCardActive {
  border-color: var(--color-primary);
  border-width: 2px;
}

.presetImage {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

.presetLabel {
  display: block;
  padding: 6px 8px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-text);
  text-align: center;
}

/* Generating overlay */
.generatingContainer {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.generatingImage {
  width: 100%;
  display: block;
  filter: brightness(0.6);
}

.generatingOverlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
}

.stepList {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 280px;
}

.stepItem {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.5);
}

.stepItemActive {
  color: #ffffff;
  font-weight: 500;
}

.stepItemDone {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: line-through;
}

.stepIcon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.cancelButton {
  margin-top: var(--spacing-md);
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
  font-family: inherit;
}
```

- [ ] **Step 2: Creer StepSimulation.tsx**

```tsx
// src/components/public/Configurator/StepSimulation.tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload } from 'lucide-react'
import type { StepSimulationProps } from './types'
import { ACCEPTED_TYPES, MAX_SIZE_BYTES } from './types'
import { parseDimensions } from '@/lib/utils'
import { SofaPlacer } from './SofaPlacer'
import { PhotoGuidance } from './PhotoGuidance'
import { PresetRooms } from './PresetRooms'
import styles from './StepSimulation.module.css'

const PROGRESS_STAGES = [
  'Analyse de votre photo...',
  'Placement du canape...',
  'Application des textures...',
  'Finalisation du rendu...',
] as const

export function StepSimulation({
  model,
  previewUrl,
  simulationStatus,
  errorMessage,
  progress,
  progressStage,
  onFileSelected,
  onPresetSelected,
  onLaunch,
  onChangePhoto,
  onCancel,
  fabricName,
  selectedFabricId,
}: StepSimulationProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [presetId, setPresetId] = useState<string | null>(null)
  const dragCounterRef = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateAndSelect = useCallback((file: File) => {
    if (file.size > MAX_SIZE_BYTES) {
      return // parent handles via error state
    }
    const isAccepted = ACCEPTED_TYPES.has(file.type) || /\.(heic|heif)$/i.test(file.name)
    if (!isAccepted) return
    onFileSelected(file)
  }, [onFileSelected])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current++
    if (dragCounterRef.current === 1) setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) validateAndSelect(file)
  }, [validateAndSelect])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFileSelected(file)
    e.target.value = ''
  }, [onFileSelected])

  const handlePresetSelect = useCallback((id: string) => {
    setPresetId(id)
    onPresetSelected(id)
  }, [onPresetSelected])

  const dims = model.dimensions ? parseDimensions(model.dimensions) : null

  // Etat idle : zone upload
  if (simulationStatus === 'idle' && !previewUrl) {
    return (
      <div className={styles.container}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic,image/heif"
          className={styles.hiddenInput}
          onChange={handleInputChange}
          aria-label="Selectionner une photo de votre salon"
        />

        <div
          className={`${styles.uploadZone} ${isDragging ? styles.uploadZoneDragging : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click() } }}
          aria-label="Zone de depot de fichier"
        >
          <Upload className={styles.uploadIcon} aria-hidden="true" />
          <span className={styles.uploadText}>Glissez votre photo ici</span>
          <span className={styles.uploadOr}>ou</span>
          <button type="button" className={styles.uploadButton} onClick={() => fileInputRef.current?.click()}>
            Choisir une photo
          </button>
          <span className={styles.uploadFormats}>JPEG, PNG, HEIC — max 15 Mo</span>
        </div>

        {errorMessage && (
          <p className={styles.errorMessage} role="alert">{errorMessage}</p>
        )}

        <PhotoGuidance />
        <PresetRooms selectedId={presetId} onSelect={handlePresetSelect} />
      </div>
    )
  }

  // Etat placing / error : SofaPlacer
  if ((simulationStatus === 'placing' || simulationStatus === 'error') && previewUrl) {
    return (
      <div className={styles.container}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic,image/heif"
          className={styles.hiddenInput}
          onChange={handleInputChange}
        />
        <SofaPlacer
          imageUrl={previewUrl}
          sofaWidth={dims?.width ?? 250}
          sofaDepth={dims?.depth ?? 160}
          onLaunch={onLaunch}
          onChangePhoto={() => fileInputRef.current?.click()}
        />
        {simulationStatus === 'error' && errorMessage && (
          <p className={styles.errorMessage} role="alert">{errorMessage}</p>
        )}
      </div>
    )
  }

  // Etat generating : overlay progression
  if (simulationStatus === 'generating' && previewUrl) {
    return (
      <div className={styles.container}>
        <div className={styles.generatingContainer}>
          <img src={previewUrl} alt="" className={styles.generatingImage} />
          <div className={styles.generatingOverlay}>
            <div className={styles.stepList} aria-live="polite">
              {PROGRESS_STAGES.map((label, i) => (
                <div
                  key={label}
                  className={`${styles.stepItem} ${i < progressStage ? styles.stepItemDone : i === progressStage ? styles.stepItemActive : ''}`}
                >
                  <span className={styles.stepIcon}>
                    {i < progressStage ? '✓' : i === progressStage ? '◌' : '○'}
                  </span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <button type="button" className={styles.cancelButton} onClick={onCancel}>
              Annuler
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
```

- [ ] **Step 3: Verifier TypeScript**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/public/Configurator/StepSimulation.tsx src/components/public/Configurator/StepSimulation.module.css
git commit -m "feat(configurator): add StepSimulation with upload, guidance, SofaPlacer"
```

---

## Task 10: StepResultat — resultat + slider + actions

**Files:**
- Create: `src/components/public/Configurator/StepResultat.tsx`
- Create: `src/components/public/Configurator/StepResultat.module.css`

- [ ] **Step 1: Creer StepResultat.module.css**

```css
/* src/components/public/Configurator/StepResultat.module.css */
.container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.title {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--color-text);
}

.subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
  margin-top: 4px;
}

.disclaimer {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  font-style: italic;
  text-align: center;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-sm);
}

.actionButton {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: transform 300ms ease, box-shadow 300ms ease;
  text-decoration: none;
}

.actionButton:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.actionButton:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.downloadButton {
  composes: actionButton;
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  color: #ffffff;
  border: none;
}

.shareButton {
  composes: actionButton;
  background: var(--color-whatsapp);
  color: #ffffff;
  border: none;
}

.shareButton:hover {
  background: var(--color-whatsapp-hover);
}

.orderButton {
  composes: actionButton;
  background: transparent;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
}

.retryButton {
  composes: actionButton;
  background: transparent;
  border: 1px solid var(--outline-variant);
  color: var(--color-text);
}
```

- [ ] **Step 2: Creer StepResultat.tsx**

```tsx
// src/components/public/Configurator/StepResultat.tsx
'use client'

import { Download, Share2, ExternalLink, RotateCcw } from 'lucide-react'
import type { StepResultatProps } from './types'
import { BeforeAfterSlider } from './BeforeAfterSlider'
import styles from './StepResultat.module.css'

export function StepResultat({
  model,
  previewUrl,
  resultBlobUrl,
  fabricName,
  onDownload,
  onShare,
  onRetry,
  shopifyUrl,
}: StepResultatProps) {
  if (!resultBlobUrl || !previewUrl) return null

  return (
    <div className={styles.container}>
      <div>
        <h3 className={styles.title}>Votre simulation</h3>
        <p className={styles.subtitle}>
          {fabricName
            ? `${model.name} × ${fabricName} dans votre salon`
            : `${model.name} dans votre salon`}
        </p>
      </div>

      <BeforeAfterSlider
        beforeSrc={previewUrl}
        afterSrc={resultBlobUrl}
        beforeAlt="Photo originale de votre salon"
        afterAlt={`Simulation avec le canape ${model.name}`}
      />

      <p className={styles.disclaimer}>
        Apercu genere par IA — le rendu reel peut varier
      </p>

      <div className={styles.actions}>
        <button type="button" className={styles.downloadButton} onClick={onDownload}>
          <Download size={16} aria-hidden="true" />
          Telecharger
        </button>
        <button type="button" className={styles.shareButton} onClick={onShare}>
          <Share2 size={16} aria-hidden="true" />
          Partager
        </button>
        {shopifyUrl && (
          <a href={shopifyUrl} target="_blank" rel="noopener noreferrer" className={styles.orderButton}>
            <ExternalLink size={16} aria-hidden="true" />
            Commander
          </a>
        )}
        <button type="button" className={styles.retryButton} onClick={onRetry}>
          <RotateCcw size={14} aria-hidden="true" />
          Reessayer
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verifier TypeScript**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/public/Configurator/StepResultat.tsx src/components/public/Configurator/StepResultat.module.css
git commit -m "feat(configurator): add StepResultat with BeforeAfterSlider and actions"
```

---

## Task 11: Configurator index — orchestrateur principal

**Files:**
- Create: `src/components/public/Configurator/index.tsx`
- Create: `src/components/public/Configurator/configurator.module.css`

- [ ] **Step 1: Creer configurator.module.css**

```css
/* src/components/public/Configurator/configurator.module.css */
.dialog {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: none;
  background: var(--surface);
  z-index: 200;
}

.dialog::backdrop {
  background: rgba(0, 0, 0, 0.4);
}

.layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.closeButton {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: var(--color-text);
  transition: background-color 300ms ease;
}

.closeButton:hover {
  background: rgba(0, 0, 0, 0.1);
}

.closeButton:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.leftColumn {
  flex: 0 0 60%;
  background: var(--surface-container-low);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  position: relative;
  overflow: hidden;
}

.rightColumn {
  flex: 0 0 40%;
  padding: var(--spacing-xl);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.imageWrapper {
  position: relative;
  width: 100%;
  max-width: 480px;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.imageMain {
  object-fit: cover;
  transition: opacity 400ms ease-in-out;
}

.badgeOriginal {
  position: absolute;
  bottom: 12px;
  left: 12px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.55);
  color: #ffffff;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

/* Mobile layout */
@media (max-width: 1023px) {
  .content {
    flex-direction: column;
  }

  .leftColumn {
    flex: none;
    max-height: 340px;
    padding: var(--spacing-md);
  }

  .rightColumn {
    flex: 1;
    padding: var(--spacing-md);
    padding-bottom: 80px; /* space for sticky bar */
  }
}

/* Sticky bar mobile */
.stickyBar {
  display: none;
}

@media (max-width: 1023px) {
  .stickyBar {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px var(--spacing-md);
    background: rgba(252, 249, 245, 0.9);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid rgba(216, 195, 173, 0.15);
    box-shadow: var(--shadow-sticky);
    z-index: 90;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
  }

  .stickyPrice {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--color-primary);
  }

  .stickyCta {
    padding: 12px 20px;
    background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
    color: #ffffff;
    border: none;
    border-radius: var(--radius-sm);
    font-weight: 600;
    font-size: var(--font-size-sm);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    font-family: inherit;
  }
}
```

- [ ] **Step 2: Creer index.tsx (orchestrateur)**

```tsx
// src/components/public/Configurator/index.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import type { ConfiguratorProps, ConfiguratorStep, SimulationStatus, PlacementRect } from './types'
import { ACCEPTED_TYPES, MAX_SIZE_BYTES } from './types'
import { getPrimaryImage, getPrimaryImageId, calculatePrice, formatPrice } from '@/lib/utils'
import { ConfiguratorStepper } from './ConfiguratorStepper'
import { StepTissu } from './StepTissu'
import { StepApercu } from './StepApercu'
import { StepSimulation } from './StepSimulation'
import { StepResultat } from './StepResultat'
import { Toast } from './Toast'
import styles from './configurator.module.css'

export function Configurator({ model, onClose, fabrics, visuals }: ConfiguratorProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const open = model !== null

  // State machine
  const [step, setStep] = useState<ConfiguratorStep>('tissu')
  const [completedSteps, setCompletedSteps] = useState<Set<ConfiguratorStep>>(new Set())
  const [selectedFabricId, setSelectedFabricId] = useState<string | null>(null)
  const [selectedAngle, setSelectedAngle] = useState<string | null>(null)

  // Simulation state
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultBlobUrl, setResultBlobUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressStage, setProgressStage] = useState(0)

  // Toast
  const [toastMessage, setToastMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressPhase2TimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const resultBlobUrlRef = useRef<string | null>(null)
  const previousModelIdRef = useRef<string | undefined>(undefined)

  // Sync refs
  useEffect(() => { previewUrlRef.current = previewUrl }, [previewUrl])
  useEffect(() => { resultBlobUrlRef.current = resultBlobUrl }, [resultBlobUrl])

  // Scroll lock
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
    } else {
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, parseInt(scrollY || '0') * -1)
    }
  }, [open])

  // Dialog sync
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  // Reset on model change
  useEffect(() => {
    if (!model) return
    setSelectedFabricId(null)
    setStep('tissu')
    setCompletedSteps(new Set())
    setSimulationStatus('idle')
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    setPreviewUrl(null)
    if (resultBlobUrlRef.current) URL.revokeObjectURL(resultBlobUrlRef.current)
    setResultBlobUrl(null)
    setProgress(0)
    setProgressStage(0)
    setErrorMessage(null)

    if (model.id !== previousModelIdRef.current) {
      setSelectedAngle(getPrimaryImageId(model.model_images))
    }
    previousModelIdRef.current = model.id
  }, [model?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      if (resultBlobUrlRef.current) URL.revokeObjectURL(resultBlobUrlRef.current)
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      if (progressPhase2TimerRef.current) clearInterval(progressPhase2TimerRef.current)
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Navigation
  const navigateToStep = useCallback((target: ConfiguratorStep) => {
    setStep(target)
  }, [])

  const goToApercu = useCallback(() => {
    setCompletedSteps(prev => new Set([...prev, 'tissu']))
    setStep('apercu')
  }, [])

  const goToSimulation = useCallback(() => {
    setCompletedSteps(prev => new Set([...prev, 'apercu']))
    setStep('simulation')
  }, [])

  // File handling
  const handleFileSelected = useCallback((file: File) => {
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage('Ce fichier depasse 15 Mo. Choisissez une photo plus legere.')
      return
    }
    const isAccepted = ACCEPTED_TYPES.has(file.type) || /\.(heic|heif)$/i.test(file.name)
    if (!isAccepted) {
      setErrorMessage('Format non supporte. Utilisez JPEG, PNG ou HEIC.')
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setSimulationStatus('placing')
    setErrorMessage(null)
  }, [previewUrl])

  const handlePresetSelected = useCallback((presetId: string) => {
    // Pour la v1 : les presets utilisent des images statiques
    // Le chemin est dans PRESET_ROOMS
    setPreviewUrl(`/presets/${presetId}.jpg`)
    setSimulationStatus('placing')
    setErrorMessage(null)
  }, [])

  // Progress timer
  const stopProgressTimer = useCallback(() => {
    if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null }
    if (progressPhase2TimerRef.current) { clearInterval(progressPhase2TimerRef.current); progressPhase2TimerRef.current = null }
  }, [])

  const startProgressTimer = useCallback(() => {
    stopProgressTimer()
    let current = 0
    setProgress(0)
    setProgressStage(0)
    progressTimerRef.current = setInterval(() => {
      current += 1.5
      if (current >= 30) {
        current = 30
        if (progressTimerRef.current) clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
        setProgressStage(1)
        progressPhase2TimerRef.current = setInterval(() => {
          current += 1
          if (current >= 70) {
            current = 70
            if (progressPhase2TimerRef.current) clearInterval(progressPhase2TimerRef.current)
            progressPhase2TimerRef.current = null
            setProgressStage(2)
          }
          setProgress(Math.round(current))
        }, 200)
      }
      setProgress(Math.round(current))
    }, 50)
  }, [stopProgressTimer])

  // Launch simulation
  const handleLaunch = useCallback(async (rect: PlacementRect) => {
    if (!previewUrl || !model) return
    if (abortControllerRef.current) abortControllerRef.current.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setSimulationStatus('generating')
    setErrorMessage(null)
    startProgressTimer()

    try {
      const formData = new FormData()
      // For presets, fetch the image first; for uploads, use the blob URL
      if (previewUrl.startsWith('/presets/')) {
        const resp = await fetch(previewUrl)
        const blob = await resp.blob()
        formData.append('image', blob, 'preset.jpg')
      } else {
        const resp = await fetch(previewUrl)
        const blob = await resp.blob()
        formData.append('image', blob, 'photo.jpg')
      }
      formData.append('model_id', model.id)
      if (selectedFabricId) formData.append('fabric_id', selectedFabricId)
      formData.append('rect', JSON.stringify(rect))

      const response = await fetch('/api/simulate', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error ?? 'La simulation a echoue. Verifiez votre connexion et reessayez.')
      }

      const blob = await response.blob()
      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
      const url = URL.createObjectURL(blob)

      stopProgressTimer()
      setProgress(100)
      setProgressStage(3)
      setResultBlobUrl(url)
      setSimulationStatus('done')
      setCompletedSteps(prev => new Set([...prev, 'simulation']))
      setStep('resultat')
    } catch (err) {
      stopProgressTimer()
      if (err instanceof Error && err.name === 'AbortError') {
        setSimulationStatus('placing')
        setProgress(0)
        setProgressStage(0)
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'La simulation a echoue.')
        setSimulationStatus('error')
      }
    }
  }, [previewUrl, model, selectedFabricId, startProgressTimer, stopProgressTimer, resultBlobUrl])

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort()
  }, [])

  // Result actions
  const handleDownload = useCallback(() => {
    if (!resultBlobUrl) return
    const a = document.createElement('a')
    a.href = resultBlobUrl
    a.download = 'mobel-unique-simulation.jpg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setToastMessage('Image telechargee')
    setToastVisible(true)
  }, [resultBlobUrl])

  const handleShare = useCallback(async () => {
    if (!resultBlobUrl || !model) return
    const shopifyUrl = model.shopify_url ?? 'https://mobelunique.fr'
    const message = `Regardez comment ce canape s'integre dans mon salon ! Visualise avec Mobel Unique — ${shopifyUrl}`

    if (typeof navigator?.canShare === 'function') {
      try {
        const response = await fetch(resultBlobUrl)
        const blob = await response.blob()
        const file = new File([blob], 'mobel-unique-simulation.jpg', { type: 'image/jpeg' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Ma simulation Mobel Unique' })
          setToastMessage('Partage reussi')
          setToastVisible(true)
          return
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }, [resultBlobUrl, model])

  const handleRetry = useCallback(() => {
    if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
    setResultBlobUrl(null)
    setSimulationStatus('placing')
    setProgress(0)
    setProgressStage(0)
    setErrorMessage(null)
    setStep('simulation')
  }, [resultBlobUrl])

  // Backdrop click
  const handleDialogClick = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  if (!model) return null

  // Derived values
  const selectedFabric = selectedFabricId ? fabrics.find(f => f.id === selectedFabricId) ?? null : null
  const currentVisual = selectedFabricId && selectedAngle
    ? visuals.find(v => v.model_id === model.id && v.fabric_id === selectedFabricId && v.model_image_id === selectedAngle && v.is_published) ?? null
    : null
  const selectedAngleImage = model.model_images.find(img => img.id === selectedAngle)
  const displayImageUrl = currentVisual?.generated_image_url ?? selectedAngleImage?.image_url ?? getPrimaryImage(model.model_images)
  const isOriginalFallback = selectedFabricId !== null && currentVisual === null
  const totalPrice = calculatePrice(model.price, selectedFabric?.is_premium ?? false)

  return (
    <>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-modal="true"
        aria-labelledby="configurator-title"
        onClose={onClose}
        onClick={handleDialogClick}
      >
        <div className={styles.layout}>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer le configurateur" autoFocus>
            <X size={20} aria-hidden="true" />
          </button>

          <ConfiguratorStepper currentStep={step} completedSteps={completedSteps} onNavigate={navigateToStep} />

          <div className={styles.content}>
            {/* Left: image preview (for tissu and apercu steps) */}
            {(step === 'tissu' || step === 'apercu') && (
              <div className={styles.leftColumn}>
                {displayImageUrl && (
                  <div className={styles.imageWrapper}>
                    <Image
                      key={displayImageUrl}
                      src={displayImageUrl}
                      alt={`Canape ${model.name}${selectedFabric ? ` en ${selectedFabric.name}` : ''}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className={styles.imageMain}
                    />
                    {isOriginalFallback && <span className={styles.badgeOriginal}>Photo originale</span>}
                  </div>
                )}
              </div>
            )}

            {/* Left: simulation content */}
            {(step === 'simulation' || step === 'resultat') && (
              <div className={styles.leftColumn}>
                {step === 'simulation' && (
                  <StepSimulation
                    model={model}
                    previewUrl={previewUrl}
                    simulationStatus={simulationStatus}
                    errorMessage={errorMessage}
                    progress={progress}
                    progressStage={progressStage}
                    onFileSelected={handleFileSelected}
                    onPresetSelected={handlePresetSelected}
                    onLaunch={handleLaunch}
                    onChangePhoto={() => {}}
                    onCancel={handleCancel}
                    fabricName={selectedFabric?.name ?? null}
                    selectedFabricId={selectedFabricId}
                  />
                )}
                {step === 'resultat' && (
                  <StepResultat
                    model={model}
                    previewUrl={previewUrl}
                    resultBlobUrl={resultBlobUrl}
                    fabricName={selectedFabric?.name ?? null}
                    onDownload={handleDownload}
                    onShare={handleShare}
                    onRetry={handleRetry}
                    shopifyUrl={model.shopify_url ?? null}
                  />
                )}
              </div>
            )}

            {/* Right: options panel */}
            <div className={styles.rightColumn}>
              <h2 id="configurator-title" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
                Configurateur {model.name}
              </h2>

              {step === 'tissu' && (
                <StepTissu
                  model={model}
                  fabrics={fabrics}
                  visuals={visuals}
                  selectedFabricId={selectedFabricId}
                  selectedAngle={selectedAngle}
                  onSelectFabric={setSelectedFabricId}
                  onSelectAngle={(id) => setSelectedAngle(id)}
                  onNext={goToApercu}
                />
              )}

              {step === 'apercu' && (
                <StepApercu
                  model={model}
                  visuals={visuals}
                  selectedFabricId={selectedFabricId}
                  selectedAngle={selectedAngle}
                  onSelectAngle={(id) => setSelectedAngle(id)}
                  onSimulate={goToSimulation}
                  fabricName={selectedFabric?.name ?? null}
                  isPremium={selectedFabric?.is_premium ?? false}
                  totalPrice={totalPrice}
                />
              )}
            </div>
          </div>

          {/* Sticky bar mobile */}
          <div className={styles.stickyBar}>
            <span className={styles.stickyPrice}>{formatPrice(totalPrice)}</span>
            {step === 'tissu' && (
              <button type="button" className={styles.stickyCta} onClick={goToApercu} disabled={!selectedFabricId}>Suivant</button>
            )}
            {step === 'apercu' && (
              <button type="button" className={styles.stickyCta} onClick={goToSimulation}>Simuler</button>
            )}
          </div>
        </div>
      </dialog>

      <Toast message={toastMessage} visible={toastVisible} onDismiss={() => setToastVisible(false)} />
    </>
  )
}
```

- [ ] **Step 3: Verifier TypeScript**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/public/Configurator/index.tsx src/components/public/Configurator/configurator.module.css
git commit -m "feat(configurator): add main orchestrator with 4-step state machine"
```

---

## Task 12: Catalogue — ProductCard ameliore

**Files:**
- Modify: `src/components/public/Catalogue/ProductCard.tsx`
- Modify: `src/components/public/Catalogue/ProductCard.module.css`

- [ ] **Step 1: Modifier ProductCard.tsx**

Ajouter image swap hover + CTA au hover + staggered entry via Motion :

```tsx
// src/components/public/Catalogue/ProductCard.tsx — remplacement complet
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Sofa } from 'lucide-react'
import { motion } from 'motion/react'
import type { ModelWithImages } from '@/types/database'
import { getPrimaryImage, formatStartingPrice } from '@/lib/utils'
import styles from './ProductCard.module.css'

interface ProductCardProps {
  model: ModelWithImages
  onConfigure: (model: ModelWithImages) => void
  index: number
}

export function ProductCard({ model, onConfigure, index }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const primaryUrl = getPrimaryImage(model.model_images)

  // Second image for hover swap (next angle after primary)
  const secondImage = model.model_images.length > 1
    ? model.model_images.find(img => img.image_url !== primaryUrl)?.image_url ?? null
    : null

  return (
    <motion.article
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.imageWrapper}>
        {primaryUrl ? (
          <>
            <Image
              src={primaryUrl}
              alt={`Canape ${model.name}`}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`${styles.image} ${isHovered && secondImage ? styles.imageHidden : ''}`}
            />
            {secondImage && (
              <Image
                src={secondImage}
                alt=""
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={`${styles.image} ${styles.imageSecond} ${isHovered ? styles.imageSecondVisible : ''}`}
              />
            )}
          </>
        ) : (
          <div className={styles.imagePlaceholder}>
            <Sofa size={48} strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{model.name}</h3>
        {model.description && <p className={styles.description}>{model.description}</p>}
        <span className={styles.price}>{formatStartingPrice(model.price)}</span>
        <button
          type="button"
          className={styles.cta}
          onClick={() => onConfigure(model)}
          aria-label={`Personnaliser le canape ${model.name}`}
        >
          Personnaliser
        </button>
      </div>
    </motion.article>
  )
}
```

- [ ] **Step 2: Modifier ProductCard.module.css**

```css
/* src/components/public/Catalogue/ProductCard.module.css — remplacement complet */
.card {
  background: var(--surface-container-lowest);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform 400ms ease-in-out, box-shadow 400ms ease-in-out;
  cursor: pointer;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(28, 28, 26, 0.04);
}

.imageWrapper {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: var(--surface-container-low);
}

.image {
  transition: opacity 400ms ease-in-out;
}

.imageHidden {
  opacity: 0;
}

.imageSecond {
  opacity: 0;
  transition: opacity 400ms ease-in-out;
}

.imageSecondVisible {
  opacity: 1;
}

.imagePlaceholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-muted);
}

.body {
  padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.description {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.price {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-primary);
  margin-top: 4px;
}

.cta {
  margin-top: var(--spacing-sm);
  padding: 12px;
  background: transparent;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: var(--font-size-sm);
  font-family: inherit;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 400ms ease-in-out, transform 400ms ease-in-out, background-color 300ms ease, color 300ms ease;
}

.card:hover .cta {
  opacity: 1;
  transform: translateY(0);
}

.cta:hover {
  background: var(--color-primary);
  color: #ffffff;
}

.cta:focus-visible {
  opacity: 1;
  transform: translateY(0);
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Mobile: CTA always visible */
@media (max-width: 1023px) {
  .cta {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 3: Verifier TypeScript**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/public/Catalogue/ProductCard.tsx src/components/public/Catalogue/ProductCard.module.css
git commit -m "feat(catalogue): add hover elevation, image swap, CTA reveal on ProductCard"
```

---

## Task 13: Catalogue — filtres pills + debounce + integration nouveau Configurator

**Files:**
- Modify: `src/components/public/Catalogue/CatalogueClient.tsx`
- Modify: `src/components/public/Catalogue/CatalogueSection.module.css`

- [ ] **Step 1: Modifier CatalogueClient.tsx**

Ajouter filtres pills, debounce, et remplacer import ConfiguratorModal par Configurator :

```tsx
// src/components/public/Catalogue/CatalogueClient.tsx — remplacement complet
'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import type { ModelWithImages, Fabric, VisualWithFabricAndImage } from '@/types/database'
import { ProductCard } from './ProductCard'
import { Configurator } from '@/components/public/Configurator'
import styles from './CatalogueSection.module.css'

function normalize(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// Categories statiques pour la v1 (iteration future : derive des modeles)
const FILTER_CATEGORIES = ['Tous', '2 places', '3 places', 'Angle', 'Meridienne'] as const

interface CatalogueClientProps {
  models: ModelWithImages[]
  fabrics: Fabric[]
  visuals: VisualWithFabricAndImage[]
}

export function CatalogueClient({ models, fabrics, visuals }: CatalogueClientProps) {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('Tous')
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedModel, setSelectedModel] = useState<ModelWithImages | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const debouncedQuery = useDebounce(query, 300)

  const filteredModels = useMemo(() => {
    let result = models
    if (debouncedQuery) {
      result = result.filter(m => normalize(m.name).includes(normalize(debouncedQuery)))
    }
    // Filter by category is a placeholder — until models have a category field,
    // this filters by checking if the dimension string or name contains a hint
    // For v1: only "Tous" is functional, others are visual-only
    return result
  }, [models, debouncedQuery])

  const countLabel = filteredModels.length === 1 ? '1 canape' : `${filteredModels.length} canapes`

  function handleReset() {
    setQuery('')
    inputRef.current?.focus()
  }

  function handleConfigure(model: ModelWithImages) {
    const activeEl = document.activeElement
    if (activeEl instanceof HTMLButtonElement) {
      triggerRef.current = activeEl
    }
    setSelectedModel(model)
  }

  function handleModalClose() {
    setSelectedModel(null)
    setTimeout(() => triggerRef.current?.focus(), 0)
  }

  return (
    <section id="catalogue" className={styles.section} aria-labelledby="catalogue-title">
      <div className={styles.container}>
        <h2 id="catalogue-title" className={styles.title}>Nos canapes</h2>

        {/* Filtres pills */}
        <div className={styles.filterBar} role="tablist" aria-label="Filtrer par categorie">
          {FILTER_CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={activeFilter === cat}
              className={`${styles.filterPill} ${activeFilter === cat ? styles.filterPillActive : ''}`}
              onClick={() => setActiveFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Recherche */}
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un canape..."
            className={styles.searchInput}
            aria-label="Rechercher un canape par nom"
          />
          {query && (
            <button type="button" className={styles.clearButton} onClick={handleReset} aria-label="Vider le champ de recherche">
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        <p className={styles.count}>{countLabel}</p>

        {/* Grille */}
        {filteredModels.length > 0 ? (
          <div className={styles.grid}>
            {filteredModels.map((model, index) => (
              <ProductCard key={model.id} model={model} onConfigure={handleConfigure} index={index} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>Aucun canape ne correspond a votre recherche.</p>
            <button type="button" className={styles.resetButton} onClick={handleReset}>
              Effacer la recherche
            </button>
          </div>
        )}
      </div>

      <Configurator model={selectedModel} onClose={handleModalClose} fabrics={fabrics} visuals={visuals} />
    </section>
  )
}
```

- [ ] **Step 2: Ajouter styles filtres dans CatalogueSection.module.css**

Ajouter ces classes au fichier CSS existant (en complement) :

```css
/* Ajouts a CatalogueSection.module.css */

.section {
  background: var(--surface);
  padding: var(--spacing-section) 0;
}

.filterBar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: var(--spacing-lg);
}

.filterPill {
  padding: 8px 16px;
  border-radius: 9999px;
  font-size: var(--font-size-sm);
  font-weight: 500;
  font-family: inherit;
  border: 1px solid rgba(216, 195, 173, 0.15);
  background: var(--surface-container-low);
  color: var(--color-text);
  cursor: pointer;
  transition: background-color 300ms ease, color 300ms ease, border-color 300ms ease;
}

.filterPill:hover {
  background: var(--surface-container-high);
}

.filterPill:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.filterPillActive {
  background: var(--color-primary);
  color: #ffffff;
  border-color: var(--color-primary);
}
```

- [ ] **Step 3: Verifier TypeScript**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Verifier build**

Run: `npm run build`
Expected: PASS (ou warnings non-bloquants)

- [ ] **Step 5: Commit**

```bash
git add src/components/public/Catalogue/CatalogueClient.tsx src/components/public/Catalogue/CatalogueSection.module.css
git commit -m "feat(catalogue): add filter pills, debounce search, integrate new Configurator"
```

---

## Task 14: Corrections accessibilite et contraste

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/public/Catalogue/ProductCardSkeleton.module.css`

- [ ] **Step 1: Corriger contraste --color-muted dans globals.css**

Remplacer `#888888` par `#767676` pour le token `--color-muted` :

```css
/* Dans :root de globals.css */
--color-muted: #767676; /* was #888888 — WCAG AA 4.5:1 on white */
```

- [ ] **Step 2: Corriger skeleton couleurs chaudes**

Dans `ProductCardSkeleton.module.css`, remplacer le gradient shimmer par des couleurs chaudes :

```css
/* Remplacer le gradient du shimmer */
background: linear-gradient(
  90deg,
  var(--surface-container) 0%,
  var(--surface-container-high) 50%,
  var(--surface-container) 100%
);
```

- [ ] **Step 3: Verifier build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/components/public/Catalogue/ProductCardSkeleton.module.css
git commit -m "fix(a11y): improve muted color contrast to WCAG AA, warm skeleton colors"
```

---

## Task 15: Nettoyage — suppression ancien ConfiguratorModal

**Files:**
- Delete: `src/components/public/Catalogue/ConfiguratorModal.tsx`
- Delete: `src/components/public/Catalogue/ConfiguratorModal.module.css`
- Delete: `src/components/public/Catalogue/SofaPlacer.tsx`
- Delete: `src/components/public/Catalogue/SofaPlacer.module.css`

- [ ] **Step 1: Supprimer les anciens fichiers**

```bash
git rm src/components/public/Catalogue/ConfiguratorModal.tsx
git rm src/components/public/Catalogue/ConfiguratorModal.module.css
git rm src/components/public/Catalogue/SofaPlacer.tsx
git rm src/components/public/Catalogue/SofaPlacer.module.css
```

- [ ] **Step 2: Verifier qu'il n'y a plus d'imports morts**

Run: `npx tsc --noEmit`
Expected: PASS (aucune reference restante aux fichiers supprimes)

- [ ] **Step 3: Verifier build complet**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor: remove legacy ConfiguratorModal and SofaPlacer (replaced by Configurator/)"
```

---

## Task 16: Verification finale

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: PASS (ou warnings non-bloquants seulement)

- [ ] **Step 2: TypeScript strict**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Build production**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Test manuel**

Demarrer le serveur dev et verifier :
- [ ] Catalogue : cards avec hover elevation + image swap
- [ ] Filtres pills apparaissent et sont cliquables
- [ ] Recherche avec debounce fonctionne
- [ ] Clic "Personnaliser" ouvre le configurateur full-screen
- [ ] Stepper 4 etapes visible en haut
- [ ] Selection tissu avec swatches rondes + categories
- [ ] Navigation angles en etape 2
- [ ] Upload photo + SofaPlacer avec reset et guidage
- [ ] Simulation lance et affiche le progress par etapes
- [ ] Resultat avec slider avant/apres fonctionnel
- [ ] Toast apparait apres telecharger
- [ ] Mobile : sticky bar + stepper simplifie + stack vertical
