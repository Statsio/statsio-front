<script setup lang="ts">
defineProps<{
  title: string
  linkLabel: string
}>()

const emit = defineEmits<{ 'view-all': [] }>()
</script>

<template>
  <section>
    <div class="mb-4 flex items-baseline justify-between gap-3">
      <h2 class="text-[18px] font-extrabold tracking-[-0.015em] text-slate-950">{{ title }}</h2>
      <button type="button" class="shrink-0 text-[12.5px] font-bold text-primary hover:underline" @click="emit('view-all')">
        {{ linkLabel }} →
      </button>
    </div>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <slot />
    </div>
  </section>
</template>
