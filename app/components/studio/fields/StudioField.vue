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
      <span v-if="label" class="st-lbl !text-[10.5px]">{{ label }}</span>
      <span v-if="hint" class="st-meta !text-[11px]">{{ hint }}</span>
    </div>
    <slot />
  </div>
</template>
