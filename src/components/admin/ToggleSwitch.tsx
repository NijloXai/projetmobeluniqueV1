'use client'

import styles from './ToggleSwitch.module.css'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
}

export function ToggleSwitch({ checked, onChange, disabled, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`${styles.toggle} ${checked ? styles.on : styles.off}`}
      onClick={() => onChange(!checked)}
      disabled={disabled}
    >
      <span className={styles.thumb} />
    </button>
  )
}
