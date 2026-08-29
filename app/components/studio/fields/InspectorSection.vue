<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: '' })
</script>

<template>
  <div>
    <div
      v-if="label"
      class="mb-2.5 text-[10.5px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]"
    >
      {{ label }}
    </div>
    <div class="flex flex-col gap-[11px]">
      <slot />
    </div>
  </div>
</template>
