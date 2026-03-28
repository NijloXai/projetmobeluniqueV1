import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CatalogueSkeletonGrid } from '@/components/public/Catalogue/ProductCardSkeleton'

describe('CatalogueSkeletonGrid', () => {
  it('rend 3 skeletons', () => {
    const { container } = render(<CatalogueSkeletonGrid />)
    const skeletons = container.querySelectorAll('[aria-hidden="true"]')
    expect(skeletons.length).toBe(3)
  })

  it('a aria-busy sur le container', () => {
    render(<CatalogueSkeletonGrid />)
    const section = screen.getByLabelText('Chargement du catalogue')
    expect(section).toHaveAttribute('aria-busy', 'true')
  })

  it('a id catalogue sur la section', () => {
    const { container } = render(<CatalogueSkeletonGrid />)
    expect(container.querySelector('#catalogue')).toBeInTheDocument()
  })
})
