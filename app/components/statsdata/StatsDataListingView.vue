<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import StatsDataToolbar from '@/components/statsdata/StatsDataToolbar.vue'
import DatasetCard from '@/components/statsdata/DatasetCard.vue'
import { fetchPublicStatsDataCatalog, type StatsDataDocument } from '@/api/studio'

const props = defineProps<{
  categories?: string[]
}>()

const loading = ref(true)
const docs = ref<StatsDataDocument[]>([])
const search = ref('')
const category = ref('')
const sort = ref<'recent' | 'rows'>('recent')

onMounted(async () => {
  try {
    docs.value = await fetchPublicStatsDataCatalog(props.categories)
  } finally {
    loading.value = false
  }
})

const categoryOptions = computed(() => {
  const set = new Set<string>()
  for (const doc of docs.value) {
    for (const cat of doc.categories ?? []) set.add(cat)
  }
  return Array.from(set)
})

function rowCountOf(doc: StatsDataDocument) {
  return doc.datasets?.[0]?.row_count ?? 0
}

const filtered = computed(() => {
  let result = docs.value

  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    result = result.filter((doc) => doc.title.toLowerCase().includes(q))
  }
  if (category.value) {
    result = result.filter((doc) => doc.categories?.includes(category.value))
  }

  return [...result].sort((a, b) => {
    if (sort.value === 'rows') return rowCountOf(b) - rowCountOf(a)
    return new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime()
  })
})
</script>

<template>
  <main class="pb-24">
    <section class="bg-white">
      <div class="container pb-10 pt-16">
        <div class="flex flex-wrap items-start justify-between gap-6">
          <div class="max-w-2xl">
            <AppBadge variant="soft-primary" mono>{{ docs.length }} datasets publiés</AppBadge>
            <h1 class="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">StatsData</h1>
            <p class="mt-3 text-base leading-relaxed text-slate-500">
              Des bases de données lisibles, sourcées et prêtes à analyser — mises à jour par la communauté de créateurs
              Statsio.
            </p>
          </div>
          <AppButton as="router-link" to="/contenus" variant="secondary" size="md" class="shrink-0">
            Publier un dataset
          </AppButton>
        </div>

        <div class="mt-8">
          <StatsDataToolbar v-model:search="search" v-model:category="category" v-model:sort="sort" :categories="categoryOptions" />
        </div>
      </div>
    </section>

    <section class="bg-white">
      <div class="container pb-10">
        <!-- Loading -->
        <div v-if="loading" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="i in 6" :key="i" class="card h-56 animate-pulse bg-slate-50" />
        </div>

        <!-- Grid -->
        <div v-else-if="filtered.length > 0" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <DatasetCard v-for="doc in filtered" :key="doc.id" :document="doc" />
        </div>

        <!-- Empty -->
        <div v-else class="py-24 text-center text-slate-400">
          <p class="text-sm">
            {{ search || category ? 'Aucun résultat pour ces filtres.' : 'Aucun StatsData publié pour le moment.' }}
          </p>
        </div>
      </div>
    </section>
  </main>
</template>
