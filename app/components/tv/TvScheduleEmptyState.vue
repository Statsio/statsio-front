<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  description?: string
}>(), {
  title: 'Aucun programme disponible pour cette date',
  description: 'Essayez un des filtres rapides ci-dessus pour voir le programme.',
})
</script>

<template>
  <div class="rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
    <p class="text-[15px] font-bold text-slate-900">{{ title }}</p>
    <p class="mt-2 text-[13.5px] text-slate-500">{{ description }}</p>
  </div>
</template>
