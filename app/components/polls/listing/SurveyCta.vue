<script setup lang="ts">
import { computed } from 'vue'
import DsButton from '@/components/ds/DsButton.vue'
import { surveyCta, type SurveyState } from '@/lib/surveys-listing'
import type { CatalogItem } from '@/types/catalog'

/**
 * Appel à l'action d'une carte : « Voter / Répondre / Signer », « Voir les
 * résultats » une fois clos, ou « Vous avez participé ». Doublon du lien du
 * titre pour la souris : hors tabulation.
 */
const props = defineProps<{ item: CatalogItem; to: string; state: SurveyState }>()
const cta = computed(() => surveyCta(props.item, props.state))
</script>

<template>
  <span v-if="cta.kind === 'done'" class="svdone">
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 8.5 L6.5 12 L13 4.5"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
      />
    </svg>
    {{ cta.label }}
  </span>
  <DsButton
    v-else
    :to="to"
    size="sm"
    :variant="cta.kind === 'results' ? 'secondary' : 'primary'"
    tabindex="-1"
    aria-hidden="true"
  >
    {{ cta.label }}
  </DsButton>
</template>

<style scoped>
.svdone {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ds-ok);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}
</style>
