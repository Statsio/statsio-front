import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import type { ContentType, SidebarLeftTab } from '@/types/studio'

export interface StudioRailTab {
  id: SidebarLeftTab
  label: string
  /** Nom de pictogramme `StudioIcon` (ou `glyph:statsdata` pour le glyphe de type). */
  icon: string
}

const TAB: Record<SidebarLeftTab, StudioRailTab> = {
  blocks: { id: 'blocks', label: 'Éléments', icon: 'blocks' },
  sources: { id: 'sources', label: 'Données', icon: 'db' },
  filters: { id: 'filters', label: 'Filtres', icon: 'filter' },
  script: { id: 'script', label: 'Script', icon: 'code' },
  sdlib: { id: 'sdlib', label: 'StatsData', icon: 'glyph:statsdata' },
  settings: { id: 'settings', label: 'Réglages', icon: 'sliders' },
  assistant: { id: 'assistant', label: 'Assistant', icon: 'spark' },
  // Mobile uniquement : l'inspecteur « Propriétés » dans le tiroir.
  properties: { id: 'properties', label: 'Réglages', icon: 'gear' },
}

/** Onglets du rail par type de contenu (maquette « Studio Statsio »). */
const BY_TYPE: Record<ContentType, SidebarLeftTab[]> = {
  statsdata: ['blocks', 'sources', 'filters', 'script', 'assistant'],
  article: ['blocks', 'sdlib', 'assistant'],
  survey: ['blocks', 'settings', 'assistant'],
}

/**
 * Onglets du rail Studio, selon le type de contenu et l'activation de l'assistant —
 * source unique pour le rail desktop (`StudioSidebarLeft`) et la barre du bas mobile.
 */
export function useStudioLeftTabs() {
  const studio = useStudioStore()

  const assistantEnabled = computed(() => {
    // runtimeConfig type = boolean, mais un override runtime (NUXT_PUBLIC_…) peut injecter la chaîne "true".
    const v: unknown = useRuntimeConfig().public.studioAssistantEnabled
    return v === true || v === 'true'
  })

  const tabs = computed(() =>
    BY_TYPE[(studio.content?.type ?? 'statsdata') as ContentType]
      .filter((id) => id !== 'assistant' || assistantEnabled.value)
      .map((id) => TAB[id]),
  )

  return { tabs }
}
