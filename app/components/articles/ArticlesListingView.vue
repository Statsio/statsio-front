<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchPublicArticles, type StatsDataDocument } from '@/api/studio'
import { getCategoryColorClass } from '@/lib/articleCategoryColor'
import { publicContentPath } from '@/lib/content-display'
import { relativeUpdate } from '@/utils/statsDataFormat'
import { useContentBasePath } from '@/composables/useContentBasePath'
import AppButton from '@/components/ui/AppButton.vue'
import AppDropdownMenu from '@/components/layout/AppDropdownMenu.vue'
import AppDropdownMenuItem from '@/components/layout/AppDropdownMenuItem.vue'

const props = defineProps<{
  categories?: string[]
  title?: string
}>()

const basePath = useContentBasePath()

const loading = ref(true)
const docs = ref<StatsDataDocument[]>([])
const search = ref('')
const activeCategory = ref('')
const sortMode = ref<'recent' | 'popular'>('recent')
const isSortMenuOpen = ref(false)
const sortMenuRef = ref<HTMLElement | null>(null)

onMounted(async () => {
  try {
    docs.value = await fetchPublicArticles(props.categories)
  } finally {
    loading.value = false
  }
})

function toggleSortMenu() {
  isSortMenuOpen.value = !isSortMenuOpen.value
}

function closeSortMenu() {
  isSortMenuOpen.value = false
}

function selectSort(mode: 'recent' | 'popular') {
  sortMode.value = mode
  closeSortMenu()
}

useClickOutside(sortMenuRef, closeSortMenu)

const sortLabel = computed(() => (sortMode.value === 'popular' ? 'Les plus lus' : 'Plus récents'))

const categories = computed(() => {
  const set = new Set<string>()
  for (const doc of docs.value) {
    for (const cat of doc.categories ?? []) set.add(cat)
  }
  return Array.from(set)
})

const filtered = computed(() => {
  let result = docs.value

  const query = search.value.trim().toLowerCase()
  if (query) {
    result = result.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        (article.categories ?? []).some((c) => c.toLowerCase().includes(query)),
    )
  }
  if (activeCategory.value) {
    result = result.filter((article) => article.categories?.includes(activeCategory.value))
  }

  if (sortMode.value === 'popular') {
    return [...result].sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0))
  }
  return [...result].sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime())
})

const featured = computed(() => filtered.value[0])
const secondary = computed(() => filtered.value.slice(1, 4))
const remaining = computed(() => filtered.value.slice(4))

const statHighlight = computed(() => ({
  value: filtered.value.length,
  label: filtered.value.length > 1 ? 'articles disponibles' : 'article disponible',
}))

const pageTitle = computed(() => props.title || 'Articles')
const pageSubtitle = computed(
  () => `${filtered.value.length} article${filtered.value.length > 1 ? 's' : ''} · ${categories.value.length} thématiques`,
)

function selectCategory(category: string) {
  activeCategory.value = category
}

function articlePath(slug?: string) {
  return publicContentPath('article', slug ?? '', basePath.value)
}
</script>

<template>
  <main class="pb-24 pt-4">
    <section class="section pb-6">
      <div class="container">
        <div class="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 class="text-3xl font-bold text-slate-950 sm:text-4xl">{{ pageTitle }}</h1>
            <p class="mt-1.5 text-sm text-slate-500">{{ pageSubtitle }}</p>
          </div>

          <div class="flex flex-wrap items-center gap-4">
            <label class="flex items-center gap-2 border-b border-slate-200 pb-0.5 text-sm text-slate-400 focus-within:border-slate-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                v-model="search"
                type="text"
                placeholder="Rechercher un article…"
                class="bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </label>

            <div class="h-4 w-px bg-slate-200" aria-hidden="true" />

            <div ref="sortMenuRef" class="relative">
              <button
                type="button"
                class="flex items-center gap-1.5 text-sm font-semibold text-slate-900"
                :aria-expanded="isSortMenuOpen"
                aria-haspopup="menu"
                @click="toggleSortMenu"
              >
                {{ sortLabel }}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              <AppDropdownMenu v-if="isSortMenuOpen" label="Trier les articles" align="right" width-class="min-w-[180px]">
                <AppDropdownMenuItem as="button" @click="selectSort('recent')">Plus récents</AppDropdownMenuItem>
                <AppDropdownMenuItem as="button" @click="selectSort('popular')">Les plus lus</AppDropdownMenuItem>
              </AppDropdownMenu>
            </div>
          </div>
        </div>

        <div v-if="categories.length > 0" class="mt-6 flex gap-7 overflow-x-auto border-b border-slate-200 pb-px">
          <button
            type="button"
            class="shrink-0 whitespace-nowrap pb-3 text-[13.5px] font-bold transition-colors"
            :class="
              !activeCategory
                ? 'border-b-2 border-[var(--color-primary)] text-slate-950'
                : 'border-b-2 border-transparent text-slate-500 hover:text-slate-900'
            "
            @click="selectCategory('')"
          >
            Toutes
          </button>
          <button
            v-for="cat in categories"
            :key="cat"
            type="button"
            class="shrink-0 whitespace-nowrap pb-3 text-[13.5px] font-bold transition-colors"
            :class="
              activeCategory === cat
                ? 'border-b-2 border-[var(--color-primary)] text-slate-950'
                : 'border-b-2 border-transparent text-slate-500 hover:text-slate-900'
            "
            @click="selectCategory(cat)"
          >
            {{ cat }}
          </button>
        </div>
      </div>
    </section>

    <!-- Loading -->
    <section v-if="loading" class="section pb-4">
      <div class="container grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 lg:auto-rows-[200px]">
        <div v-for="i in 6" :key="i" class="card h-full animate-pulse bg-slate-50" />
      </div>
    </section>

    <template v-else>
      <section v-if="featured" class="section pb-4">
        <div class="container">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 lg:auto-rows-[200px]">
            <RouterLink
              :to="articlePath(featured.slug)"
              class="group relative overflow-hidden rounded-2xl bg-slate-100 sm:col-span-2 lg:col-span-2 lg:row-span-2"
            >
              <img
                v-if="featured.thumbnail_url"
                :src="featured.thumbnail_url"
                :alt="featured.title"
                class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <div v-else class="absolute inset-0 bg-[var(--color-primary)]/10" aria-hidden="true" />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
              <div class="absolute inset-0 flex flex-col justify-end p-6">
                <span class="text-[11px] font-bold uppercase tracking-[0.04em] text-white/85">
                  {{ featured.categories?.[0] ?? 'Article' }} · À la une
                </span>
                <p class="mt-2 text-xl font-bold leading-tight text-white sm:text-2xl">{{ featured.title }}</p>
                <p class="mt-2.5 text-xs text-white/70">{{ featured.author?.name ?? 'Anonyme' }}</p>
              </div>
            </RouterLink>

            <RouterLink
              v-for="item in secondary"
              :key="item.slug"
              :to="articlePath(item.slug)"
              class="group relative min-h-[200px] overflow-hidden rounded-2xl bg-slate-100 lg:min-h-0"
            >
              <img
                v-if="item.thumbnail_url"
                :src="item.thumbnail_url"
                :alt="item.title"
                class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
              />
              <div v-else class="absolute inset-0 bg-[var(--color-primary)]/10" aria-hidden="true" />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/5 to-transparent" />
              <div class="absolute inset-0 flex flex-col justify-end p-4">
                <p class="text-[14.5px] font-bold leading-snug text-white">{{ item.title }}</p>
              </div>
            </RouterLink>

            <div class="flex min-h-[200px] flex-col justify-between rounded-2xl border border-slate-200 p-5 lg:min-h-0">
              <div>
                <span class="text-[11px] font-bold uppercase text-[var(--color-primary)]">En chiffres</span>
                <p class="mono mt-2 text-[28px] font-bold text-slate-950">{{ statHighlight.value }}</p>
                <p class="mt-1 text-xs leading-snug text-slate-500">{{ statHighlight.label }}</p>
              </div>
              <svg width="100%" height="34" viewBox="0 0 160 34" preserveAspectRatio="none" aria-hidden="true">
                <polyline
                  points="0,28 30,22 60,24 90,14 120,16 160,4"
                  fill="none"
                  stroke="var(--color-primary)"
                  stroke-width="2.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section v-if="remaining.length > 0" class="section pt-6">
        <div class="container">
          <div class="flex items-baseline justify-between">
            <p class="text-[15px] font-bold text-slate-950">Dernières analyses</p>
          </div>
          <div class="mt-2 flex flex-col">
            <RouterLink
              v-for="item in remaining"
              :key="item.slug"
              :to="articlePath(item.slug)"
              class="flex items-center gap-4 border-b border-slate-100 py-4 last:border-b-0"
            >
              <div class="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <img v-if="item.thumbnail_url" :src="item.thumbnail_url" :alt="item.title" class="h-full w-full object-cover" />
              </div>
              <div class="min-w-0 flex-1">
                <span class="text-[10.5px] font-bold uppercase" :class="getCategoryColorClass(item.categories?.[0] ?? '')">
                  {{ item.categories?.[0] ?? 'Article' }}
                </span>
                <p class="mt-1 text-[14.5px] font-bold text-slate-950">{{ item.title }}</p>
              </div>
              <span class="shrink-0 text-xs text-slate-400">{{ relativeUpdate(item.updated_at) }}</span>
            </RouterLink>
          </div>
        </div>
      </section>

      <section v-if="filtered.length === 0" class="section pt-10">
        <div class="container py-16 text-center text-slate-400">
          <p class="text-sm">Aucun article ne correspond à votre recherche.</p>
        </div>
      </section>
    </template>

    <section class="section pt-14">
      <div class="container">
        <div class="rounded-[2.5rem] border border-slate-200 bg-white px-6 py-8 shadow-[0_40px_120px_-66px_rgba(15,23,42,0.4)] sm:px-8 lg:px-10">
          <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div class="flex flex-col gap-4">
              <p class="eyebrow text-primary">Publier sur Statsio</p>
              <h2 class="text-3xl font-semibold text-slate-950">Votre rédaction peut passer du signal à l’article sans changer d’outil.</h2>
              <p class="max-w-2xl text-base leading-7 text-slate-600">
                Brief éditorial, données, notes de contexte, visualisations et diffusion: la page articles s’inscrit dans un flux de production plus large.
              </p>
            </div>
            <div class="flex flex-wrap gap-3">
              <AppButton as="router-link" to="/register" variant="primary" size="md">
                Créer un espace
              </AppButton>
              <AppButton as="router-link" to="/login" variant="outline" size="md">
                Voir la démo
              </AppButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
