<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { useGlobalSearch } from '@/composables/useGlobalSearch'
import { CONTENT_TYPE_META, publicContentListPath, publicContentPath } from '@/lib/content-display'
import type { CatalogItem } from '@/types/catalog'
import type { GlobalSearchChannel } from '@/types/search'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()

const router = useRouter()
const basePath = useContentBasePath()
const {
  query,
  nonEmptyGroups,
  hasResults,
  canSearch,
  loading,
  error,
  recent,
  rememberQuery,
  clearRecent,
  reset,
} = useGlobalSearch()

const inputRef = ref<HTMLInputElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const activeIndex = ref(-1)
let previouslyFocused: HTMLElement | null = null

type DisplayRow =
  | { kind: 'header'; key: string; label: string; total: number }
  | { kind: 'content'; key: string; navIndex: number; to: string; item: CatalogItem; type: 'article' | 'statsdata' | 'survey' }
  | { kind: 'channel'; key: string; navIndex: number; to: string; channel: GlobalSearchChannel }
  | { kind: 'more'; key: string; navIndex: number; to: string; label: string; total: number }

/** Lignes affichées (en-têtes compris) + index de navigation clavier sur les lignes actionnables. */
const displayRows = computed<DisplayRow[]>(() => {
  const rows: DisplayRow[] = []
  const q = encodeURIComponent(query.value.trim())
  let navIndex = 0

  for (const group of nonEmptyGroups.value) {
    rows.push({ kind: 'header', key: `h:${group.type}`, label: group.label, total: group.total })

    if (group.type === 'channel') {
      for (const channel of group.items) {
        rows.push({
          kind: 'channel',
          key: `c:${channel.id}`,
          navIndex: navIndex++,
          to: channel.handle ? `/channels/${encodeURIComponent(channel.handle)}` : '/chaines',
          channel,
        })
      }
      if (group.total > group.items.length) {
        rows.push({ kind: 'more', key: `m:${group.type}`, navIndex: navIndex++, to: `/chaines?q=${q}`, label: group.label, total: group.total })
      }
      continue
    }

    for (const item of group.items) {
      rows.push({
        kind: 'content',
        key: `${group.type}:${item.id}`,
        navIndex: navIndex++,
        to: publicContentPath(group.type, item.slug, basePath.value),
        item,
        type: group.type,
      })
    }
    if (group.total > group.items.length) {
      rows.push({
        kind: 'more',
        key: `m:${group.type}`,
        navIndex: navIndex++,
        to: `${publicContentListPath(group.type, basePath.value)}?q=${q}`,
        label: group.label,
        total: group.total,
      })
    }
  }
  return rows
})

const navRows = computed(() => displayRows.value.filter((r): r is Exclude<DisplayRow, { kind: 'header' }> => r.kind !== 'header'))
const showRecent = computed(() => !canSearch.value && recent.value.length > 0)

function contentMeta(type: 'article' | 'statsdata' | 'survey') {
  return CONTENT_TYPE_META[type] ?? { label: type, color: '#64748b', bg: '#f1f5f9' }
}

function channelInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?'
  )
}

function formatFollowers(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1).replace('.0', '')} k`
  return String(count)
}

function close() {
  emit('update:open', false)
}

function navigate(to: string) {
  rememberQuery(query.value)
  void router.push(to)
  close()
}

function onSubmit() {
  const active = navRows.value.find((r) => r.navIndex === activeIndex.value)
  if (active) {
    navigate(active.to)
    return
  }
  const q = query.value.trim()
  if (q.length < 2) return
  navigate(`${publicContentListPath('article', basePath.value)}?q=${encodeURIComponent(q)}`)
}

function move(delta: number) {
  const len = navRows.value.length
  if (len === 0) {
    activeIndex.value = -1
    return
  }
  const next = activeIndex.value + delta
  activeIndex.value = next < 0 ? len - 1 : next >= len ? 0 : next
  nextTick(() => {
    panelRef.value
      ?.querySelector<HTMLElement>(`[data-nav="${activeIndex.value}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  })
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    move(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    move(-1)
  } else if (event.key === 'Tab') {
    event.preventDefault()
    inputRef.value?.focus()
  }
}

watch(
  () => navRows.value.length,
  () => {
    activeIndex.value = -1
  },
)

watch(
  () => props.open,
  async (isOpen) => {
    if (typeof document === 'undefined') return
    if (isOpen) {
      previouslyFocused = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      inputRef.value?.focus()
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeydown)
      reset()
      activeIndex.value = -1
      previouslyFocused?.focus?.()
      previouslyFocused = null
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out motion-reduce:transition-none"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-100 ease-in motion-reduce:transition-none"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[60] flex items-start justify-center bg-slate-950/40 px-4 pt-[8vh] backdrop-blur-[2px] sm:pt-[12vh]"
        @click.self="close"
      >
        <Transition
          enter-active-class="transition duration-150 ease-out motion-reduce:transition-none"
          enter-from-class="opacity-0 -translate-y-2"
          leave-active-class="transition duration-100 ease-in motion-reduce:transition-none"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div
            v-if="open"
            ref="panelRef"
            role="dialog"
            aria-modal="true"
            aria-label="Recherche"
            class="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_40px_120px_-40px_rgba(15,23,42,0.5)]"
          >
            <!-- Champ -->
            <div class="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5">
              <svg viewBox="0 0 20 20" class="h-[18px] w-[18px] shrink-0 text-slate-400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="9" cy="9" r="5.25" stroke="currentColor" stroke-width="1.7" />
                <path d="M13 13L17 17" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
              </svg>
              <input
                ref="inputRef"
                v-model="query"
                type="search"
                enterkeyhint="search"
                autocomplete="off"
                spellcheck="false"
                placeholder="Rechercher un article, un StatsData, un sondage, une chaîne…"
                aria-label="Rechercher sur Statsio"
                class="w-full min-w-0 border-none bg-transparent text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                @keydown.enter.prevent="onSubmit"
              />
              <svg
                v-if="loading"
                class="h-4 w-4 shrink-0 animate-spin text-slate-300 motion-reduce:hidden"
                viewBox="0 0 24 24" fill="none" aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" class="opacity-25" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              </svg>
              <kbd class="hidden shrink-0 rounded-md border border-slate-200 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-400 sm:block">
                Échap
              </kbd>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <!-- Historique -->
              <div v-if="showRecent" class="p-3">
                <div class="flex items-center justify-between px-2 pb-2">
                  <span class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Recherches récentes</span>
                  <button type="button" class="text-[11px] font-semibold text-slate-400 transition hover:text-slate-600" @click="clearRecent">
                    Effacer
                  </button>
                </div>
                <div class="flex flex-wrap gap-1.5 px-2">
                  <button
                    v-for="term in recent"
                    :key="term"
                    type="button"
                    class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[13px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                    @click="query = term"
                  >
                    {{ term }}
                  </button>
                </div>
              </div>

              <!-- Invite -->
              <p v-else-if="!canSearch" class="px-5 py-10 text-center text-[13px] text-slate-400">
                Tapez au moins 2 caractères pour lancer la recherche.
              </p>

              <!-- Erreur -->
              <p v-else-if="error" class="px-5 py-10 text-center text-[13px] text-rose-500">
                La recherche est momentanément indisponible. Réessayez dans un instant.
              </p>

              <!-- Vide -->
              <p v-else-if="!loading && !hasResults" class="px-5 py-10 text-center text-[13px] text-slate-400">
                Aucun résultat pour «&nbsp;<span class="font-semibold text-slate-600">{{ query.trim() }}</span>&nbsp;».
              </p>

              <!-- Résultats -->
              <div v-else-if="hasResults" class="py-2">
                <template v-for="row in displayRows" :key="row.key">
                  <div v-if="row.kind === 'header'" class="flex items-center gap-2 px-5 pb-1.5 pt-3 first:pt-1">
                    <span class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{{ row.label }}</span>
                    <span class="font-mono text-[10.5px] text-slate-300">{{ row.total }}</span>
                  </div>

                  <button
                    v-else-if="row.kind === 'content'"
                    type="button"
                    :data-nav="row.navIndex"
                    class="mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-xl px-3 py-2 text-left transition"
                    :class="activeIndex === row.navIndex ? 'bg-slate-100' : 'hover:bg-slate-50'"
                    @click="navigate(row.to)"
                    @mousemove="activeIndex = row.navIndex"
                  >
                    <span
                      class="shrink-0 rounded-md px-1.5 py-1 font-mono text-[8.5px] font-semibold uppercase tracking-[0.06em]"
                      :style="{ color: contentMeta(row.type).color, background: contentMeta(row.type).bg }"
                    >
                      {{ contentMeta(row.type).label }}
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-[13.5px] font-semibold text-slate-900">{{ row.item.title }}</span>
                      <span class="block truncate text-[11.5px] text-slate-400">
                        {{ row.item.publisher.name }}<span v-if="row.item.category"> · {{ row.item.category }}</span>
                      </span>
                    </span>
                  </button>

                  <button
                    v-else-if="row.kind === 'channel'"
                    type="button"
                    :data-nav="row.navIndex"
                    class="mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-xl px-3 py-2 text-left transition"
                    :class="activeIndex === row.navIndex ? 'bg-slate-100' : 'hover:bg-slate-50'"
                    @click="navigate(row.to)"
                    @mousemove="activeIndex = row.navIndex"
                  >
                    <span class="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-[12px] font-bold text-white">
                      <img v-if="row.channel.logo_url" :src="row.channel.logo_url" :alt="row.channel.name" class="h-full w-full object-cover" />
                      <span v-else>{{ channelInitials(row.channel.name) }}</span>
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="flex items-center gap-1.5">
                        <span class="truncate text-[13.5px] font-semibold text-slate-900">{{ row.channel.name }}</span>
                        <svg v-if="row.channel.verified" class="h-3.5 w-3.5 shrink-0 text-blue-500" viewBox="0 0 20 20" fill="currentColor" aria-label="Vérifiée">
                          <path fill-rule="evenodd" d="M10 1.5l2.2 1.6 2.7-.2 1 2.5 2.3 1.4-.7 2.6.7 2.6-2.3 1.4-1 2.5-2.7-.2L10 18.5l-2.2-1.6-2.7.2-1-2.5L1.8 13l.7-2.6L1.8 7.8 4.1 6.4l1-2.5 2.7.2L10 1.5zm3.5 6.2l-1.1-1.1-3.2 3.2-1.6-1.6-1.1 1.1 2.7 2.7 4.3-4.3z" clip-rule="evenodd" />
                        </svg>
                      </span>
                      <span class="block truncate font-mono text-[11px] text-slate-400">
                        <span v-if="row.channel.handle">@{{ row.channel.handle }} · </span>{{ formatFollowers(row.channel.followers_count) }} abonnés
                      </span>
                    </span>
                  </button>

                  <button
                    v-else
                    type="button"
                    :data-nav="row.navIndex"
                    class="mx-2 block w-[calc(100%-1rem)] rounded-xl px-3 py-2 text-left text-[12.5px] font-semibold text-primary transition"
                    :class="activeIndex === row.navIndex ? 'bg-slate-100' : 'hover:bg-slate-50'"
                    @click="navigate(row.to)"
                    @mousemove="activeIndex = row.navIndex"
                  >
                    Voir les {{ row.total }} résultats dans {{ row.label }} →
                  </button>
                </template>
              </div>
            </div>

            <div class="hidden items-center gap-4 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400 sm:flex">
              <span><kbd class="font-mono">↑</kbd> <kbd class="font-mono">↓</kbd> naviguer</span>
              <span><kbd class="font-mono">↵</kbd> ouvrir</span>
              <span><kbd class="font-mono">Échap</kbd> fermer</span>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
