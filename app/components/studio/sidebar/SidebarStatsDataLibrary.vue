<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { fetchPublicCatalog, fetchStatsDataEmbeddableBlocks, type EmbeddableBlockSummary } from '@/api/studio'
import type { CatalogItem } from '@/types/catalog'
import { BLOCK_META } from '@/types/studio'
import { freshnessLabel } from '@/lib/statsdata-freshness'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import StudioIcon from '../ui/StudioIcon.vue'

/**
 * Onglet « StatsData » du rail (articles) : parcourir les StatsData publiés et
 * reprendre l'un de leurs blocs → bloc `sd-embed` relié à sa source.
 * Clic = ajout après le bloc sélectionné ; glisser = dépôt dans le canevas
 * (`studio-block-type: sd-embed` + charge utile `studio-sd-embed`).
 */
const studio = useStudioStore()

const query = ref('')
const docs = ref<CatalogItem[]>([])
const loadingDocs = ref(false)
const picked = ref<CatalogItem | null>(null)

let token = 0
async function loadDocs() {
  const t = ++token
  loadingDocs.value = true
  try {
    const res = await fetchPublicCatalog({ type: 'statsdata', q: query.value.trim() || undefined, per_page: 12 })
    if (t !== token) return
    docs.value = res.data
    if (!picked.value && res.data[0]) picked.value = res.data[0]
  } catch {
    if (t === token) docs.value = []
  } finally {
    if (t === token) loadingDocs.value = false
  }
}
onMounted(loadDocs)
let debounce: ReturnType<typeof setTimeout> | null = null
watch(query, () => {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(loadDocs, 250)
})

const pickedSlug = computed(() => picked.value?.slug ?? '')
function onSelect(e: Event) {
  const slug = (e.target as HTMLSelectElement).value
  picked.value = docs.value.find((d) => d.slug === slug) ?? null
}

const blocks = ref<EmbeddableBlockSummary[]>([])
const loadingBlocks = ref(false)
const blocksError = ref<string | null>(null)
watch(
  pickedSlug,
  async (slug) => {
    blocks.value = []
    blocksError.value = null
    if (!slug) return
    loadingBlocks.value = true
    try {
      const res = await fetchStatsDataEmbeddableBlocks(slug)
      if (slug !== pickedSlug.value) return
      blocks.value = res.blocks
      if (!res.blocks.length) blocksError.value = 'Ce StatsData ne contient aucun bloc réutilisable.'
    } catch {
      blocksError.value = 'Impossible de charger les blocs de ce StatsData.'
    } finally {
      loadingBlocks.value = false
    }
  },
  { immediate: true },
)

function embedPayload(b: EmbeddableBlockSummary) {
  return {
    sourceSlug: pickedSlug.value,
    sourceDocTitle: picked.value?.title,
    sourceBlockId: b.id,
    sourceBlockType: b.type,
  }
}

function addEmbed(b: EmbeddableBlockSummary) {
  const block = studio.addBlockSmart('sd-embed')
  studio.updateBlockConfig(block.id, embedPayload(b))
}

function onDragStart(event: DragEvent, b: EmbeddableBlockSummary) {
  if (!event.dataTransfer) return
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('studio-block-type', 'sd-embed')
  event.dataTransfer.setData('studio-sd-embed', JSON.stringify(embedPayload(b)))
}

const freshness = computed(() => (picked.value?.freshness ? freshnessLabel(picked.value.freshness)?.text ?? null : null))
</script>

<template>
  <div class="flex h-full flex-col gap-4 overflow-y-auto px-4 pb-10">
    <label class="st-find">
      <span class="sr-only">Chercher un StatsData</span>
      <StudioIcon name="search" :size="16" />
      <input v-model="query" type="search" placeholder="Chercher un StatsData…" autocomplete="off" />
    </label>

    <div v-if="docs.length" class="flex flex-col gap-1.5">
      <label class="st-lbl" for="sd-pick">StatsData</label>
      <select id="sd-pick" class="studio-input" :value="pickedSlug" @change="onSelect">
        <option v-for="d in docs" :key="d.slug" :value="d.slug">{{ d.title }}</option>
      </select>
    </div>
    <p v-else-if="loadingDocs" class="st-hint">Chargement…</p>
    <p v-else class="st-hint">Aucun StatsData publié{{ query ? ` pour « ${query} »` : '' }}.</p>

    <div v-if="picked" class="st-card st-card--on">
      <span class="st-lbl flex items-center gap-1.5">
        <DsTypeGlyph kind="statsdata" :size="12" mono />
        {{ picked.publisher?.name }}
      </span>
      <b>{{ picked.title }}</b>
      <span v-if="freshness" class="st-fresh"><StudioIcon name="refresh" :size="12" />{{ freshness }}</span>
    </div>

    <template v-if="picked">
      <span class="st-lbl">{{ loadingBlocks ? 'Chargement des blocs…' : `${blocks.length} bloc${blocks.length > 1 ? 's' : ''} publié${blocks.length > 1 ? 's' : ''}` }}</span>
      <p v-if="blocksError" class="st-hint">{{ blocksError }}</p>
      <button
        v-for="b in blocks"
        :key="b.id"
        type="button"
        class="st-sdb"
        draggable="true"
        title="Ajouter ce bloc"
        @click="addEmbed(b)"
        @dragstart="onDragStart($event, b)"
      >
        <span class="st-tg st-tg--data"><StudioIcon :name="b.type" :size="20" /></span>
        <span class="min-w-0">
          <b class="truncate">{{ b.title || BLOCK_META[b.type]?.label }}</b>
          <span class="st-meta">{{ BLOCK_META[b.type]?.label }}<template v-if="b.datasetName"> · {{ b.datasetName }}</template></span>
        </span>
      </button>
    </template>
  </div>
</template>
