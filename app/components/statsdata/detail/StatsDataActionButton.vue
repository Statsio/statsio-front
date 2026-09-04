<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'

/** Pastille d'action de la page StatsData (maquette v2) : favori, suivre, partager, CSV, CTA. */
const props = withDefaults(
  defineProps<{
    variant?: 'neutral' | 'gradient' | 'toggle'
    active?: boolean
    as?: 'button' | 'a'
    href?: string
    /** Rendu en `RouterLink` (navigation SPA vers une autre page du document). */
    to?: RouteLocationRaw
    size?: 'sm' | 'md'
  }>(),
  { variant: 'neutral', active: false, as: 'button', size: 'md' },
)
defineEmits<{ click: [] }>()

const tag = computed(() => (props.to != null ? RouterLink : props.as))
</script>

<template>
  <component
    :is="tag"
    :to="to != null ? to : undefined"
    :href="to == null && as === 'a' ? href : undefined"
    :type="to == null && as === 'button' ? 'button' : undefined"
    class="sd-action inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold transition-colors"
    :class="[
      size === 'sm' ? 'px-4 py-2.5 text-[12.5px]' : 'px-5 py-3 text-[13px]',
      variant === 'gradient'
        ? 'sd-action--gradient tracking-[0.03em]'
        : variant === 'toggle' && active
          ? 'sd-action--on'
          : 'sd-action--ghost',
    ]"
    @click="$emit('click')"
  >
    <slot />
  </component>
</template>

<style scoped>
.sd-action--ghost {
  border: 1.5px solid var(--studio-line-strong);
  background: #fff;
  color: var(--studio-muted);
}
.sd-action--ghost:hover {
  border-color: var(--color-primary);
  color: var(--studio-tag-ink);
}
.sd-action--on {
  border: 1.5px solid color-mix(in srgb, var(--color-primary) 45%, transparent);
  background: var(--studio-tag);
  color: var(--studio-tag-ink);
}
.sd-action--gradient {
  border: 1.5px solid transparent;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  color: #fff;
}
.sd-action--gradient:hover {
  filter: brightness(1.05);
}
</style>
