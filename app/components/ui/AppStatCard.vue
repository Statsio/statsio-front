<script setup lang="ts">
/**
 * Carte KPI réutilisable : libellé en capitales, valeur en chiffre `mono`, et
 * une note optionnelle (croissance, moyenne de référence, « bientôt »…).
 * Utilisée par le dashboard chaîne et l'aperçu du compte.
 */
withDefaults(
  defineProps<{
    label: string
    value: string | number
    hint?: string
    hintTone?: 'positive' | 'negative' | 'muted'
  }>(),
  { hint: '', hintTone: 'muted' },
)

const hintClasses = {
  positive: 'text-emerald-600',
  negative: 'text-rose-600',
  muted: 'text-slate-400',
} as const
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-[18px] shadow-[0_1px_3px_rgba(20,20,30,0.05)]">
    <div class="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-400">{{ label }}</div>
    <div class="mt-2.5 font-mono text-[23px] font-semibold text-slate-950">{{ value }}</div>
    <div v-if="hint || $slots.hint" class="mt-1 text-[11.5px] font-semibold" :class="hintClasses[hintTone]">
      <slot name="hint">{{ hint }}</slot>
    </div>
  </div>
</template>
