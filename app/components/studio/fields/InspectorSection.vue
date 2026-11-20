<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: '' })
</script>

<template>
  <div>
    <div
      v-if="label"
      class="st-lbl mb-2.5"
    >
      {{ label }}
    </div>
    <div class="flex flex-col gap-[11px]">
      <slot />
    </div>
  </div>
</template>
