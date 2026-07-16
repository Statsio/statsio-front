<script setup lang="ts">
import { computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect, { type AppSelectOption } from '@/components/ui/AppSelect.vue'
import type { ChannelCategory, ChannelCategoryItem, ChannelSort } from '@/api/channels'

const props = defineProps<{
  categories: readonly ChannelCategoryItem[]
  total: number
  loading: boolean
}>()

const emit = defineEmits<{
  reset: []
}>()

const search = defineModel<string>('search', { required: true })
const category = defineModel<ChannelCategory | ''>('category', { required: true })
const sort = defineModel<ChannelSort>('sort', { required: true })

const sortOptions: AppSelectOption<ChannelSort>[] = [
  { value: 'popular', label: 'Les plus suivies' },
  { value: 'views', label: 'Les plus vues' },
  { value: 'recent', label: 'Les plus récentes' },
  { value: 'name', label: 'Ordre alphabétique' },
]

const categoryFilters = computed(() => [{ slug: '' as const, label: 'Toutes' }, ...props.categories])

const resultLabel = computed(() => (props.total > 1 ? 'chaînes' : 'chaîne'))
</script>

<template>
  <div class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)] sm:p-6">
    <div class="mb-5 flex flex-col gap-3">
      <p class="eyebrow text-primary">Chaînes & abonnements</p>
      <div class="max-w-3xl">
        <h1 class="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
          Recherchez et suivez les chaînes qui font l’actualité data.
        </h1>
        <p class="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
          Sources officielles, experts indépendants et collectifs thématiques : filtrez par catégorie, triez par
          popularité et trouvez la chaîne à suivre.
        </p>
      </div>
    </div>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <label class="flex flex-col gap-2">
          <span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Recherche</span>
          <input
            v-model="search"
            type="search"
            placeholder="Chercher une chaîne, un handle ou une description"
            class="min-h-12 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10"
          />
        </label>

        <label class="flex flex-col gap-2">
          <span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tri</span>
          <AppSelect v-model="sort" :options="sortOptions" aria-label="Tri" />
        </label>
      </div>

      <div class="flex items-center justify-between gap-4 xl:justify-end">
        <p class="text-sm text-slate-500">
          <span v-if="loading">Chargement…</span>
          <span v-else>{{ total }} {{ resultLabel }}</span>
        </p>
        <AppButton variant="secondary" size="md" @click="emit('reset')">Réinitialiser</AppButton>
      </div>
    </div>

    <div class="mt-5 flex flex-wrap gap-2">
      <button
        v-for="filter in categoryFilters"
        :key="filter.slug"
        type="button"
        class="rounded-full border px-4 py-2 text-sm font-semibold transition"
        :class="
          category === filter.slug
            ? 'border-primary bg-primary text-white'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
        "
        @click="category = filter.slug as ChannelCategory | ''"
      >
        {{ filter.label }}
      </button>
    </div>
  </div>
</template>
