import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

// Mock HTMLDialogElement pour happy-dom (ne supporte pas showModal/close nativement)
HTMLDialogElement.prototype.showModal = vi.fn(function(this: HTMLDialogElement) {
  this.setAttribute('open', '')
})
HTMLDialogElement.prototype.close = vi.fn(function(this: HTMLDialogElement) {
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
})
