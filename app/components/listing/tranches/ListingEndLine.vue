<script setup lang="ts">
import { computed } from 'vue'

/**
 * Fin de liste entre deux filets : « Les 7 chaînes sont affichées », « 1 article
 * affiché », ou « 3 sur 12 StatsData » quand des filtres sont actifs (`overall`).
 */
const props = defineProps<{
  total: number
  /** total du catalogue sans filtre ; renseigné seulement quand des filtres sont actifs */
  overall?: number | null
  unit: { one: string; many: string }
  /** accord de « affiché » (chaînes, consultations) */
  feminine?: boolean
}>()

const text = computed(() => {
  const { total, overall, unit } = props
  if (overall != null) return `${total} sur ${overall} ${overall > 1 ? unit.many : unit.one}`
  const shown = `affiché${props.feminine ? 'e' : ''}`
  return total > 1 ? `Les ${total} ${unit.many} sont ${shown}s` : `${total} ${unit.one} ${shown}`
})
</script>

<template>
  <p class="lend">{{ text }}</p>
</template>

<style scoped>
.lend {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 34px 0 0;
  color: var(--ds-muted);
  font: 500 12px var(--ds-num);
  letter-spacing: 0.06em;
}
.lend::before,
.lend::after {
  content: '';
  flex: 1;
  height: 2px;
  background: var(--ds-divide);
}
</style>
