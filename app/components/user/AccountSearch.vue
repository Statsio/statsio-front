<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useClickOutside } from '@/composables/useClickOutside'
import { useAccountSearch } from '@/composables/useAccountSearch'
import { toDisplayAccountContent } from '@/lib/account-content'
import type { AccountContentSummary } from '@/types/account'

const router = useRouter()
const root = ref<HTMLElement | null>(null)
const { query, results, loading, open, reset } = useAccountSearch()

useClickOutside(root, () => (open.value = false))

const SECTIONS = [
  { key: 'contents', label: 'Mes contenus' },
  { key: 'favorites', label: 'Favoris' },
  { key: 'history', label: 'Historique' },
] as const

function go(item: AccountContentSummary) {
  const display = toDisplayAccountContent(item)
  reset()
  if (display.publicPath) router.push(display.publicPath)
}

const hasResults = () =>
  results.value.contents.length + results.value.favorites.length + results.value.history.length > 0
</script>

<template>
  <div ref="root" class="relative min-w-0 flex-1 sm:max-w-[420px]">
    <div class="flex items-center gap-2.5 rounded-full border-[1.5px] border-slate-200 bg-white px-4 py-2 focus-within:border-primary/40">
      <span class="shrink-0 text-[13px] text-slate-400" aria-hidden="true">⌕</span>
      <input
        v-model="query"
        type="search"
        placeholder="Chercher dans vos favoris, votre historique…"
        aria-label="Rechercher dans votre espace"
        class="min-w-0 flex-1 border-none bg-transparent text-[13px] text-slate-950 outline-none placeholder:text-slate-400"
        @focus="open = query.trim().length > 0"
      />
    </div>

    <Transition
      enter-active-class="transition duration-150 ease-out motion-reduce:transition-none"
      enter-from-class="translate-y-1 opacity-0"
      leave-active-class="transition duration-100 ease-in motion-reduce:transition-none"
      leave-to-class="translate-y-1 opacity-0"
    >
      <div
        v-if="open"
        class="absolute left-0 right-0 top-[calc(100%+8px)] z-[70] max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_18px_44px_rgba(18,18,26,0.18)]"
      >
        <p v-if="loading" class="px-3 py-4 text-center text-[12.5px] text-slate-400">Recherche…</p>
        <p v-else-if="!hasResults()" class="px-3 py-4 text-center text-[12.5px] text-slate-400">
          Aucun résultat pour « {{ query }} ».
        </p>
        <template v-else>
          <template v-for="section in SECTIONS" :key="section.key">
            <div v-if="results[section.key].length" class="mb-1 last:mb-0">
              <p class="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-400">
                {{ section.label }}
              </p>
              <button
                v-for="item in results[section.key]"
                :key="section.key + item.id"
                type="button"
                class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
                @click="go(item)"
              >
                <span
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-[9px] font-semibold"
                  :style="{
                    background: toDisplayAccountContent(item).typeBg,
                    color: toDisplayAccountContent(item).typeColor,
                  }"
                >
                  {{ toDisplayAccountContent(item).typeLabel.slice(0, 2) }}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-[13px] font-semibold text-slate-950">{{ item.title }}</span>
                  <span class="block truncate text-[11px] text-slate-400">
                    {{ item.channel?.name ?? item.author?.name }}
                  </span>
                </span>
              </button>
            </div>
          </template>
        </template>
      </div>
    </Transition>
  </div>
</template>
