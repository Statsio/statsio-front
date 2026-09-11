<script setup lang="ts">
import { computed, ref } from 'vue'
import { refDebounced } from '@vueuse/core'
import { fetchHelpHome, searchHelp } from '@/api/help'
import CategoryIcon from '@/components/ui/CategoryIcon.vue'
import type { HelpArticleSummary } from '@/types/help'

const { data } = await useAsyncData('help-home', () => fetchHelpHome())

const home = computed(
  () => data.value ?? { categories: [], popular: [], recent: [] },
)

const qInput = ref('')
const q = refDebounced(qInput, 280)
const isSearching = computed(() => q.value.trim().length > 0)

const { data: searchResults, pending: searchPending } = await useAsyncData<HelpArticleSummary[]>(
  'help-search',
  () => (isSearching.value ? searchHelp(q.value.trim()) : Promise.resolve([])),
  { watch: [q] },
)

const suggestions = ['Créer un compte', 'Importer un CSV', 'Créer une chaîne', 'Facturation']
</script>

<template>
  <main class="pb-4">
    <!-- Hero -->
    <div
      class="relative overflow-hidden px-6 pt-20 pb-16 text-center"
      style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent))"
    >
      <div class="relative mx-auto flex max-w-xl flex-col items-center gap-6">
        <h1 class="text-3xl font-extrabold text-white sm:text-4xl">Comment pouvons-nous vous aider ?</h1>
        <div class="relative w-full max-w-lg">
          <span class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400">⌕</span>
          <input
            v-model="qInput"
            type="search"
            placeholder="Rechercher un article, un guide, une question…"
            class="w-full rounded-2xl border-none bg-white py-4 pr-5 pl-11 text-sm text-slate-900 shadow-[0_12px_32px_rgba(20,20,30,0.18)] focus:outline-none"
          />
        </div>
        <div class="flex flex-wrap justify-center gap-2">
          <button
            v-for="s in suggestions"
            :key="s"
            type="button"
            class="rounded-full bg-white/15 px-3.5 py-1.5 text-[12.5px] font-semibold text-white"
            @click="qInput = s"
          >
            {{ s }}
          </button>
        </div>
      </div>
    </div>

    <!-- Search results -->
    <div v-if="isSearching" class="section container">
      <p class="mb-6 text-sm font-semibold text-slate-500">
        {{ searchPending ? 'Recherche…' : `${searchResults?.length ?? 0} résultat(s) pour « ${q.trim()} »` }}
      </p>
      <div class="flex flex-col border-t border-slate-200">
        <NuxtLink
          v-for="a in searchResults"
          :key="`${a.category?.slug}-${a.slug}`"
          :to="a.category ? `/aide/${a.category.slug}/${a.slug}` : '/aide'"
          class="u-hover flex items-center justify-between gap-4 border-b border-slate-200 py-5"
        >
          <div>
            <div class="u-card-title mb-1 text-[15.5px] font-bold text-slate-900">{{ a.title }}</div>
            <div class="text-[13px] text-slate-500">{{ a.excerpt }}</div>
          </div>
          <span class="shrink-0 text-xs font-semibold text-slate-400">{{ a.category?.name }}</span>
        </NuxtLink>
        <p v-if="!searchPending && searchResults?.length === 0" class="py-10 text-center text-sm text-slate-500">
          Aucun article ne correspond à votre recherche.
        </p>
      </div>
    </div>

    <template v-else>
      <!-- Category grid -->
      <div class="section container">
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="c in home.categories"
            :key="c.slug"
            :to="`/aide/${c.slug}`"
            class="u-card card flex flex-col gap-3.5 p-6"
          >
            <div
              class="flex h-11 w-11 items-center justify-center rounded-[11px]"
              :style="{ background: `color-mix(in srgb, ${c.color ?? 'var(--color-primary)'} 14%, white)` }"
            >
              <CategoryIcon :icon-name="c.icon" :color="c.color ?? 'var(--color-primary)'" :size="20" />
            </div>
            <div>
              <div class="u-card-title mb-1.5 text-base font-bold text-slate-900">{{ c.name }}</div>
              <div class="text-[13.5px] leading-relaxed text-slate-500">{{ c.description }}</div>
            </div>
            <span class="text-[12.5px] font-semibold text-slate-400">{{ c.articlesCount }} article(s) →</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Popular / recent -->
      <div class="section container grid grid-cols-1 gap-14 lg:grid-cols-2">
        <div>
          <p class="eyebrow mb-1">Populaire</p>
          <h2 class="mb-3.5 text-2xl font-extrabold text-slate-900">Articles les plus consultés</h2>
          <div class="flex flex-col">
            <NuxtLink
              v-for="a in home.popular"
              :key="`popular-${a.slug}`"
              :to="a.category ? `/aide/${a.category.slug}/${a.slug}` : '/aide'"
              class="u-hover flex items-center justify-between gap-3 border-b border-slate-200 py-3.5 text-[14.5px] font-semibold text-slate-900"
            >
              <span class="u-card-title">{{ a.title }}</span>
              <span class="shrink-0 text-xs font-semibold text-slate-400">{{ a.category?.name }}</span>
            </NuxtLink>
          </div>
        </div>
        <div>
          <p class="eyebrow mb-1">Nouveautés</p>
          <h2 class="mb-3.5 text-2xl font-extrabold text-slate-900">Derniers ajouts au centre d'aide</h2>
          <div class="flex flex-col">
            <NuxtLink
              v-for="a in home.recent"
              :key="`recent-${a.slug}`"
              :to="a.category ? `/aide/${a.category.slug}/${a.slug}` : '/aide'"
              class="u-hover flex items-center justify-between gap-3 border-b border-slate-200 py-3.5 text-[14.5px] font-semibold text-slate-900"
            >
              <span class="u-card-title">{{ a.title }}</span>
              <span class="shrink-0 text-xs font-semibold text-slate-400">{{ a.category?.name }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>

    <!-- Contact band -->
    <div class="container pb-16">
      <div class="flex flex-wrap items-center justify-between gap-8 rounded-3xl bg-slate-950 px-10 py-11">
        <div class="flex max-w-md flex-col gap-2">
          <h3 class="text-xl font-extrabold text-white">Vous ne trouvez pas de réponse ?</h3>
          <p class="text-[14.5px] text-white/60">
            Notre équipe support répond en moyenne sous 24h, du lundi au vendredi.
          </p>
        </div>
        <AppButton as="router-link" to="/contact" variant="gradient">Contacter le support</AppButton>
      </div>
    </div>
  </main>
</template>
