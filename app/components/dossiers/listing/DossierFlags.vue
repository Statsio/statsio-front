<script setup lang="ts">
import { computed } from 'vue'
import ListingRubricTag from '@/components/listing/tranches/ListingRubricTag.vue'
import { useContentDomain } from '@/composables/useContentDomain'
import { resolveContentSubBrand } from '@/lib/content-subbrand'
import type { RubricBadge } from '@/lib/listing-rubrics'
import type { DossierCatalogItem } from '@/types/dossier'

/**
 * Ligne d'en-tête d'une carte de dossier : thème à gauche ; « Épinglé » et
 * « Sur TVStats / Medistats » (seulement depuis Statsio) à droite.
 */
const props = defineProps<{ item: DossierCatalogItem; rubric: RubricBadge | null }>()

const domain = useContentDomain()
const brand = computed(() =>
  domain.value === 'statsio' ? resolveContentSubBrand(null, props.item.sub_brand) : null,
)
</script>

<template>
  <div class="dflags">
    <ListingRubricTag :rubric="rubric" />
    <span v-if="item.is_pinned || brand" class="dflags__end">
      <span v-if="item.is_pinned" class="dflags__pin">
        <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="M4 1h4l-.6 3.6 2.1 2H2.5l2.1-2ZM6 6.6V11"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linejoin="round"
          />
        </svg>
        Épinglé
      </span>
      <span v-if="brand" class="dflags__sub">
        <img :src="brand.logo" alt="" width="18" height="18" />Sur {{ brand.name }}
      </span>
    </span>
  </div>
</template>

<style scoped>
.dflags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.dflags__end {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.dflags__pin {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 7px;
  border: 2px solid var(--ds-ol);
  border-radius: 999px;
  background: var(--ds-action);
  color: var(--ds-action-ink);
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.dflags__sub {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 4px;
  border: 2px solid var(--ds-ol);
  border-radius: 999px;
  background: var(--ds-surface);
  color: var(--ds-text);
  font: 600 12px/1 var(--ds-ui);
}
.dflags__sub img {
  border-radius: 3px;
}
</style>
