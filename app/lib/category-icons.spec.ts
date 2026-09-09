import { describe, expect, it } from 'vitest'
import { CATEGORY_ICON_COMPONENTS, resolveCategoryIconComponent } from '@/lib/category-icons'

describe('category-icons', () => {
  it('resolves a known Heroicons name to a component', () => {
    expect(resolveCategoryIconComponent('heart')).toBe(CATEGORY_ICON_COMPONENTS.heart)
    expect(resolveCategoryIconComponent('chart-bar')).toBeTruthy()
  })

  it('returns null for an unknown or empty name', () => {
    expect(resolveCategoryIconComponent('not-an-icon')).toBeNull()
    expect(resolveCategoryIconComponent(null)).toBeNull()
    expect(resolveCategoryIconComponent(undefined)).toBeNull()
    expect(resolveCategoryIconComponent('')).toBeNull()
  })

  it('every registered icon is a renderable component', () => {
    const notRenderable = Object.entries(CATEGORY_ICON_COMPONENTS)
      .filter(([, component]) => !component)
      .map(([name]) => name)
    expect(notRenderable).toEqual([])
  })
})
