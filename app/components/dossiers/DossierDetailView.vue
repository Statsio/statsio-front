<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchDossierDetail } from '@/api/dossiers'
import { useDossierFollows } from '@/composables/useDossierFollows'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { catalogThemeStyle } from '@/lib/catalog-theme'
import { formatRelativePublished } from '@/lib/catalog-format'
import { formatShortDate } from '@/lib/format'
import { publicContentPath } from '@/lib/content-display'
import ContentCard from '@/components/content/ContentCard.vue'
import CatalogEmpty from '@/components/listing/CatalogEmpty.vue'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'
import type { CatalogItem } from '@/types/catalog'
import type { ContentType } from '@/types/content-creation'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const basePath = useContentBasePath()

const { data, error } = await useAsyncData(
  'dossier-detail',
  () => fetchDossierDetail(slug.value),
  { watch: [slug] },
)

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Dossier introuvable', fatal: true })
}

const detail = computed(() => data.value!)
const dossier = computed(() => detail.value.dossier)
const style = computed(() => catalogThemeStyle(dossier.value.category?.slug))

// Hero : image de dossier en fond (thème sombre) sinon fond blanc facon detail Statsdata.
const hero = computed(() => {
  const dark = Boolean(dossier.value.image_url)
  return {
    dark,
    crumbLink: dark ? 'text-white/60 hover:text-white' : 'text-slate-950/50 hover:text-slate-950',
    crumbSep: dark ? 'text-white/30' : 'text-slate-950/25',
    crumbCurrent: dark ? 'text-white' : 'text-slate-950',
    chip: dark ? 'text-white' : 'text-slate-950',
    chipBg: dark ? 'rgba(255,255,255,0.14)' : 'rgba(15,15,25,0.06)',
    kicker: dark ? 'text-white/55' : 'text-slate-950/45',
    title: dark ? 'text-white' : 'text-slate-950',
    desc: dark ? 'text-white/70' : 'text-slate-950/60',
    statBorder: dark ? 'border-white/[0.14]' : 'border-slate-950/10',
    statValue: dark ? 'text-white' : 'text-slate-950',
    statLabel: dark ? 'text-white/50' : 'text-slate-950/45',
    followFollowing: dark
      ? 'border-white/30 bg-white text-slate-950'
      : 'border-slate-950/20 bg-white text-slate-950',
    shareBtn: dark
      ? 'border-white/20 text-white/85 hover:border-white'
      : 'border-slate-950/15 text-slate-950/70 hover:border-slate-950',
  }
})

const { isFollowing, toggle } = useDossierFollows()
const following = computed(() => isFollowing(slug.value))

usePageSeo({
  title: () => dossier.value.name,
  description: () =>
    dossier.value.description ?? `Tous les contenus Statsio du dossier « ${dossier.value.name} ».`,
  image: () => dossier.value.image_url ?? undefined,
  canonical: () => route.path,
})

// ── Filtres client ──────────────────────────────────────────────────────────
type TypeKey = 'all' | 'article' | 'statsdata' | 'survey'
const typeFilter = ref<TypeKey>('all')
const sortMode = ref<'recent' | 'articles-first'>('recent')

const typeDefs: { key: TypeKey; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'article', label: 'Articles' },
  { key: 'statsdata', label: 'Statsdata' },
  { key: 'survey', label: 'Sondages' },
]

const sortDefs: { key: 'recent' | 'articles-first'; label: string }[] = [
  { key: 'recent', label: 'Plus récent' },
  { key: 'articles-first', label: "Articles d'abord" },
]

const typeChips = computed(() =>
  typeDefs
    .filter((t) => t.key === 'all' || detail.value.counts[t.key] > 0)
    .map((t) => ({ ...t, count: detail.value.counts[t.key] })),
)

const visibleItems = computed(() => {
  let list = detail.value.items
  if (typeFilter.value !== 'all') list = list.filter((it) => it.type === typeFilter.value)
  if (sortMode.value === 'articles-first') {
    list = [...list].sort((a, b) => Number(b.type === 'article') - Number(a.type === 'article'))
  }
  return list
})

// ── Frise chronologique (tous les contenus, groupés par mois) ────────────────
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
function monthLabel(iso?: string | null) {
  if (!iso) return 'Sans date'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Sans date'
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`.replace('.', '')
}
function dayLabel(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

const timeline = computed(() => {
  const groups: { label: string; items: CatalogItem[] }[] = []
  for (const it of detail.value.items) {
    const label = monthLabel(it.updated_at)
    let g = groups.find((x) => x.label === label)
    if (!g) {
      g = { label, items: [] }
      groups.push(g)
    }
    g.items.push(it)
  }
  return groups
})

function itemPath(it: CatalogItem) {
  return publicContentPath((it.type ?? 'statsdata') as ContentType, it.slug, basePath.value)
}
function typeDot(it: CatalogItem) {
  return catalogThemeStyle(it.category).dot
}

const shareState = ref<'idle' | 'copied'>('idle')
async function share() {
  const url = import.meta.client ? window.location.href : ''
  if (import.meta.client && typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await navigator.share({ title: dossier.value.name, url })
      return
    } catch {
      /* annulé */
    }
  }
  if (import.meta.client && navigator.clipboard) {
    await navigator.clipboard.writeText(url)
    shareState.value = 'copied'
    setTimeout(() => (shareState.value = 'idle'), 2000)
  }
}
</script>

<template>
  <div class="bg-[#f4f3f8]">
    <!-- Hero : image du dossier en fond, sinon fond blanc -->
    <section
      class="relative flex min-h-[320px] items-end overflow-hidden"
      :class="hero.dark ? 'bg-[#1c1620]' : 'border-b border-slate-950/[0.07] bg-white'"
    >
      <template v-if="hero.dark">
        <img
          :src="dossier.image_url!"
          alt=""
          class="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(20,16,26,0.35)_0%,rgba(15,12,20,0.82)_100%)]" />
      </template>

      <div class="absolute left-0 right-0 top-5 mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <nav class="flex flex-wrap items-center gap-2 text-[12.5px] font-semibold">
          <NuxtLink to="/" :class="hero.crumbLink">Accueil</NuxtLink>
          <span :class="hero.crumbSep">/</span>
          <NuxtLink to="/dossiers" :class="hero.crumbLink">Dossiers</NuxtLink>
          <span v-if="dossier.category" :class="hero.crumbSep">/</span>
          <span v-if="dossier.category" :class="hero.crumbCurrent">{{ dossier.category.label }}</span>
        </nav>
      </div>

      <div class="relative mx-auto w-full max-w-[1240px] px-4 pb-10 pt-[70px] sm:px-6 lg:px-8">
        <div class="mb-4 flex flex-wrap items-center gap-2.5">
          <span
            v-if="dossier.category"
            class="rounded-[5px] px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.04em]"
            :class="hero.chip"
            :style="{ background: hero.chipBg }"
          >
            {{ dossier.category.label }}
          </span>
          <span class="font-mono text-[10.5px] font-semibold tracking-[0.1em]" :class="hero.kicker">
            DOSSIER · MAJ {{ formatRelativePublished(dossier.updated_at).toUpperCase() }}
          </span>
        </div>
        <h1
          class="max-w-[24ch] text-[2rem] font-extrabold leading-[1.08] tracking-[-0.025em] text-pretty sm:text-[44px]"
          :class="hero.title"
        >
          {{ dossier.name }}
        </h1>
        <p v-if="dossier.description" class="mt-4 max-w-[62ch] text-base leading-relaxed text-pretty" :class="hero.desc">
          {{ dossier.description }}
        </p>

        <div class="mt-6 flex flex-wrap items-center gap-7 border-t pt-5" :class="hero.statBorder">
          <div>
            <div class="font-mono text-[19px] font-semibold" :class="hero.statValue">{{ dossier.content_count }}</div>
            <div class="mt-1 text-[10.5px]" :class="hero.statLabel">contenus dans ce dossier</div>
          </div>
          <div>
            <div class="font-mono text-[19px] font-semibold" :class="hero.statValue">{{ dossier.contributors_count }}</div>
            <div class="mt-1 text-[10.5px]" :class="hero.statLabel">{{ dossier.contributors_count === 1 ? 'contributeur' : 'contributeurs' }}</div>
          </div>
          <div>
            <div class="font-mono text-[19px] font-semibold" :class="hero.statValue">{{ formatRelativePublished(dossier.updated_at) }}</div>
            <div class="mt-1 text-[10.5px]" :class="hero.statLabel">dernière mise à jour</div>
          </div>
          <span class="flex-1" />
          <button
            type="button"
            class="flex items-center gap-2 rounded-full border-[1.5px] px-[22px] py-3 text-[13px] font-extrabold tracking-[0.02em] transition"
            :class="following
              ? hero.followFollowing
              : 'border-transparent bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] text-white'"
            @click="toggle(slug)"
          >
            {{ following ? '✓ Suivi' : '+ Suivre ce dossier' }}
          </button>
          <button
            type="button"
            :title="shareState === 'copied' ? 'Lien copié' : 'Partager'"
            class="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] transition"
            :class="hero.shareBtn"
            @click="share"
          >
            {{ shareState === 'copied' ? '✓' : '↗' }}
          </button>
        </div>
      </div>
    </section>

    <!-- Barre de filtres -->
    <div class="sticky top-[62px] z-[55] border-b border-slate-950/[0.07] bg-white/90 px-4 py-3.5 backdrop-blur sm:px-6 lg:px-8">
      <div class="mx-auto flex max-w-[1220px] items-center gap-2.5 overflow-x-auto">
        <div class="flex shrink-0 gap-1.5">
          <button
            v-for="t in typeChips"
            :key="t.key"
            type="button"
            class="flex items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] px-3.5 py-2 text-[12.5px] font-bold transition"
            :class="typeFilter === t.key
              ? 'border-[#c4b5fd] bg-[#f2ecfd] text-primary'
              : 'border-slate-200 bg-white text-slate-950 hover:border-slate-300'"
            @click="typeFilter = t.key"
          >
            <span>{{ t.label }}</span>
            <span class="font-mono text-[10.5px] font-medium" :class="typeFilter === t.key ? 'text-[#a78bfa]' : 'text-slate-950/40'">
              {{ t.count }}
            </span>
          </button>
        </div>
        <span class="flex-1" />
        <div class="flex shrink-0 items-center gap-0.5 rounded-full bg-[#f4f3f8] p-0.5">
          <button
            v-for="s in sortDefs"
            :key="s.key"
            type="button"
            class="whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-bold transition"
            :class="sortMode === s.key ? 'bg-white text-primary' : 'text-slate-500 hover:text-slate-800'"
            @click="sortMode = s.key"
          >
            {{ s.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="mx-auto grid max-w-[1240px] items-start gap-8 px-4 pb-24 pt-9 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8">
      <!-- Fil des contenus -->
      <div class="grid min-w-0 items-start gap-4 sm:grid-cols-2">
        <ContentCard
          v-for="it in visibleItems"
          :key="it.id"
          :item="it"
          format="card"
          class="sm:col-span-1"
        />
        <CatalogEmpty
          v-if="!visibleItems.length"
          class="sm:col-span-2"
          title="Aucun contenu de ce type"
          subtitle="Essayez un autre filtre."
          @reset="typeFilter = 'all'"
        />
      </div>

      <!-- Aside -->
      <aside class="flex flex-col gap-5 lg:sticky lg:top-[150px]">
        <div v-if="timeline.length" class="rounded-2xl border-[1.5px] border-slate-950/[0.06] bg-white p-5 shadow-[0_1px_3px_rgba(20,20,30,0.05)]">
          <div class="mb-3.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-slate-950/40">Frise chronologique</div>
          <div class="max-h-[420px] overflow-y-auto pr-1">
            <template v-for="g in timeline" :key="g.label">
              <div class="my-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.07em] text-slate-950/40">{{ g.label }}</div>
              <NuxtLink
                v-for="it in g.items"
                :key="it.id"
                :to="itemPath(it)"
                class="mb-2.5 grid grid-cols-[10px_minmax(0,1fr)] gap-2.5"
              >
                <span class="flex justify-center">
                  <span class="mt-1 h-2 w-2 shrink-0 rounded-full" :style="{ background: typeDot(it) }" />
                </span>
                <span class="min-w-0">
                  <span class="block font-mono text-[10px] text-slate-950/45">{{ dayLabel(it.updated_at) }}</span>
                  <span class="mt-0.5 block truncate text-[12.5px] font-bold text-slate-950 hover:text-primary">{{ it.title }}</span>
                </span>
              </NuxtLink>
            </template>
          </div>
        </div>

        <div class="rounded-2xl border-[1.5px] border-slate-950/[0.06] bg-white p-5 shadow-[0_1px_3px_rgba(20,20,30,0.05)]">
          <div class="mb-3.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-slate-950/40">À propos du dossier</div>
          <div class="flex flex-col gap-3 text-[12.5px]">
            <div v-if="dossier.category" class="flex justify-between gap-2.5">
              <span class="text-slate-950/50">Catégorie</span>
              <span class="font-bold" :style="{ color: style.fg }">{{ dossier.category.label }}</span>
            </div>
            <div class="flex justify-between gap-2.5">
              <span class="text-slate-950/50">Ouvert le</span>
              <span class="font-bold text-slate-950">{{ formatShortDate(dossier.opened_at) }}</span>
            </div>
            <div class="flex justify-between gap-2.5">
              <span class="text-slate-950/50">Contributeurs</span>
              <span class="font-bold text-slate-950">
                {{ dossier.contributors_count }} {{ dossier.contributors_count === 1 ? 'chaîne' : 'chaînes' }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="detail.related.length" class="rounded-2xl border-[1.5px] border-slate-950/[0.06] bg-white p-5 shadow-[0_1px_3px_rgba(20,20,30,0.05)]">
          <div class="mb-3.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-slate-950/40">
            Autres dossiers<span v-if="dossier.category"> · {{ dossier.category.label }}</span>
          </div>
          <div class="flex flex-col gap-3">
            <NuxtLink
              v-for="r in detail.related"
              :key="r.slug"
              :to="`/dossiers/${r.slug}`"
              class="group flex items-center gap-3 text-slate-950"
            >
              <span class="h-[42px] w-[42px] shrink-0 overflow-hidden rounded-[10px]">
                <AppMediaImage :src="r.image_url" :alt="r.name" class="rounded-[10px]" mark-class="min-w-0 w-1/2" />
              </span>
              <span class="min-w-0">
                <span class="block truncate text-[12.5px] font-bold group-hover:text-primary">{{ r.name }}</span>
                <span class="mt-0.5 block font-mono text-[10px] text-slate-950/45">{{ r.content_count }} contenus</span>
              </span>
            </NuxtLink>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
