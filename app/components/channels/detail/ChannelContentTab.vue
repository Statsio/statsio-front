<script setup lang="ts">
import DsInput from '@/components/ds/DsInput.vue'
import DsSegmented from '@/components/ds/DsSegmented.vue'
import ListingEmptyState from '@/components/listing/tranches/ListingEmptyState.vue'
import ListingEndLine from '@/components/listing/tranches/ListingEndLine.vue'
import type { CatalogSort } from '@/types/catalog'

defineProps<{
  sort: CatalogSort
  query: string
  loading?: boolean
  shown: number
  total: number
  unit: { one: string; many: string }
  emptyTitle: string
}>()

const emit = defineEmits<{ 'update:sort': [CatalogSort]; 'update:query': [string] }>()

const sorts = [
  { value: 'recent' as const, label: 'Récents' },
  { value: 'views' as const, label: 'Les plus vus' },
]
</script>

<template>
  <div class="clist">
    <div class="clist__head">
      <p class="clist__n">
        <span>{{ shown }}</span> {{ shown > 1 ? unit.many : unit.one
        }}<template v-if="query.trim()"> sur {{ total }}</template>
      </p>
      <div class="clist__tools">
        <DsInput
          :model-value="query"
          type="search"
          size="md"
          class="clist__search"
          :placeholder="`Chercher dans les ${unit.many}…`"
          :aria-label="`Chercher dans les ${unit.many}`"
          autocomplete="off"
          @update:model-value="emit('update:query', $event)"
        >
          <template #leading>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <circle cx="7" cy="7" r="5.2" fill="none" stroke="currentColor" stroke-width="1.8" />
              <path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </template>
        </DsInput>
        <DsSegmented
          :model-value="sort === 'views' ? 'views' : 'recent'"
          :options="sorts"
          label="Trier"
          @update:model-value="emit('update:sort', $event)"
        />
      </div>
    </div>

    <div v-if="loading" class="clist__grid">
      <div v-for="i in 6" :key="i" class="clist__sk" />
    </div>
    <template v-else-if="shown">
      <div class="clist__grid"><slot /></div>
      <ListingEndLine
        :total="shown"
        :overall="query.trim() ? total : null"
        :unit="unit"
      />
    </template>
    <ListingEmptyState
      v-else
      :query="query"
      :filtered="Boolean(query.trim())"
      :title="`Aucun ${unit.one}`"
      :empty-title="emptyTitle"
      hint="Effacez la recherche pour revoir les publications de la chaîne."
      @reset="emit('update:query', '')"
    />
  </div>
</template>

<style scoped>
.clist {
  padding-block: 32px 0;
}
.clist__head {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}
.clist__n {
  margin: 0;
  font: 800 26px/1 var(--ds-display);
  font-stretch: 95%;
}
.clist__n span {
  color: var(--ds-accent);
}
.clist__tools {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.clist__search {
  width: 260px;
  max-width: 100%;
  color: var(--ds-link);
}
.clist__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}
.clist__sk {
  height: 280px;
  border: 2px solid var(--ds-divide);
  border-radius: 6px;
  background: var(--ds-tint);
}
@media (max-width: 1040px) {
  .clist__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .clist__search {
    width: 100%;
  }
  .clist__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
