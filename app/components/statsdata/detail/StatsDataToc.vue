<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import { useResolvedTokenList } from '@/composables/useResolvedTokens'
import { sectionAnchorId } from '@/lib/slug'
import { stripInlineHtml, isBlankInlineHtml } from '@/lib/inline-rich-text'
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
const flatSections = computed(() =>
  studio.pages.flatMap((p) => pageSections(p.id)),
)

const { list: resolvedTitles } = useResolvedTokenList({
  items: () => flatSections.value.map((s) => s.title ?? ''),
  tokenMap: () => studio.pageParams,
  datasetId: () => undefined,
  readonly: () => true,
  docSlug: () => studio.content?.slug,
})

function cleanLabel(raw: string, fallback?: string | null): string {
  const out = raw.replace(/\{\{[^}]*\}\}/g, '').replace(/\s+/g, ' ').trim()
  return out || stripInlineHtml(fallback).replace(/\{\{[^}]*\}\}/g, '').trim()
}

interface TocEntry {
  id: string
  label: string
  num: string
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
  return studio.pages.map((page) => {
    const isActive = page.id === activePageId.value
    const pageHref = `/statsdata/${docSlug.value}/${page.slug ?? page.id}`
    const entries: TocEntry[] = pageSections(page.id).map((s, i) => {
      const anchor = sectionAnchorId(s)
      const label = cleanLabel(resolvedTitles.value[flatIndex++] ?? '', s.title)
      return {
        id: anchor ?? '',
        label,
        num: String(i + 1).padStart(2, '0'),
        to: isActive || !anchor ? undefined : `${pageHref}#${anchor}`,
      }
    }).filter((e) => e.id && e.label)
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

const showToc = computed(() => isMultiPage.value || activeEntries.value.length >= 2)

// Paramètres déclarés + valeur active (ligne « affiché dans toute la page »).
const activeParams = computed(() =>
  (studio.currentPage?.params ?? [])
    .map((p) => ({ name: p.label || p.name, value: studio.pageParams[p.name] }))
    .filter((p) => p.value),
)

// ─── Scroll-spy (page courante uniquement) ───────────────────────────────────

const activeId = ref<string | null>(null)
let observer: IntersectionObserver | null = null

function observe() {
  observer?.disconnect()
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined' || !activeEntries.value.length) return
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
</script>

<template>
  <nav v-if="showToc" class="hidden lg:block">
    <p class="mb-3 text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-[var(--studio-faint)]">Sommaire</p>

    <div class="flex flex-col gap-4">
      <div v-for="page in tocPages" :key="page.id" class="flex flex-col gap-px">
        <!-- En-tête de page (masqué en mono-page) -->
        <component
          :is="page.to ? RouterLink : 'p'"
          v-if="isMultiPage"
          :to="page.to"
          class="mb-1 flex items-center gap-1.5 px-2.5 text-[10px] font-extrabold uppercase tracking-[0.08em] transition-colors"
          :class="page.isActive
            ? 'text-[var(--studio-ink)]'
            : 'text-[var(--studio-faint)] hover:text-[var(--studio-ink)]'"
        >
          <span
            class="h-1.5 w-1.5 shrink-0 rounded-full"
            :class="page.isActive ? 'bg-[var(--color-primary)]' : 'bg-[var(--studio-line-strong)]'"
          />
          <span class="truncate">{{ page.title }}</span>
        </component>

        <p
          v-if="isMultiPage && !page.entries.length"
          class="px-2.5 py-[7px] text-[12px] italic text-[var(--studio-faint)]"
        >
          Aucune section
        </p>

        <template v-for="e in page.entries" :key="page.id + e.id">
          <!-- Page courante : ancre locale + scroll-spy -->
          <a
            v-if="!e.to"
            :href="`#${e.id}`"
            class="flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[12.5px] font-semibold transition-colors"
            :class="activeId === e.id
              ? 'bg-[var(--studio-tag)] text-[var(--studio-tag-ink)]'
              : 'text-[var(--studio-muted)] hover:bg-white hover:text-[var(--studio-ink)]'"
            @click.prevent="goTo(e.id)"
          >
            <span class="mono shrink-0 text-[9.5px]" :class="activeId === e.id ? 'text-[var(--studio-tag-ink)]/70' : 'text-[var(--studio-faint)]'">{{ e.num }}</span>
            <span class="truncate">{{ e.label }}</span>
          </a>
          <!-- Autre page : navigation -->
          <RouterLink
            v-else
            :to="e.to"
            class="flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[12.5px] font-semibold text-[var(--studio-muted)] transition-colors hover:bg-white hover:text-[var(--studio-ink)]"
          >
            <span class="mono shrink-0 text-[9.5px] text-[var(--studio-faint)]">{{ e.num }}</span>
            <span class="truncate">{{ e.label }}</span>
          </RouterLink>
        </template>
      </div>
    </div>

    <div
      v-if="activeParams.length"
      class="mt-[18px] rounded-xl border-[1.5px] border-dashed border-[var(--studio-line-strong)] px-3 py-[13px] text-[11.5px] leading-[1.5] text-[var(--studio-faint)]"
    >
      <template v-for="(p, i) in activeParams" :key="p.name">
        <span v-if="i > 0"> · </span>{{ p.name }} affiché dans la page : <b class="text-[var(--studio-tag-ink)]">{{ p.value }}</b>
      </template>
    </div>
  </nav>
</template>
