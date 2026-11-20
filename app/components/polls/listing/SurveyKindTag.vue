<script setup lang="ts">
import { computed } from 'vue'
import SurveyKindGlyph from './SurveyKindGlyph.vue'
import { surveyKindOf } from '@/lib/surveys-listing'
import type { RubricBadge } from '@/lib/listing-rubrics'
import type { CatalogItem } from '@/types/catalog'

/** « Type · Thème » en mono capitales, précédé du pictogramme du type. */
const props = defineProps<{ item: CatalogItem; rubric?: RubricBadge | null }>()
const text = computed(() =>
  [surveyKindOf(props.item).label, props.rubric?.label].filter(Boolean).join(' · '),
)
</script>

<template>
  <span class="svkind">
    <SurveyKindGlyph :kind="item.survey_kind" :size="12" />
    {{ text }}
  </span>
</template>

<style scoped>
.svkind {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ds-link);
  font: 500 10.5px/1.2 var(--ds-num);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
</style>
