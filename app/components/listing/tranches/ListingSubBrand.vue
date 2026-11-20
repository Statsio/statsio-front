<script setup lang="ts">
import { computed } from 'vue'
import { resolveContentSubBrand } from '@/lib/content-subbrand'
import { useContentDomain } from '@/composables/useContentDomain'
import type { CatalogItem } from '@/types/catalog'

/** Pastille « Publié sur TVStats / Medistats » : seulement depuis Statsio. */
const props = defineProps<{ item: CatalogItem }>()
const domain = useContentDomain()
const brand = computed(() =>
  domain.value === 'statsio'
    ? resolveContentSubBrand(props.item.categories, props.item.sub_brand)
    : null,
)
</script>

<template>
  <span v-if="brand" class="lsub"
    ><img :src="brand.logo" alt="" width="18" height="18" />Publié sur {{ brand.name }}</span
  >
</template>

<style scoped>
.lsub {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 6px;
  padding: 4px 8px 4px 4px;
  border: 2px solid var(--ds-ol);
  border-radius: 999px;
  background: var(--ds-surface);
  color: var(--ds-text);
  font: 600 12px/1 var(--ds-ui);
}
.lsub img {
  border-radius: 3px;
}
</style>
