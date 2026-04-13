'use client'

import Image from 'next/image'
import { PRESET_ROOMS } from './types'
import styles from './StepSimulation.module.css'

interface PresetRoomsProps {
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function PresetRooms({ selectedId, onSelect }: PresetRoomsProps) {
  return (
    <div className={styles.presets}>
      <p className={styles.presetsLabel}>Ou choisissez un salon type</p>
      <div className={styles.presetsGrid}>
        {PRESET_ROOMS.map((room) => (
          <button
            key={room.id}
            className={`${styles.presetCard}${selectedId === room.id ? ` ${styles.presetCardActive}` : ''}`}
            aria-pressed={selectedId === room.id}
            onClick={() => onSelect(room.id)}
            type="button"
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
