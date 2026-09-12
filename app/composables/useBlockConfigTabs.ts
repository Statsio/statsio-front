import { computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { isTextBlock } from '@/types/studio'

const EDITORIAL_TYPES = ['image', 'video', 'button', 'link-card', 'retenir', 'field-grid'] as const
const FORM_TYPES = ['choice', 'checkboxes', 'dropdown', 'scale', 'rating'] as const
const RECORD_TYPES = ['record', 'related'] as const

export const DATA_TABS      = [{ id: 'data', label: 'Données' }, { id: 'filters', label: 'Filtres' }, { id: 'style', label: 'Style' }]
export const KPI_TABS       = [{ id: 'data', label: 'Données' }, { id: 'filters', label: 'Filtres' }, { id: 'comparison', label: 'Comparaison' }, { id: 'style', label: 'Style' }]
export const LOOP_TABS      = [{ id: 'data', label: 'Boucle' }, { id: 'filters', label: 'Filtres' }, { id: 'style', label: 'Style' }]
export const IF_TABS        = [{ id: 'condition', label: 'Condition' }]
export const LAYOUT_TABS    = [{ id: 'layout', label: 'Disposition' }]
export const TEXT_TABS      = [{ id: 'style', label: 'Style' }]
export const SEARCH_TABS    = [{ id: 'config', label: 'Configuration' }, { id: 'filters', label: 'Filtres' }]
export const PARAM_TABS     = [{ id: 'config', label: 'Configuration' }, { id: 'filters', label: 'Filtres' }]
export const SDEMBED_TABS   = [{ id: 'config', label: 'Configuration' }]
export const EDITORIAL_TABS = [{ id: 'editorial', label: 'Contenu' }]
export const FORM_TABS      = [{ id: 'form', label: 'Question' }]

/**
 * Jeux d'onglets de configuration par type de bloc + onglet actif, source unique
 * partagée entre `BlockConfigPanel` (desktop) et le bottom sheet mobile.
 */
export function useBlockConfigTabs() {
  const studio = useStudioStore()

  const block = computed(() => studio.selectedBlock)
  const isText = computed(() => (block.value ? isTextBlock(block.value.type) : false))

  const isSearch    = computed(() => block.value?.type === 'search')
  const isParam     = computed(() => block.value?.type === 'param')
  const isMap       = computed(() => block.value?.type === 'map')
  const isSdEmbed   = computed(() => block.value?.type === 'sd-embed')
  const isLoop      = computed(() => block.value?.type === 'loop')
  const isCondition = computed(() => block.value?.type === 'if')
  const isLayout    = computed(() => block.value?.type === 'layout')
  const isEditorial = computed(() => EDITORIAL_TYPES.includes(block.value?.type as typeof EDITORIAL_TYPES[number]))
  const isForm      = computed(() => FORM_TYPES.includes(block.value?.type as typeof FORM_TYPES[number]))
  const isRecord    = computed(() => RECORD_TYPES.includes(block.value?.type as typeof RECORD_TYPES[number]))

  const currentTabs = computed(() => {
    if (isText.value) return TEXT_TABS
    if (isSearch.value) return SEARCH_TABS
    if (isParam.value) return PARAM_TABS
    if (isSdEmbed.value) return SDEMBED_TABS
    if (isEditorial.value) return EDITORIAL_TABS
    if (isForm.value) return FORM_TABS
    if (isLoop.value) return LOOP_TABS
    if (isCondition.value) return IF_TABS
    if (isLayout.value) return LAYOUT_TABS
    if (isRecord.value) return DATA_TABS
    if (block.value?.type === 'kpi') return KPI_TABS
    return DATA_TABS
  })

  const activeTab = computed({
    get: () => studio.activeBlockTab,
    set: (value: string) => { studio.activeBlockTab = value },
  })

  watch([() => block.value?.id, isText, isSearch, isParam, isSdEmbed, isCondition, isLayout, isEditorial, isForm], () => {
    if (isText.value) activeTab.value = 'style'
    else if (isSearch.value) activeTab.value = 'config'
    else if (isParam.value) activeTab.value = 'config'
    else if (isSdEmbed.value) activeTab.value = 'config'
    else if (isCondition.value) activeTab.value = 'condition'
    else if (isLayout.value) activeTab.value = 'layout'
    else if (isEditorial.value) activeTab.value = 'editorial'
    else if (isForm.value) activeTab.value = 'form'
    else activeTab.value = 'data'
  }, { immediate: true })

  return {
    block,
    isText,
    isSearch,
    isParam,
    isMap,
    isSdEmbed,
    isLoop,
    isCondition,
    isLayout,
    isEditorial,
    isForm,
    isRecord,
    currentTabs,
    activeTab,
  }
}
