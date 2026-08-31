<script setup lang="ts">
import type { CatalogView } from '@/types/catalog'

defineProps<{
  modelValue: CatalogView
}>()

const emit = defineEmits<{
  'update:modelValue': [CatalogView]
}>()
</script>

<template>
  <div class="flex shrink-0 items-center gap-0.5 rounded-xl bg-[#f4f3f8] p-0.5" role="group" aria-label="Affichage">
    <button
      type="button"
      class="flex h-[30px] w-[34px] items-center justify-center rounded-[9px] text-[13px] transition"
      :class="modelValue === 'grid' ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-slate-700'"
      title="Grille"
      aria-label="Vue grille"
      :aria-pressed="modelValue === 'grid'"
      @click="emit('update:modelValue', 'grid')"
    >
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
      </svg>
    </button>
    <button
      type="button"
      class="flex h-[30px] w-[34px] items-center justify-center rounded-[9px] text-[13px] transition"
      :class="modelValue === 'list' ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-slate-700'"
      title="Liste"
      aria-label="Vue liste"
      :aria-pressed="modelValue === 'list'"
      @click="emit('update:modelValue', 'list')"
    >
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
        <path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
  </div>
</template>
