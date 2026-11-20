<script setup lang="ts">
import DsSwatch from './DsSwatch.vue'

/**
 * « La tranche » : barre proportionnelle servant de filtre (signature de la
 * charte). Chaque part a la largeur de son effectif ; la part choisie se soulève,
 * les autres s'estompent. Recliquer la part choisie la désélectionne (`''`).
 * Légende en pourcentages sous la barre (masquée aux lecteurs d'écran : chaque
 * bouton porte déjà son libellé et son effectif).
 */
const props = defineProps<{
  slices: { value: string; label: string; count: number; color: string; ink: string }[]
  /** id de l'élément qui nomme le groupe */
  labelledby?: string
  /** unité lue avec l'effectif : « 3 articles » */
  unit?: { one: string; many: string }
}>()

const model = defineModel<string>({ default: '' })

const total = () => props.slices.reduce((sum, s) => sum + s.count, 0)
const pct = (count: number) => {
  const t = total()
  return t > 0 ? Math.round((count / t) * 100) : 0
}
const ariaOf = (s: { label: string; count: number }) =>
  props.unit ? `${s.label}, ${s.count} ${s.count > 1 ? props.unit.many : props.unit.one}` : `${s.label}, ${s.count}`

function toggle(value: string) {
  model.value = model.value === value ? '' : value
}
</script>

<template>
  <div class="ds-slice">
    <div class="ds-slice__bar" :class="{ 'has-sel': !!model }" role="group" :aria-labelledby="labelledby">
      <button
        v-for="s in slices"
        :key="s.value"
        type="button"
        class="ds-slice__part"
        :aria-pressed="model === s.value"
        :aria-label="ariaOf(s)"
        :style="{ flex: `${s.count} 1 0`, background: s.color, color: s.ink }"
        @click="toggle(s.value)"
      >
        <span class="ds-slice__name">{{ s.label }}</span>
        <b class="ds-slice__count">{{ s.count }}</b>
      </button>
    </div>
    <div class="ds-slice__legend" aria-hidden="true">
      <span v-for="s in slices" :key="s.value" class="ds-slice__key">
        <DsSwatch :color="s.color" :size="10" />{{ s.label }} · {{ pct(s.count) }} %
      </span>
    </div>
  </div>
</template>

<style scoped>
.ds-slice {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.ds-slice__bar {
  display: flex;
  height: 40px;
  border: 2px solid var(--ds-ol);
  border-radius: 4px;
  background: var(--ds-surface);
}
.ds-slice__part {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  padding: 0 8px;
  overflow: hidden;
  border: 0;
  font: 700 13px/1 var(--ds-ui);
  white-space: nowrap;
  cursor: pointer;
  transition:
    transform 0.25s var(--ds-e-glisse),
    box-shadow 0.25s var(--ds-e-glisse),
    opacity 0.2s,
    filter 0.2s;
}
.ds-slice__part + .ds-slice__part {
  border-left: 2px solid var(--ds-ol);
}
.ds-slice__part:hover {
  filter: brightness(1.06);
}
.has-sel .ds-slice__part:not([aria-pressed='true']) {
  opacity: 0.42;
}
.ds-slice__part[aria-pressed='true'] {
  z-index: 1;
  transform: translate(-3px, -5px);
  box-shadow: 3px 5px 0 var(--ds-ol);
  outline: 2px solid var(--ds-ol);
}
.ds-slice__part:focus-visible {
  z-index: 2;
  outline: 3px solid var(--ds-text);
  outline-offset: -3px;
}
.ds-slice__name {
  overflow: hidden;
  text-overflow: ellipsis;
}
.ds-slice__count {
  font: 500 11.5px var(--ds-num);
  opacity: 0.85;
}
.ds-slice__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  color: var(--ds-muted);
  font-size: 12.5px;
}
.ds-slice__key {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
@media (max-width: 640px) {
  .ds-slice__name {
    display: none;
  }
}
</style>
