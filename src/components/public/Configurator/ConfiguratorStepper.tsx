'use client'

import { Check } from 'lucide-react'
import type { ConfiguratorStep } from './types'
import styles from './ConfiguratorStepper.module.css'

const STEPS: { key: ConfiguratorStep; label: string }[] = [
  { key: 'tissu', label: 'Tissu' },
  { key: 'apercu', label: 'Aperçu' },
  { key: 'simulation', label: 'Simulation' },
  { key: 'resultat', label: 'Résultat' },
]

interface ConfiguratorStepperProps {
  currentStep: ConfiguratorStep
  completedSteps: Set<ConfiguratorStep>
  onNavigate: (step: ConfiguratorStep) => void
}

export default function ConfiguratorStepper({
  currentStep,
  completedSteps,
  onNavigate,
}: ConfiguratorStepperProps) {
  return (
    <nav className={styles.stepper} aria-label="Étapes du configurateur">
      {STEPS.map((step, index) => {
        const isActive = step.key === currentStep
        const isCompleted = completedSteps.has(step.key)
        const isClickable = isCompleted && !isActive

        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 'inherit' }}>
            <button
              type="button"
              className={`${styles.step} ${isClickable ? styles.clickable : ''}`}
              onClick={isClickable ? () => onNavigate(step.key) : undefined}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Étape ${index + 1} : ${step.label}`}
            >
              <span
                className={`${styles.circle} ${
                  isActive
                    ? styles.circleActive
                    : isCompleted
                      ? styles.circleCompleted
                      : styles.circleFuture
                }`}
              >
                {isCompleted && !isActive ? (
                  <Check size={14} strokeWidth={2.5} />
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
