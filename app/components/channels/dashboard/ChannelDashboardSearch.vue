<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChannelDashboard } from '@/composables/useChannelDashboard'
import { useChannelContents } from '@/composables/useChannelContents'
import { useClickOutside } from '@/composables/useClickOutside'
import { CONTENT_TYPE_META } from '@/lib/content-display'

const route = useRoute()
const router = useRouter()
const channelId = computed(() => Number(route.params.id))
const { channel } = useChannelDashboard()
const { entries } = useChannelContents(channelId, channel)

const query = ref('')
const open = ref(false)
const root = ref<HTMLElement | null>(null)

useClickOutside(root, () => (open.value = false))

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return entries.value
    .filter((e) => e.item.title.toLowerCase().includes(q))
    .slice(0, 6)
    .map((e) => {
      const meta = CONTENT_TYPE_META[e.item.type ?? 'statsdata'] ?? CONTENT_TYPE_META.statsdata
      return {
        id: e.item.id,
        title: e.item.title,
        studioPath: e.manage!.studioPath,
        date: e.manage!.date,
        typeLabel: meta.label,
        typeBg: meta.bg,
        typeColor: meta.color,
      }
    })
})

function go(path: string) {
  query.value = ''
  open.value = false
  router.push(path)
}
</script>

<template>
  <div ref="root" class="relative min-w-0 flex-1 sm:max-w-[440px]">
    <div class="flex items-center gap-2.5 rounded-full border-[1.5px] border-slate-200 bg-white px-4 py-2 focus-within:border-primary/40">
      <span class="shrink-0 text-[13px] text-slate-400" aria-hidden="true">⌕</span>
      <input
        v-model="query"
        type="search"
        placeholder="Trouver un contenu de la chaîne"
        aria-label="Rechercher un contenu de la chaîne"
        class="min-w-0 flex-1 border-none bg-transparent text-[13px] text-slate-950 outline-none placeholder:text-slate-400"
        @focus="open = true"
      />
    </div>

    <Transition
      enter-active-class="transition duration-150 ease-out motion-reduce:transition-none"
      enter-from-class="translate-y-1 opacity-0"
      leave-active-class="transition duration-100 ease-in motion-reduce:transition-none"
      leave-to-class="translate-y-1 opacity-0"
    >
      <div
        v-if="open && query.trim()"
        class="absolute left-0 right-0 top-[calc(100%+8px)] z-[70] max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_18px_44px_rgba(18,18,26,0.18)]"
      >
        <p v-if="!results.length" class="px-3 py-4 text-center text-[12.5px] text-slate-400">
          Aucun contenu pour « {{ query }} ».
        </p>
        <button
          v-for="item in results"
          :key="item.id"
          type="button"
          class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
          @click="go(item.studioPath)"
        >
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-[9px] font-semibold"
            :style="{ background: item.typeBg, color: item.typeColor }"
          >
            {{ item.typeLabel.slice(0, 2) }}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[13px] font-semibold text-slate-950">{{ item.title }}</span>
            <span class="block truncate text-[11px] text-slate-400">{{ item.typeLabel }} · {{ item.date }}</span>
          </span>
        </button>
      </div>
    </Transition>
  </div>
</template>
