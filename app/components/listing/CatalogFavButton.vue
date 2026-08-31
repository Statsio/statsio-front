<script setup lang="ts">
defineProps<{
  active: boolean
  compact?: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <button
    type="button"
    class="flex shrink-0 items-center justify-center rounded-full transition"
    :class="
      compact
        ? 'h-[26px] w-[26px] text-xs'
        : 'h-7 w-7 text-xs'
    "
    :style="active ? { color: '#7c3aed', background: '#f2ecfd' } : { color: 'rgba(24,24,31,0.45)', background: '#fff' }"
    :aria-pressed="active"
    :aria-label="active ? 'Retirer des favoris' : 'Ajouter aux favoris'"
    @click.prevent.stop="emit('toggle')"
  >
    {{ active ? '★' : '☆' }}
  </button>
</template>
