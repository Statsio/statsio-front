<script setup lang="ts">
import { computed } from 'vue'
import AppSelect, { type AppSelectOption } from '@/components/ui/AppSelect.vue'
import type { ChannelCategory, ChannelCategoryItem, ChannelSort } from '@/api/channels'

const props = defineProps<{
  categories: readonly ChannelCategoryItem[]
  total: number
  resultCount: number
  loading: boolean
}>()

const emit = defineEmits<{
  reset: []
}>()

const search = defineModel<string>('search', { required: true })
const category = defineModel<ChannelCategory | ''>('category', { required: true })
const sort = defineModel<ChannelSort>('sort', { required: true })
const view = defineModel<'grid' | 'list'>('view', { required: true })
const verifiedOnly = defineModel<boolean>('verifiedOnly', { required: true })
const followedOnly = defineModel<boolean>('followedOnly', { required: true })

const sortOptions: AppSelectOption<ChannelSort>[] = [
  { value: 'popular', label: 'Les plus suivies' },
  { value: 'views', label: 'Les plus vues' },
  { value: 'recent', label: 'Les plus récentes' },
  { value: 'name', label: 'Ordre alphabétique' },
]

const categoryFilters = computed(() => [{ slug: '' as const, label: 'Toutes' }, ...props.categories])

const resultLabel = computed(() => (props.total > 1 ? 'chaînes' : 'chaîne'))
const activeAdjective = computed(() => (props.total > 1 ? 'actives' : 'active'))
const subtitle = computed(() =>
  props.loading
    ? 'Sources officielles, experts indépendants et collectifs thématiques.'
    : `${props.total} ${resultLabel.value} ${activeAdjective.value}, chacune avec sa propre identité visuelle.`,
)

const resultCountLabel = computed(() => (props.resultCount > 1 ? 'chaînes' : 'chaîne'))
const hasFilters = computed(
  () => search.value.length > 0 || category.value !== '' || verifiedOnly.value || followedOnly.value,
)

function clearSearch() {
  search.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <!-- Hero -->
    <div
      class="relative overflow-hidden rounded-[22px] border border-[var(--color-primary)]/[0.14] bg-white px-7 pb-9 pt-9 shadow-[0_2px_18px_rgba(139,92,246,0.07)] sm:px-11 sm:pt-10"
    >
      <div
        class="pointer-events-none absolute -right-24 -top-32 h-[340px] w-[340px] rounded-full"
        style="background: radial-gradient(circle, rgba(139, 92, 246, 0.16), rgba(59, 130, 246, 0.04) 60%, transparent 70%)"
      />
      <div class="relative max-w-xl">
        <p class="mb-4 text-[11.5px] font-bold uppercase tracking-[0.1em] text-[var(--color-primary)]">
          Annuaire des chaînes
        </p>
        <h1 class="mb-3.5 text-[32px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#18181f] sm:text-[42px]">
          Chaînes
          <span
            class="bg-[linear-gradient(100deg,var(--color-primary),var(--color-accent))] bg-clip-text text-transparent"
          >
            éditoriales
          </span>
        </h1>
        <p class="text-[15.5px] leading-[1.65] text-[#18181f]/60">{{ subtitle }}</p>
      </div>
    </div>

    <!-- Recherche + tri + vue -->
    <div
      class="flex flex-wrap items-center gap-3.5 rounded-2xl border border-[#18181f]/[0.08] bg-white p-4"
    >
      <div
        class="flex min-w-[240px] flex-1 items-center gap-2.5 rounded-[11px] border-[1.5px] border-[var(--color-primary)]/[0.16] bg-[#f7f6fb] px-3.5 py-[11px]"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" class="shrink-0">
          <circle cx="11" cy="11" r="7" stroke="#8b5cf6" stroke-width="2.2" fill="none" />
          <line x1="16.4" y1="16.4" x2="21" y2="21" stroke="#8b5cf6" stroke-width="2.2" />
        </svg>
        <input
          v-model="search"
          type="search"
          placeholder="Chercher une chaîne, un handle ou une description"
          class="min-w-0 flex-1 border-none bg-transparent text-sm text-[#18181f] outline-none placeholder:text-[#18181f]/35"
        />
        <button
          v-if="search"
          type="button"
          aria-label="Effacer la recherche"
          class="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/[0.12] text-[13px] text-[var(--color-primary)]"
          @click="clearSearch"
        >
          ×
        </button>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-[12.5px] font-semibold text-[#18181f]/45">Trier par</span>
        <AppSelect
          v-model="sort"
          :options="sortOptions"
          size="sm"
          aria-label="Tri"
          button-class="min-h-11 rounded-[10px] px-3.5 font-semibold"
        />
      </div>

      <div class="flex gap-[3px] rounded-[10px] bg-[#f7f6fb] p-[3px]">
        <button
          type="button"
          class="rounded-lg px-3.5 py-2 text-[12.5px] font-bold transition"
          :class="view === 'grid' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-[#18181f]/50'"
          @click="view = 'grid'"
        >
          Grille
        </button>
        <button
          type="button"
          class="rounded-lg px-3.5 py-2 text-[12.5px] font-bold transition"
          :class="view === 'list' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-[#18181f]/50'"
          @click="view = 'list'"
        >
          Liste
        </button>
      </div>
    </div>

    <!-- Catégories + filtres -->
    <div class="flex flex-wrap items-center gap-2.5">
      <button
        v-for="filter in categoryFilters"
        :key="filter.slug"
        type="button"
        class="rounded-full px-4 py-[9px] text-[13px] font-semibold transition"
        :class="
          category === filter.slug
            ? 'bg-[var(--color-primary)] text-white'
            : 'bg-[#f7f6fb] text-[#333] hover:bg-[#18181f]/10'
        "
        @click="category = filter.slug as ChannelCategory | ''"
      >
        {{ filter.label }}
      </button>

      <div class="mx-1 h-6 w-px bg-[#18181f]/10" />

      <label class="flex cursor-pointer items-center gap-2">
        <input v-model="verifiedOnly" type="checkbox" class="m-0 h-[15px] w-[15px] accent-[var(--color-primary)]" />
        <span class="text-[13px] font-semibold text-[#333]">Vérifiées</span>
      </label>
      <label class="flex cursor-pointer items-center gap-2">
        <input v-model="followedOnly" type="checkbox" class="m-0 h-[15px] w-[15px] accent-[var(--color-primary)]" />
        <span class="text-[13px] font-semibold text-[#333]">Mes abonnements</span>
      </label>
    </div>

    <!-- Résultats -->
    <div class="flex flex-wrap items-baseline justify-between gap-4">
      <p class="text-[13.5px] text-[#18181f]/55">
        <span v-if="loading">Chargement…</span>
        <span v-else><strong class="font-bold text-[#18181f]">{{ resultCount }}</strong> {{ resultCountLabel }}</span>
      </p>
      <button
        v-if="hasFilters"
        type="button"
        class="text-[12.5px] font-bold text-[var(--color-primary)]"
        @click="emit('reset')"
      >
        Réinitialiser les filtres
      </button>
    </div>
  </div>
</template>
