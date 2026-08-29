<script setup lang="ts">
// Label + mono hint row shared by every inspector field. Renders nothing but the
// slot when no label is provided.
withDefaults(defineProps<{ label?: string; hint?: string }>(), {
  label: '',
  hint: '',
})
</script>

<template>
  <div>
    <div
      v-if="label || hint"
      class="mb-[7px] flex items-baseline justify-between gap-2.5"
    >
      <span v-if="label" class="text-[12.5px] font-bold text-[var(--studio-ink)]">{{ label }}</span>
      <span v-if="hint" class="font-mono text-[11px] text-[var(--studio-faint)]">{{ hint }}</span>
    </div>
    <slot />
  </div>
</template>
