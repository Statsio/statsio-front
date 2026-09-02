<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useResolvedTokenList } from '@/composables/useResolvedTokens'
import { sectionAnchorId } from '@/lib/slug'
import { stripInlineHtml, isBlankInlineHtml } from '@/lib/inline-rich-text'
import type { Section } from '@/types/studio'

const studio = useStudioStore()

const sections = computed<Section[]>(() =>
  studio.currentPageSections.filter((s) => !isBlankInlineHtml(s.title)),
)

const { list: titles } = useResolvedTokenList({
  items: () => sections.value.map((s) => s.title ?? ''),
  tokenMap: () => studio.pageParams,
  datasetId: () => undefined,
  readonly: () => true,
  docSlug: () => studio.content?.slug,
})

const entries = computed(() =>
  sections.value.map((s, i) => ({
    id: sectionAnchorId(s)!,
    label: stripInlineHtml(titles.value[i]) || stripInlineHtml(s.title),
    num: String(i + 1).padStart(2, '0'),
  })),
)

// Paramètres déclarés + valeur active (ligne « affiché dans toute la page »).
const activeParams = computed(() =>
  (studio.currentPage?.params ?? [])
    .map((p) => ({ name: p.label || p.name, value: studio.pageParams[p.name] }))
    .filter((p) => p.value),
)

// ─── Scroll-spy ──────────────────────────────────────────────────────────────

const activeId = ref<string | null>(null)
let observer: IntersectionObserver | null = null

function observe() {
  observer?.disconnect()
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined' || !entries.value.length) return
  observer = new IntersectionObserver(
    (records) => {
      const visible = records
        .filter((r) => r.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (visible) activeId.value = visible.target.id
    },
    { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
  )
  for (const e of entries.value) {
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
  if (hash && entries.value.some((e) => e.id === hash)) activeId.value = hash
})
watch(entries, () => setTimeout(observe, 50))
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <nav v-if="entries.length >= 2" class="hidden lg:block">
    <p class="mb-3 text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-[var(--studio-faint)]">Sommaire</p>
    <div class="flex flex-col gap-px">
      <a
        v-for="e in entries"
        :key="e.id"
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
