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
const activeAdjective = computed(() => (props.total > 1 ? 'actives' : 'active'))
const subtitle = computed(() =>
  props.loading
    ? 'Sources officielles, experts indépendants et collectifs thématiques.'
    : `${props.total} ${resultLabel.value} ${activeAdjective.value}, chacune avec sa propre identité visuelle.`,
)
</script>

<template>
  <div>
    <h1 class="text-[32px] font-bold tracking-[-0.02em] text-[#18181f]">Chaînes éditoriales</h1>
    <p class="mb-6 mt-2 max-w-2xl text-[15px] leading-6 text-[#18181f]/60">{{ subtitle }}</p>

    <div class="mb-7 flex flex-wrap items-center gap-2">
      <button
        v-for="filter in categoryFilters"
        :key="filter.slug"
        type="button"
        class="rounded-full px-4 py-[9px] text-[13px] font-semibold transition"
        :class="category === filter.slug ? 'bg-[#18181f] text-white' : 'bg-[#f7f6fb] text-[#333] hover:bg-[#18181f]/10'"
        @click="category = filter.slug as ChannelCategory | ''"
      >
        {{ filter.label }}
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3 border-t border-[#18181f]/[0.08] pt-5">
      <input
        v-model="search"
        type="search"
        placeholder="Chercher une chaîne, un handle ou une description"
        class="min-h-11 min-w-[240px] flex-1 rounded-xl border border-[#18181f]/10 bg-white px-4 text-sm text-[#18181f] outline-none transition placeholder:text-[#18181f]/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
      />

      <AppSelect v-model="sort" :options="sortOptions" size="sm" aria-label="Tri" button-class="min-h-11" />

      <p class="text-sm text-[#18181f]/50">
        <span v-if="loading">Chargement…</span>
        <span v-else>{{ total }} {{ resultLabel }}</span>
      </p>

      <AppButton variant="secondary" size="md" class="ml-auto" @click="emit('reset')">Réinitialiser</AppButton>
    </div>
  </div>
</template>
