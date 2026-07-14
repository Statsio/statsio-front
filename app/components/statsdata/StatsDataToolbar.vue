<script setup lang="ts">
defineProps<{
  categories: string[]
}>()

const search = defineModel<string>('search', { default: '' })
const category = defineModel<string>('category', { default: '' })
const sort = defineModel<'recent' | 'rows'>('sort', { default: 'recent' })
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <div class="flex min-w-[240px] flex-1 items-center gap-2.5 rounded-xl bg-slate-50 px-4 py-3">
      <svg class="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <input
        v-model="search"
        type="search"
        placeholder="Rechercher un dataset, une source…"
        class="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
      />
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-full px-4 py-2 text-xs font-semibold transition"
        :class="category === '' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'"
        @click="category = ''"
      >
        Tous
      </button>
      <button
        v-for="cat in categories"
        :key="cat"
        type="button"
        class="rounded-full px-4 py-2 text-xs font-semibold transition"
        :class="category === cat ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'"
        @click="category = cat"
      >
        {{ cat }}
      </button>
    </div>

    <select
      v-model="sort"
      class="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
      aria-label="Trier le catalogue"
    >
      <option value="recent">Trier : Récents</option>
      <option value="rows">Trier : Volume</option>
    </select>
  </div>
</template>
