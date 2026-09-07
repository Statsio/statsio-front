<script setup lang="ts">
import CatalogSortPills from '@/components/listing/CatalogSortPills.vue'
import type { CatalogSort } from '@/types/catalog'

defineProps<{
  sort: CatalogSort
  sortOptions: { value: CatalogSort; label: string }[]
  loading?: boolean
  isEmpty?: boolean
  emptyText: string
}>()

const emit = defineEmits<{ 'update:sort': [CatalogSort] }>()
</script>

<template>
  <div class="py-8">
    <div class="mb-4 flex items-center justify-end">
      <CatalogSortPills
        :model-value="sort"
        :options="sortOptions"
        @update:model-value="emit('update:sort', $event)"
      />
    </div>

    <div v-if="loading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="i in 6" :key="i" class="h-72 animate-pulse rounded-[18px] bg-white" />
    </div>

    <div v-else-if="!isEmpty" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <slot />
    </div>

    <div
      v-else
      class="rounded-[20px] border-[1.5px] border-dashed border-slate-200 px-8 py-16 text-center text-sm text-slate-500"
    >
      {{ emptyText }}
    </div>
  </div>
</template>
