<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import { useResolvedTokenList } from '@/composables/useResolvedTokens'
import { sectionAnchorId } from '@/lib/slug'
import { stripInlineHtml, isBlankInlineHtml } from '@/lib/inline-rich-text'
import { sectorPath } from '@/lib/ds/pie'
import DsLabel from '@/components/ds/DsLabel.vue'
import type { Section } from '@/types/studio'

const studio = useStudioStore()

const docSlug = computed(() => studio.content?.slug ?? '')
const activePageId = computed(() => studio.currentPage?.id ?? null)
const isMultiPage = computed(() => studio.pages.length > 1)

/** Sections de premier niveau (hors zones de script) avec un titre, page par page. */
function pageSections(pageId: string): Section[] {
  return studio.sections.filter(
    (s: Section) => (s.pageId ?? 'default') === pageId && !s.zoneId && !isBlankInlineHtml(s.title),
  )
}

// Liste à plat de tous les titres de sections (toutes pages) pour la résolution des jetons.
const flatSections = computed(() => studio.pages.flatMap((p) => pageSections(p.id)))

const { list: resolvedTitles } = useResolvedTokenList({
  items: () => flatSections.value.map((s) => s.title ?? ''),
  tokenMap: () => studio.pageParams,
  datasetId: () => undefined,
  readonly: () => true,
  docSlug: () => studio.content?.slug,
})

function cleanLabel(raw: string, fallback?: string | null): string {
  const out = stripInlineHtml(raw)
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return (
    out ||
    stripInlineHtml(fallback)
      .replace(/\{\{[^}]*\}\}/g, '')
      .trim()
  )
}

interface TocEntry {
  id: string
  label: string
  num: string
  /** Tranche de progression (0–1) dans l'ensemble du document — camembert de l'entrée. */
  share: number
  /** Lien vers une autre page (`undefined` sur la page courante → ancre locale). */
  to?: string
}
interface TocPage {
  id: string
  title: string
  isActive: boolean
  to?: string
  entries: TocEntry[]
}

const tocPages = computed<TocPage[]>(() => {
  let flatIndex = 0
  let rank = 0
  const total = Math.max(1, flatSections.value.length)
  return studio.pages.map((page) => {
    const isActive = page.id === activePageId.value
    const pageHref = `/statsdata/${docSlug.value}/${page.slug ?? page.id}`
    const entries: TocEntry[] = pageSections(page.id)
      .map((s, i) => {
        const anchor = sectionAnchorId(s)
        const label = cleanLabel(resolvedTitles.value[flatIndex++] ?? '', s.title)
        rank++
        return {
          id: anchor ?? '',
          label,
          num: String(i + 1).padStart(2, '0'),
          share: rank / total,
          to: isActive || !anchor ? undefined : `${pageHref}#${anchor}`,
        }
      })
      .filter((e) => e.id && e.label)
    return {
      id: page.id,
      title: page.title,
      isActive,
      to: isActive ? undefined : pageHref,
      entries,
    }
  })
})

// Sections de la page courante — pour le scroll-spy et le rendu à plat mono-page.
const activeEntries = computed<TocEntry[]>(
  () => tocPages.value.find((p) => p.isActive)?.entries ?? [],
)

// Paramètres déclarés + valeur active choisie par le lecteur. Le libellé affiché
// est le placeholder du bloc recherche / le titre du bloc paramètre d'origine
// (à défaut : le libellé déclaré du paramètre, puis son nom technique).
const activeParams = computed(() =>
  (studio.currentPage?.params ?? [])
    .map((p) => {
      const block = p.searchBlockId
        ? studio.blocks.find((b) => b.id === p.searchBlockId)
        : p.paramBlockId
          ? studio.blocks.find((b) => b.id === p.paramBlockId)
          : undefined
      const blockLabel =
        block?.type === 'search'
          ? block.config.searchPlaceholder?.trim()
          : block?.config.title?.trim()
      return {
        key: p.name,
        label: blockLabel || p.label || p.name,
        value: studio.pageParams[p.name],
      }
    })
    .filter((p) => p.value),
)

const showToc = computed(
  () => isMultiPage.value || activeEntries.value.length >= 2 || activeParams.value.length > 0,
)

// ─── Scroll-spy (page courante uniquement) ───────────────────────────────────

const activeId = ref<string | null>(null)
let observer: IntersectionObserver | null = null

function observe() {
  observer?.disconnect()
  if (
    typeof window === 'undefined' ||
    typeof IntersectionObserver === 'undefined' ||
    !activeEntries.value.length
  )
    return
  observer = new IntersectionObserver(
    (records) => {
      const visible = records
        .filter((r) => r.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (visible) activeId.value = visible.target.id
    },
    { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
  )
  for (const e of activeEntries.value) {
    const el = document.getElementById(e.id)
    if (el) observer.observe(el)
  }
}

function goTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  history.replaceState(null, '', `#${id}`)
  activeId.value = id
}

onMounted(() => {
  observe()
  const hash = location.hash.slice(1)
  if (hash && activeEntries.value.some((e) => e.id === hash)) activeId.value = hash
})
watch(activeEntries, () => setTimeout(observe, 50))
onBeforeUnmount(() => observer?.disconnect())

/** Camembert de progression d'une entrée (viewBox 20). */
const piePath = (share: number) => sectorPath(10, 10, 8.5, -90, -90 + 360 * Math.min(1, share))
</script>

<template>
  <nav v-if="showToc" class="sdtoc" aria-label="Sommaire">
    <template v-if="isMultiPage || activeEntries.length >= 2">
      <DsLabel as="p" class="sdtoc__title">Sommaire</DsLabel>

      <div v-for="page in tocPages" :key="page.id" class="sdtoc__page">
        <!-- En-tête de page (masqué en mono-page) -->
        <component
          :is="page.to ? RouterLink : 'p'"
          v-if="isMultiPage"
          :to="page.to"
          class="sdtoc__grp"
          :class="{ 'is-on': page.isActive }"
        >
          <span class="sdtoc__wedge" aria-hidden="true" />
          <span class="truncate">{{ page.title }}</span>
        </component>

        <p v-if="isMultiPage && !page.entries.length" class="sdtoc__empty">Aucune section</p>

        <template v-for="e in page.entries" :key="page.id + e.id">
          <!-- Page courante : ancre locale + scroll-spy -->
          <a
            v-if="!e.to"
            :href="`#${e.id}`"
            class="sdtoc__a"
            :class="{ 'is-on': activeId === e.id }"
            :aria-current="activeId === e.id ? 'location' : undefined"
            @click.prevent="goTo(e.id)"
          >
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" class="sdtoc__pie">
              <circle cx="10" cy="10" r="8.5" />
              <path :d="piePath(e.share)" />
            </svg>
            <span class="sr-only">{{ e.num }}</span>
            <span class="truncate">{{ e.label }}</span>
          </a>
          <!-- Autre page : navigation -->
          <RouterLink v-else :to="e.to" class="sdtoc__a">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" class="sdtoc__pie">
              <circle cx="10" cy="10" r="8.5" />
              <path :d="piePath(e.share)" />
            </svg>
            <span class="sr-only">{{ e.num }}</span>
            <span class="truncate">{{ e.label }}</span>
          </RouterLink>
        </template>
      </div>
    </template>

    <div v-if="activeParams.length" class="sdtoc__params">
      <DsLabel as="p">Vos paramètres</DsLabel>
      <div v-for="p in activeParams" :key="p.key" class="sdtoc__param">
        <span class="truncate">{{ p.label }}</span>
        <b class="truncate">{{ p.value }}</b>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.sdtoc {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sdtoc__title {
  margin-bottom: 4px;
}
.sdtoc__page {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sdtoc__grp {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  color: var(--ds-muted);
  font: 500 10.5px/1.3 var(--ds-num);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
}
.sdtoc__page:first-of-type .sdtoc__grp {
  margin-top: 8px;
}
a.sdtoc__grp:hover,
.sdtoc__grp.is-on {
  color: var(--ds-text);
}
.sdtoc__wedge {
  display: inline-block;
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 100% 0 0 0;
  background: var(--ds-violet-500);
}
.sdtoc__grp:not(.is-on) .sdtoc__wedge {
  opacity: 0.45;
}
.sdtoc__empty {
  padding: 6px 8px;
  color: var(--ds-faint);
  font: italic 400 13px/1.3 var(--ds-ui);
}
.sdtoc__a {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border: 2px solid transparent;
  border-radius: 3px;
  color: var(--ds-muted);
  font: 500 14px/1.3 var(--ds-ui);
  text-decoration: none;
  transition: color 0.15s;
}
.sdtoc__a:hover {
  color: var(--ds-text);
}
.sdtoc__a.is-on {
  border-color: var(--ds-ol);
  background: var(--ds-surface);
  color: var(--ds-text);
  font-weight: 700;
}
.sdtoc__pie {
  flex: none;
}
.sdtoc__pie circle {
  fill: none;
  stroke: var(--ds-ol);
  stroke-width: 1.5;
}
.sdtoc__pie path {
  fill: var(--ds-violet-500);
}
.sdtoc__params {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 18px;
  padding: 12px;
  border: 2px dashed var(--ds-divide);
  border-radius: 6px;
}
.sdtoc__param {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
  color: var(--ds-faint);
  font: 600 11.5px/1.3 var(--ds-ui);
}
.sdtoc__param b {
  color: var(--ds-link);
  font: 700 14px/1.3 var(--ds-ui);
}
</style>
