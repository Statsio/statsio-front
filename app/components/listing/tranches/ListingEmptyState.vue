<script setup lang="ts">
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import { sectorPath } from '@/lib/ds/pie'

/**
 * Aucun résultat : disque en pointillés (rien à découper) + réinitialisation.
 * `title` / `emptyTitle` : avec ou sans filtre actif ; `hint` : piste de relance.
 */
defineProps<{
  query?: string
  filtered: boolean
  title: string
  emptyTitle: string
  hint: string
}>()
const emit = defineEmits<{ reset: [] }>()
const slice = sectorPath(60, 60, 44, -90, -30)
</script>

<template>
  <DsBox class="empty">
    <svg viewBox="0 0 120 120" width="88" height="88" aria-hidden="true">
      <circle cx="60" cy="60" r="56" class="empty__disc" />
      <path :d="slice" class="empty__slice" />
    </svg>
    <h3>{{ filtered ? title : emptyTitle }}</h3>
    <p v-if="filtered">
      <template v-if="query?.trim()"
        >Rien ne correspond à « {{ query.trim() }} » avec ces filtres.
      </template>
      {{ hint }}
    </p>
    <DsButton v-if="filtered" variant="secondary" @click="emit('reset')"
      >Réinitialiser les filtres</DsButton
    >
  </DsBox>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 36px 24px;
  text-align: center;
}
.empty__disc {
  fill: var(--ds-tint);
  stroke: var(--ds-ol);
  stroke-width: 2;
  stroke-dasharray: 8 7;
}
.empty__slice {
  fill: var(--ds-violet-300);
  stroke: var(--ds-ol);
  stroke-width: 2;
}
.empty h3 {
  margin: 0;
  font: 800 28px/1 var(--ds-display);
  font-stretch: 92%;
}
.empty p {
  max-width: 46ch;
  margin: 0;
  color: var(--ds-muted);
}
</style>
