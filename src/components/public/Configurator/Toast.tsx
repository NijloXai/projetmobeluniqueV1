'use client';

import { useEffect } from 'react';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export default function Toast({
  message,
  visible,
  onDismiss,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, onDismiss]);

  return (
    <div
      className={`${styles.toast} ${visible ? styles.visible : ''}`}
      role="status"
      aria-live="polite"
    >
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className={styles.checkCircle}
          cx="12"
          cy="12"
          r="10"
        />
        <path
          className={styles.checkMark}
          d="M8 12l3 3 5-5"
        />
      </svg>

      <span className={styles.message}>{message}</span>

      <button
        className={styles.closeButton}
        onClick={onDismiss}
        type="button"
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
  );
}
