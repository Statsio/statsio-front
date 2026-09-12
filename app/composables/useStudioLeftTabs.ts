import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import type { SidebarLeftTab } from '@/types/studio'

export interface StudioRailTab {
  id: SidebarLeftTab
  label: string
  icon: string
}

const ALL_TABS: StudioRailTab[] = [
  {
    id: 'blocks',
    label: 'Éléments',
    icon: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z',
  },
  {
    id: 'script',
    label: 'Script',
    icon: 'M17.25 6.75 22.5 12l-5.25 5.25M6.75 17.25 1.5 12l5.25-5.25m7.5-3-4.5 16.5',
  },
  {
    id: 'filters',
    label: 'Filtres',
    icon: 'M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 22.5v-8.47a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z',
  },
  {
    id: 'sources',
    label: 'Données',
    icon: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125',
  },
  {
    id: 'assistant',
    label: 'Assistant',
    icon: 'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 0 0 2.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z',
  },
]

/**
 * Onglets du rail Studio (Éléments/Script/Filtres/Données/Assistant), filtrés selon le
 * type de contenu et l'activation de l'assistant — source unique pour le rail desktop
 * (`StudioSidebarLeft`) et la barre du bas mobile.
 */
export function useStudioLeftTabs() {
  const studio = useStudioStore()

  const assistantEnabled = computed(() => {
    // runtimeConfig type = boolean, mais un override runtime (NUXT_PUBLIC_…) peut injecter la chaîne "true".
    const v: unknown = useRuntimeConfig().public.studioAssistantEnabled
    return v === true || v === 'true'
  })

  // « Données » (sources) ne concerne que les StatsData ; « Assistant » est masqué tant que non activé.
  const tabs = computed(() =>
    ALL_TABS.filter((tab) => {
      if (tab.id === 'sources') {
        return studio.content?.type !== 'article' && studio.content?.type !== 'survey'
      }
      if (tab.id === 'assistant') {
        return assistantEnabled.value
      }
      return true
    }),
  )

  return { tabs }
}
