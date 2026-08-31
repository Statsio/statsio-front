<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { fetchContentMentions, type ContentMention } from '@/api/studio'

const props = defineProps<{ query: string }>()
const emit = defineEmits<{ select: [ContentMention]; close: [] }>()

const results = ref<ContentMention[]>([])
const loading = ref(false)
const activeIndex = ref(0)

const TYPE_LABEL: Record<string, string> = { article: 'Article', statsdata: 'Statsdata', survey: 'Sondage' }

let token = 0
let debounce: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.query,
  (q) => {
    const current = ++token
    activeIndex.value = 0
    if (debounce) clearTimeout(debounce)
    if (q.trim().length < 2) {
      results.value = []
      loading.value = false
      return
    }
    loading.value = true
    debounce = setTimeout(async () => {
      try {
        const rows = await fetchContentMentions(q.trim())
        if (current === token) results.value = rows
      } catch {
        if (current === token) results.value = []
      } finally {
        if (current === token) loading.value = false
      }
    }, 200)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (debounce) clearTimeout(debounce)
})

function moveDown() {
  if (results.value.length) activeIndex.value = (activeIndex.value + 1) % results.value.length
}
function moveUp() {
  if (results.value.length) activeIndex.value = (activeIndex.value - 1 + results.value.length) % results.value.length
}
function selectActive() {
  const item = results.value[activeIndex.value]
  if (item) emit('select', item)
}

defineExpose({ moveDown, moveUp, selectActive, hasResults: () => results.value.length > 0 })
</script>

<template>
  <div
    class="absolute bottom-full left-3 right-3 z-50 mb-1 max-h-64 overflow-y-auto rounded-xl border border-[var(--studio-line-strong)] bg-white py-1 shadow-lg"
  >
    <p class="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--studio-faint)]">
      Référencer un contenu
    </p>

    <p v-if="loading" class="px-3 py-2 text-[13px] text-[var(--studio-faint)]">Recherche…</p>
    <p v-else-if="query.trim().length < 2" class="px-3 py-2 text-[13px] text-[var(--studio-faint)]">
      Tapez au moins 2 caractères après «&nbsp;@&nbsp;».
    </p>
    <p v-else-if="!results.length" class="px-3 py-2 text-[13px] text-[var(--studio-faint)]">
      Aucun contenu publié pour «&nbsp;{{ query }}&nbsp;».
    </p>

    <button
      v-for="(item, i) in results"
      :key="`${item.type}:${item.slug}`"
      type="button"
      class="flex w-full items-center gap-2.5 px-3 py-2 text-left"
      :class="i === activeIndex ? 'bg-[var(--studio-accent-wash)]' : 'hover:bg-slate-50'"
      @mouseenter="activeIndex = i"
      @mousedown.prevent="emit('select', item)"
    >
      <span class="mono shrink-0 rounded-[4px] bg-[var(--studio-tag)] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[var(--studio-tag-ink)]">
        {{ TYPE_LABEL[item.type] ?? item.type }}
      </span>
      <span class="min-w-0">
        <span class="block truncate text-[13px] font-semibold text-slate-800">{{ item.title }}</span>
        <span class="block truncate text-[11px] text-slate-400">{{ item.publisher.name }}</span>
      </span>
    </button>
  </div>
</template>
