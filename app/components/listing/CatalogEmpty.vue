<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
}>()

const emit = defineEmits<{
  reset: []
}>()
</script>

<template>
  <div class="rounded-[20px] border-[1.5px] border-dashed border-slate-200 px-8 py-16 text-center">
    <p class="text-xl font-extrabold tracking-[-0.015em] text-slate-950">{{ title }}</p>
    <p class="mt-2.5 text-sm text-slate-500">{{ subtitle }}</p>
    <button
      type="button"
      class="mt-6 rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] px-[22px] py-3 text-[13px] font-extrabold text-white"
      @click="emit('reset')"
    >
      Réinitialiser les filtres
    </button>
  </div>
</template>
