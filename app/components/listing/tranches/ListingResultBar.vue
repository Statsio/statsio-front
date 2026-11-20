<script setup lang="ts" generic="K extends string">
/** Nombre de résultats (annoncé), filtres actifs retirables, rappel du tri. */
defineProps<{
  total: number
  /** unité comptée : « 3 articles », « 1 StatsData » */
  unit: { one: string; many: string }
  /** total du catalogue sans filtre, affiché quand des filtres sont actifs */
  overall?: number | null
  filters: { key: K; label: string }[]
  context: string
}>()
const emit = defineEmits<{ remove: [key: K]; reset: [] }>()
</script>

<template>
  <div class="rbar">
    <div>
      <p class="rbar__n" aria-live="polite">
        <span>{{ total }}</span> {{ total > 1 ? unit.many : unit.one
        }}<template v-if="overall != null"> sur {{ overall }}</template>
      </p>
      <div v-if="filters.length" class="rbar__active">
        <button
          v-for="f in filters"
          :key="f.key"
          type="button"
          :aria-label="`Retirer le filtre ${f.label}`"
          @click="emit('remove', f.key)"
        >
          {{ f.label }} <span aria-hidden="true">×</span>
        </button>
        <button v-if="filters.length > 1" type="button" @click="emit('reset')">Tout effacer</button>
      </div>
    </div>
    <span class="rbar__ctx">{{ context }}</span>
  </div>
</template>

<style scoped>
.rbar {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 22px;
}
.rbar__n {
  margin: 0;
  font: 800 22px/1 var(--ds-display);
  font-stretch: 95%;
}
.rbar__n span {
  color: var(--ds-accent);
}
.rbar__active {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.rbar__active button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border: 2px solid var(--ds-divide);
  border-radius: 999px;
  background: var(--ds-surface);
  color: var(--ds-link);
  font: 700 12.5px/1 var(--ds-ui);
  cursor: pointer;
}
.rbar__active button:hover {
  border-color: var(--ds-ol);
}
.rbar__active button:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 2px;
}
.rbar__ctx {
  color: var(--ds-faint);
  font: 400 12px var(--ds-num);
}
</style>
