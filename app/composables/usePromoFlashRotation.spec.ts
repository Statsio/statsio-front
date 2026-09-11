import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePromoFlashRotation } from './usePromoFlashRotation'
import type { PromoCategory } from '@/types/promo-category'

function makeCategory(overrides: Partial<PromoCategory> = {}): PromoCategory {
  return {
    id: 1,
    name: 'Black Friday',
    title_line_1: '<p>Titre</p>',
    infos: [
      { title: 'Info 1', description: 'Desc 1' },
      { title: 'Info 2', description: 'Desc 2' },
    ],
    ticker_duration_seconds: 10,
    info_duration_seconds: 5,
    always_visible: false,
    position: 0,
    ...overrides,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('usePromoFlashRotation', () => {
  it('stays in ticker phase with no categories', () => {
    const { phase, currentCategory } = usePromoFlashRotation(ref([]))
    vi.advanceTimersByTime(60_000)
    expect(phase.value).toBe('ticker')
    expect(currentCategory.value).toBeNull()
  })

  it('flashes the category after ticker_duration_seconds, then cycles its infos', () => {
    const category = makeCategory()
    const { phase, currentCategory, currentInfo } = usePromoFlashRotation(ref([category]))

    expect(phase.value).toBe('ticker')

    vi.advanceTimersByTime(10_000)
    expect(phase.value).toBe('flash')
    expect(currentCategory.value?.name).toBe('Black Friday')
    expect(currentInfo.value?.title).toBe('Info 1')

    vi.advanceTimersByTime(5_000)
    expect(currentInfo.value?.title).toBe('Info 2')

    vi.advanceTimersByTime(5_000)
    expect(phase.value).toBe('ticker')
  })

  it('round-robins to the next category after a full flash', () => {
    const categoryA = makeCategory({ id: 1, name: 'A', infos: [{ title: 'Only info' }] })
    const categoryB = makeCategory({ id: 2, name: 'B', infos: [{ title: 'Other info' }] })
    const { phase, currentCategory } = usePromoFlashRotation(ref([categoryA, categoryB]))

    vi.advanceTimersByTime(10_000)
    expect(currentCategory.value?.name).toBe('A')

    vi.advanceTimersByTime(5_000)
    expect(phase.value).toBe('ticker')

    vi.advanceTimersByTime(10_000)
    expect(phase.value).toBe('flash')
    expect(currentCategory.value?.name).toBe('B')
  })

  it('shows the title alone (no crash) when a category has no infos', () => {
    const category = makeCategory({ infos: [] })
    const { phase, currentInfo } = usePromoFlashRotation(ref([category]))

    vi.advanceTimersByTime(10_000)
    expect(phase.value).toBe('flash')
    expect(currentInfo.value).toBeNull()

    vi.advanceTimersByTime(5_000)
    expect(phase.value).toBe('ticker')
  })

  it('pins an always_visible category in permanent flash and loops its infos', () => {
    const pinned = makeCategory({
      id: 1,
      name: 'Pinned',
      always_visible: true,
      infos: [{ title: 'P1' }, { title: 'P2' }],
    })
    const other = makeCategory({
      id: 2,
      name: 'Other',
      infos: [{ title: 'Other info' }],
    })
    const { phase, currentCategory, currentInfo } = usePromoFlashRotation(ref([other, pinned]))

    expect(phase.value).toBe('flash')
    expect(currentCategory.value?.name).toBe('Pinned')
    expect(currentInfo.value?.title).toBe('P1')

    vi.advanceTimersByTime(5_000)
    expect(phase.value).toBe('flash')
    expect(currentCategory.value?.name).toBe('Pinned')
    expect(currentInfo.value?.title).toBe('P2')

    vi.advanceTimersByTime(5_000)
    expect(phase.value).toBe('flash')
    expect(currentCategory.value?.name).toBe('Pinned')
    expect(currentInfo.value?.title).toBe('P1')
  })

  it('prefers the first always_visible category by list order', () => {
    const first = makeCategory({ id: 1, name: 'First', always_visible: true, infos: [{ title: 'A' }] })
    const second = makeCategory({ id: 2, name: 'Second', always_visible: true, infos: [{ title: 'B' }] })
    const { phase, currentCategory, currentInfo } = usePromoFlashRotation(ref([first, second]))

    expect(phase.value).toBe('flash')
    expect(currentCategory.value?.name).toBe('First')
    expect(currentInfo.value?.title).toBe('A')

    vi.advanceTimersByTime(60_000)
    expect(phase.value).toBe('flash')
    expect(currentCategory.value?.name).toBe('First')
  })
})
