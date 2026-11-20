<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import DsButton from '@/components/ds/DsButton.vue'
import DsChip from '@/components/ds/DsChip.vue'
import DsHeading from '@/components/ds/DsHeading.vue'
import DsInput from '@/components/ds/DsInput.vue'
import DsKbd from '@/components/ds/DsKbd.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsMeta from '@/components/ds/DsMeta.vue'
import DsRichTitle from '@/components/ds/DsRichTitle.vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'
import { useGlobalSearch } from '@/composables/useGlobalSearch'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { useRegisterSearchTarget } from '@/composables/useSearchTarget'
import { prefersReducedMotion } from '@/composables/useDrawAnimation'
import { buildSearchRows, highlightParts, navRowsOf, type SearchRow, type SearchScope } from '@/lib/search-rows'
import { publicContentListPath } from '@/lib/content-display'
import { formatCatalogCount, formatCatalogViews } from '@/lib/catalog-format'
import { relativeAge } from '@/lib/statsdata-freshness'
import { glyphForContentType } from '@/lib/ds/types'
import { plural } from '@/lib/home-tranches'
import type { HomeTranchesContent } from '@/data/brands/statsio/home-tranches'

/**
 * Hero de l'accueil : « Que voulez-vous savoir ? » + recherche instantanée.
 * Branché sur la recherche globale existante (`useGlobalSearch`, debounce +
 * anti-course) ; résultats groupés par type dans une listbox (↑ ↓ Entrée Échap),
 * portée filtrable côté client. Enregistre sa recherche comme cible du header
 * (raccourci « / » et bouton « Rechercher » quand on a défilé).
 */
const props = defineProps<{
  content: HomeTranchesContent['hero']
  totalContents: number
  channelsCount: number
  lastPublishedAt: string | null
}>()

const router = useRouter()
const basePath = useContentBasePath()
const { query, nonEmptyGroups, canSearch, loading, error, rememberQuery } = useGlobalSearch()

const SCOPES: { value: SearchScope; label: string; glyph?: 'statsdata' | 'article' | 'sondage' | 'chaine' }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'statsdata', label: 'StatsData', glyph: 'statsdata' },
  { value: 'article', label: 'Articles', glyph: 'article' },
  { value: 'survey', label: 'Sondages', glyph: 'sondage' },
  { value: 'channel', label: 'Chaînes', glyph: 'chaine' },
]
const scope = ref<SearchScope>('all')

const searchEl = ref<HTMLElement | null>(null)
const inputRef = ref<InstanceType<typeof DsInput> | null>(null)
const focused = ref(false)
const activeIndex = ref(-1)

const rows = computed<SearchRow[]>(() =>
  buildSearchRows(nonEmptyGroups.value, query.value, basePath.value, { scope: scope.value, maxPerGroup: 4 }),
)
const navRows = computed(() => navRowsOf(rows.value))
const open = computed(() => focused.value && canSearch.value)
const activeId = computed(() => (open.value && activeIndex.value >= 0 ? `hs-opt-${activeIndex.value}` : undefined))

watch(rows, () => {
  activeIndex.value = navRows.value.length ? 0 : -1
})

const statusLine = computed(() => {
  const parts: string[] = []
  if (props.totalContents)
    parts.push(`${formatCatalogCount(props.totalContents)} ${plural(props.totalContents, 'contenu')}`)
  if (props.channelsCount)
    parts.push(`${formatCatalogCount(props.channelsCount)} ${plural(props.channelsCount, 'chaîne')}`)
  return parts.join(' · ')
})
const freshness = computed(() => (props.lastPublishedAt ? relativeAge(props.lastPublishedAt) : ''))

function focusInput() {
  inputRef.value?.focus()
}

useRegisterSearchTarget(searchEl, () => {
  searchEl.value?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  setTimeout(focusInput, prefersReducedMotion() ? 0 : 350)
})

function navigate(to: string) {
  rememberQuery(query.value)
  focused.value = false
  void router.push(to)
}

function submit() {
  const active = navRows.value.find((r) => r.navIndex === activeIndex.value)
  if (open.value && active) {
    navigate(active.to)
    return
  }
  const q = query.value.trim()
  if (q.length < 2) {
    focusInput()
    return
  }
  const type = scope.value === 'all' || scope.value === 'channel' ? 'article' : scope.value
  navigate(`${publicContentListPath(type, basePath.value)}?q=${encodeURIComponent(q)}`)
}

function move(delta: number) {
  const len = navRows.value.length
  if (!len) return
  const next = activeIndex.value + delta
  activeIndex.value = next < 0 ? len - 1 : next >= len ? 0 : next
  void nextTick(() => document.getElementById(`hs-opt-${activeIndex.value}`)?.scrollIntoView?.({ block: 'nearest' }))
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' && open.value) {
    e.preventDefault()
    move(1)
  } else if (e.key === 'ArrowUp' && open.value) {
    e.preventDefault()
    move(-1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    submit()
  } else if (e.key === 'Escape') {
    focused.value = false
  }
}

function onBlur() {
  // laisse le temps au clic sur un résultat d'aboutir (mousedown + preventDefault)
  setTimeout(() => {
    if (!searchEl.value?.contains(document.activeElement)) focused.value = false
  }, 120)
}

function setScope(value: SearchScope) {
  scope.value = value
  focused.value = true
  focusInput()
}

function ask(q: string) {
  query.value = q
  focused.value = true
  focusInput()
}

function contentMeta(row: Extract<SearchRow, { kind: 'content' }>) {
  return [row.item.publisher?.name, row.item.views_count ? formatCatalogViews(row.item.views_count) : null]
    .filter(Boolean)
    .join(' · ')
}
</script>

<template>
  <div class="hs">
    <DsLabel>
      <template v-if="statusLine">{{ statusLine }}</template>
      <template v-if="statusLine && freshness"> · </template>
      <b v-if="freshness">mis à jour {{ freshness }}</b>
    </DsLabel>
    <DsHeading :level="1" size="display" class="hs__title">
      <DsRichTitle :parts="content.title" />
    </DsHeading>
    <p class="hs__lede">{{ content.lede }}</p>

    <div ref="searchEl" class="hs__search">
      <form role="search" @submit.prevent="submit">
        <DsInput
          ref="inputRef"
          v-model="query"
          size="lg"
          type="search"
          role="combobox"
          aria-label="Rechercher un contenu"
          aria-autocomplete="list"
          aria-controls="hs-results"
          :aria-expanded="open"
          :aria-activedescendant="activeId"
          autocomplete="off"
          :placeholder="content.placeholder"
          @focus="focused = true"
          @blur="onBlur"
          @keydown="onKeydown"
        >
          <template #leading>
            <svg width="22" height="22" viewBox="0 0 16 16">
              <circle cx="7" cy="7" r="5.2" fill="none" stroke="currentColor" stroke-width="1.8" />
              <path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </template>
          <template #trailing>
            <DsKbd class="hs__kbd" aria-hidden="true">/</DsKbd>
            <DsButton type="submit">Chercher</DsButton>
          </template>
        </DsInput>
      </form>

      <div class="hs__scope" role="group" aria-label="Type de contenu">
        <DsChip
          v-for="s in SCOPES"
          :key="s.value"
          variant="scope"
          :pressed="scope === s.value"
          @mousedown.prevent
          @click="setScope(s.value)"
        >
          <template v-if="s.glyph" #swatch><DsTypeGlyph :kind="s.glyph" :size="13" /></template>
          {{ s.label }}
        </DsChip>
      </div>

      <div v-show="open" id="hs-results" class="hs__results" role="listbox" aria-label="Résultats">
        <p v-if="loading && !rows.length" class="hs__none">Recherche en cours…</p>
        <p v-else-if="error" class="hs__none">La recherche est indisponible pour le moment.</p>
        <p v-else-if="!rows.length" class="hs__none">
          Rien pour « {{ query.trim() }} »{{ scope !== 'all' ? ' dans ce type' : '' }} pour l'instant.
          Essayez un autre mot, ou changez de type.
        </p>
        <template v-for="row in rows" :key="row.key">
          <div v-if="row.kind === 'header'" class="hs__group" role="presentation">
            <DsTypeGlyph :kind="row.type === 'channel' ? 'chaine' : glyphForContentType(row.type)" :size="12" />
            {{ row.label }} · {{ row.total }}
          </div>
          <div
            v-else
            :id="`hs-opt-${row.navIndex}`"
            class="hs__item"
            :class="{ 'is-more': row.kind === 'more' }"
            role="option"
            :aria-selected="row.navIndex === activeIndex"
            @mousedown.prevent="navigate(row.to)"
            @mousemove="activeIndex = row.navIndex"
          >
            <template v-if="row.kind === 'content'">
              <span class="hs__thumb">
                <AppMediaImage v-if="row.item.thumbnail_url" :src="row.item.thumbnail_url" alt="" class="h-full w-full object-cover" />
                <DsTypeGlyph v-else :kind="glyphForContentType(row.type)" :size="22" />
              </span>
              <span class="min-w-0">
                <b class="hs__name">
                  <template v-for="(p, i) in highlightParts(row.item.title, query)" :key="i">
                    <mark v-if="p.hit">{{ p.text }}</mark>
                    <template v-else>{{ p.text }}</template>
                  </template>
                </b>
                <DsMeta>{{ contentMeta(row) }}</DsMeta>
              </span>
              <span class="hs__go" aria-hidden="true">ouvrir ↵</span>
            </template>
            <template v-else-if="row.kind === 'channel'">
              <span class="hs__thumb">
                <img v-if="row.channel.logo_url" :src="row.channel.logo_url" alt="" class="h-full w-full object-cover" />
                <DsTypeGlyph v-else kind="chaine" :size="22" />
              </span>
              <span class="min-w-0">
                <b class="hs__name">
                  <template v-for="(p, i) in highlightParts(row.channel.name, query)" :key="i">
                    <mark v-if="p.hit">{{ p.text }}</mark>
                    <template v-else>{{ p.text }}</template>
                  </template>
                  <span v-if="row.channel.verified" class="hs__verified" title="Chaîne vérifiée"> ✔</span>
                </b>
                <DsMeta>
                  {{ row.channel.handle ? `@${row.channel.handle} · ` : '' }}{{ formatCatalogCount(row.channel.followers_count) }} abonnés
                </DsMeta>
              </span>
              <span class="hs__go" aria-hidden="true">ouvrir ↵</span>
            </template>
            <template v-else>
              <span class="hs__more">Voir les {{ row.total }} résultats dans {{ row.label }} →</span>
            </template>
          </div>
        </template>
      </div>
    </div>

    <div class="hs__asks">
      <DsLabel>{{ content.asksLabel }}</DsLabel>
      <div class="hs__asks-row">
        <DsChip v-for="a in content.asks" :key="a.query" @click="ask(a.query)">{{ a.label }}</DsChip>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hs__title {
  margin: 14px 0;
}
.hs__lede {
  max-width: 50ch;
  margin: 0;
  color: var(--ds-muted);
  font-size: 18px;
  line-height: 1.6;
}
.hs__search {
  position: relative;
  margin-top: 26px;
  scroll-margin-top: 140px;
}
.hs__kbd {
  margin-right: 4px;
}
@media (max-width: 520px) {
  .hs__kbd {
    display: none;
  }
}
.hs__scope {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}
.hs__results {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  left: 0;
  z-index: 30;
  max-height: min(70vh, 520px);
  padding: 8px;
  overflow: auto;
  border: 2px solid var(--ds-ol);
  border-radius: 6px;
  background: var(--ds-surface);
  box-shadow: 5px 5px 0 var(--ds-sh);
}
.hs__group {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 4px;
  color: var(--ds-muted);
  font: 500 10.5px var(--ds-num);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.hs__item {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 8px;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
}
.hs__item.is-more {
  display: block;
}
.hs__item[aria-selected='true'] {
  border-color: var(--ds-ol);
  background: var(--ds-tint);
}
.hs__thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  overflow: hidden;
  border-radius: 3px;
  background: var(--ds-tint);
  color: var(--ds-link);
}
.hs__name {
  display: block;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
}
.hs__name mark {
  padding: 0 1px;
  border-radius: 2px;
  background: var(--ds-mark);
  color: inherit;
}
.hs__verified {
  color: var(--ds-link);
}
.hs__go {
  color: var(--ds-muted);
  font: 500 11px var(--ds-num);
}
.hs__more {
  color: var(--ds-link);
  font-size: 14px;
  font-weight: 700;
}
@media (max-width: 520px) {
  .hs__go {
    display: none;
  }
  .hs__item {
    grid-template-columns: 44px minmax(0, 1fr);
  }
}
.hs__none {
  margin: 0;
  padding: 16px;
  color: var(--ds-muted);
  font-size: 14.5px;
}
.hs__asks {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 22px;
}
.hs__asks-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
