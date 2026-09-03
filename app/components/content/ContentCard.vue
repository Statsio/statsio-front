<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogItem } from '@/types/catalog'
import type { ContentCardFormat, ContentCardMode, ContentCardTone, ContentManageMeta } from '@/types/content-card'
import ArticleCard from '@/components/content/ArticleCard.vue'
import SurveyCard from '@/components/content/SurveyCard.vue'
import StatsDataCard from '@/components/content/StatsDataCard.vue'
import ContentManageCard from '@/components/content/ContentManageCard.vue'

/**
 * Aiguilleur : rend la carte du bon type de contenu (`item.type`) dans le format
 * demandé. À utiliser dans les listes hétérogènes (dashboards, favoris, historique,
 * recherche). Les listes mono-type utilisent directement `ArticleCard` / `SurveyCard`
 * / `StatsDataCard`.
 *
 * `mode="manage"` → carte créateur unifiée (`ContentManageCard`, maquettes dashboard),
 * indépendante du type.
 */
const props = withDefaults(
  defineProps<{
    item: CatalogItem
    format?: ContentCardFormat
    mode?: ContentCardMode
    favorited?: boolean
    manage?: ContentManageMeta
    tone?: ContentCardTone
    feature?: boolean
    basePath?: string
    hideOwner?: boolean
    showSyntheticViz?: boolean
  }>(),
  { format: 'card', mode: 'public', favorited: false, feature: false, tone: 'light', hideOwner: false, showSyntheticViz: undefined },
)

const emit = defineEmits<{
  favorite: []
  edit: []
  remove: [string]
}>()

const isManage = computed(() => props.mode === 'manage' && !!props.manage)

const target = computed(() => {
  if (props.item.type === 'article') return ArticleCard
  if (props.item.type === 'survey') return SurveyCard
  return StatsDataCard
})
</script>

<template>
  <ContentManageCard
    v-if="isManage && manage"
    :item="item"
    :manage="manage"
    :format="format"
    :hide-owner="hideOwner"
  />
  <component
    :is="target"
    v-else
    :item="item"
    :format="format"
    :mode="mode"
    :favorited="favorited"
    :manage="manage"
    :tone="tone"
    :feature="feature"
    :base-path="basePath"
    :show-synthetic-viz="showSyntheticViz"
    @favorite="emit('favorite')"
    @edit="emit('edit')"
    @remove="emit('remove', $event)"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </component>
</template>
