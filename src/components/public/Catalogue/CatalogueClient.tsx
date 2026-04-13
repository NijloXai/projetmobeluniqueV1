'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import type { ModelWithImages, Fabric, VisualWithFabricAndImage } from '@/types/database'
import { ProductCard } from './ProductCard'
import Configurator from '@/components/public/Configurator'
import styles from './CatalogueSection.module.css'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Normalise une chaine pour comparaison insensible aux accents et a la casse
function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

// Debounce un string avec un delai en ms
function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// ---------------------------------------------------------------------------
// Filter categories (v1 — seul "Tous" filtre, les autres sont des placeholders)
// ---------------------------------------------------------------------------

const FILTER_CATEGORIES = ['Tous', '2 places', '3 places', 'Angle', 'Meridienne'] as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CatalogueClientProps {
  models: ModelWithImages[]
  fabrics: Fabric[]
  visuals: VisualWithFabricAndImage[]
}

export function CatalogueClient({ models, fabrics, visuals }: CatalogueClientProps) {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<(typeof FILTER_CATEGORIES)[number]>('Tous')
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedModel, setSelectedModel] = useState<ModelWithImages | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const debouncedQuery = useDebounce(query, 300)

  const filteredModels = useMemo(() => {
    let result = models
    if (debouncedQuery) {
      result = result.filter((m) => normalize(m.name).includes(normalize(debouncedQuery)))
    }
    // v1 : activeFilter n'agit pas encore (pas de champ categorie sur models)
    return result
  }, [models, debouncedQuery])

  // Singulier/pluriel FR
  const countLabel =
    filteredModels.length === 1
      ? '1 canape'
      : `${filteredModels.length} canapes`

  function handleReset() {
    setQuery('')
    inputRef.current?.focus()
  }

  function handleConfigure(model: ModelWithImages) {
    // Stocker l'element declencheur pour restauration focus a la fermeture (per D-06)
    const activeEl = document.activeElement
    if (activeEl instanceof HTMLButtonElement) {
      triggerRef.current = activeEl
    }
    setSelectedModel(model)
  }

  function handleModalClose() {
    setSelectedModel(null)
    // Restitution focus au CTA declencheur (per D-06, RESEARCH.md Pattern 2)
    setTimeout(() => triggerRef.current?.focus(), 0)
  }

  // Etat vide catalogue (models vide depuis Supabase)
  if (models.length === 0) {
    return (
      <section id="catalogue" className={styles.section}>
        <div className={styles.container}>
          <p className={styles.emptyMessage}>Nos canapes arrivent bientot.</p>
        </div>
      </section>
    )
  }

  return (
    <section
      id="catalogue"
      className={styles.section}
      aria-labelledby="catalogue-title"
    >
      <div className={styles.container}>
        {/* En-tete section */}
        <div className={styles.sectionHeader}>
          <h2 id="catalogue-title" className={styles.sectionTitle}>
            Nos Canapes
          </h2>
          <p className={styles.sectionSubtitle}>
            Selectionnez une base pour commencer la configuration.
          </p>
        </div>

        {/* Filter pills */}
        <div className={styles.filterBar} role="tablist">
          {FILTER_CATEGORIES.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeFilter === cat}
              className={`${styles.filterPill} ${activeFilter === cat ? styles.filterPillActive : ''}`}
              onClick={() => setActiveFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Barre de recherche */}
        <div className={styles.searchWrapper}>
          <Search size={16} aria-hidden="true" className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un canapé..."
            className={styles.searchInput}
            aria-label="Rechercher un canapé par nom"
          />
          {query && (
            <button
              type="button"
              onClick={handleReset}
              className={styles.clearButton}
              aria-label="Vider le champ de recherche"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Compteur de resultats — CAT-04, D-08, D-09 */}
        <p className={styles.resultCount}>{countLabel}</p>

        {/* Grille ou etat vide recherche */}
        {filteredModels.length === 0 && debouncedQuery !== '' ? (
          <div className={styles.emptySearch}>
            <p className={styles.emptyMessage}>
              Aucun canape ne correspond a &ldquo;{debouncedQuery}&rdquo;
            </p>
            <button
              type="button"
              onClick={handleReset}
              className={styles.resetButton}
            >
              Effacer la recherche
            </button>
          </div>
        ) : (
          /* Grille de cards filtrees */
          <div className={styles.grid}>
            {filteredModels.map((model, index) => (
              <ProductCard
                key={model.id}
                model={model}
                onConfigure={handleConfigure}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      <Configurator model={selectedModel} onClose={handleModalClose} fabrics={fabrics} visuals={visuals} />
    </section>
  )
}
