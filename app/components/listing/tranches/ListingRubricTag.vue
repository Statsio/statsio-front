<script setup lang="ts">
import { computed } from 'vue'
import DsSwatch from '@/components/ds/DsSwatch.vue'
import { CATALOG_FORMAT_STYLE } from '@/lib/catalog-theme'
import type { RubricBadge } from '@/lib/listing-rubrics'
import type { CatalogFormat } from '@/types/catalog'

/** « Rubrique · Format » en mono capitales, précédé de la pastille de la tranche. */
const props = defineProps<{ rubric: RubricBadge | null; format?: CatalogFormat | null }>()
const text = computed(() =>
  [props.rubric?.label, props.format ? CATALOG_FORMAT_STYLE[props.format]?.label : null]
    .filter(Boolean)
    .join(' · '),
)
</script>

<template>
  <span v-if="text" class="art-tag">
    <DsSwatch v-if="rubric" :color="rubric.color" :size="9" />
    {{ text }}
  </span>
</template>

<style scoped>
.art-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ds-link);
  font: 500 10.5px/1.2 var(--ds-num);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.art-tag :deep(.ds-swatch) {
  outline-width: 1.5px;
}
</style>
