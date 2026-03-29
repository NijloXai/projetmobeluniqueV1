'use client'

import { useState, useRef } from 'react'
import { Search, X } from 'lucide-react'
import type { ModelWithImages, Fabric, VisualWithFabricAndImage } from '@/types/database'
import { ProductCard } from './ProductCard'
import { ConfiguratorModal } from './ConfiguratorModal'
import styles from './CatalogueSection.module.css'

// Fonction pure : normalise une chaine pour comparaison insensible aux accents et a la casse
// Ex: 'Canapé Milano' → 'canape milano' | 'canape' → 'canape'
function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

interface CatalogueClientProps {
  models: ModelWithImages[]
  fabrics: Fabric[]
  visuals: VisualWithFabricAndImage[]
}

export function CatalogueClient({ models, fabrics, visuals }: CatalogueClientProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedModel, setSelectedModel] = useState<ModelWithImages | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  // Valeur derivee — pas de useState supplementaire ni de useEffect
  const filteredModels = query
    ? models.filter((m) => normalize(m.name).includes(normalize(query)))
    : models

  // Singulier/pluriel FR — per D-08
  const countLabel =
    filteredModels.length === 1
      ? '1 canapé'
      : `${filteredModels.length} canapés`

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
        {/* En-tete section — inchange */}
        <div className={styles.sectionHeader}>
          <h2 id="catalogue-title" className={styles.sectionTitle}>
            Nos Canapes
          </h2>
          <p className={styles.sectionSubtitle}>
            Selectionnez une base pour commencer la configuration.
          </p>
        </div>

        {/* Barre de recherche — D-01, D-02, D-03, D-04 */}
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
        {filteredModels.length === 0 && query !== '' ? (
          /* Etat vide recherche — SRCH-02, D-11, D-12, D-13 */
          <div className={styles.emptySearch}>
            <p className={styles.emptyMessage}>
              Aucun canapé ne correspond à &ldquo;{query}&rdquo;
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
          /* Grille de cards filtrées */
          <div className={styles.grid}>
            {filteredModels.map((model) => (
              <ProductCard
                key={model.id}
                model={model}
                onConfigure={handleConfigure}
              />
            ))}
          </div>
        )}
      </div>

      <ConfiguratorModal model={selectedModel} onClose={handleModalClose} fabrics={fabrics} visuals={visuals} />
    </section>
  )
}
