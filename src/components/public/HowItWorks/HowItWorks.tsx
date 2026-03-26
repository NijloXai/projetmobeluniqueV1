'use client'

import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { Sofa, Palette, Home } from 'lucide-react'
import styles from './HowItWorks.module.css'

const steps = [
  {
    id: 1,
    number: '01',
    icon: Sofa,
    title: 'Choisissez votre modèle',
    description: 'Parcourez notre collection et sélectionnez le modèle qui correspond à votre espace et votre style de vie.',
  },
  {
    id: 2,
    number: '02',
    icon: Palette,
    title: 'Personnalisez avec votre tissu',
    description: 'Choisissez parmi nos tissus \u2014 couleur, texture, matière \u2014 et voyez le résultat instantanément sur votre modèle.',
  },
  {
    id: 3,
    number: '03',
    icon: Home,
    title: 'Visualisez chez vous',
    description: 'Uploadez une photo de votre salon et découvrez votre nouveau canapé exactement là où il sera posé.',
  },
]

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const prefersReducedMotion = useReducedMotion()

  return (
    <section id="comment-ca-marche" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.sectionTitle}>Comment ça marche</h2>
          <p className={styles.sectionSubtitle}>
            En quelques clics, choisissez votre modèle, personnalisez le tissu
            et visualisez le résultat dans votre salon avant de commander.
          </p>
        </div>
        <div ref={ref} className={styles.grid}>
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.id}
                className={styles.card}
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.4,
                  delay: prefersReducedMotion ? 0 : index * 0.1,
                  ease: 'easeInOut',
                }}
              >
                <span className={styles.number}>{step.number}</span>
                <Icon size={32} strokeWidth={1.5} aria-hidden="true" />
                <h3 className={styles.cardTitle}>{step.title}</h3>
                <p className={styles.cardDescription}>{step.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
