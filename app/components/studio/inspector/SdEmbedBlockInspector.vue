<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import {
  fetchPublicCatalog,
  fetchPublicStatsDataBlock,
  fetchStatsDataEmbeddableBlocks,
  type EmbeddableBlockSummary,
} from '@/api/studio'
import type { CatalogItem } from '@/types/catalog'
import { BLOCK_META, type BlockConfig, type PageParam, type StudioBlock } from '@/types/studio'
import InspectorSection from '@/components/studio/fields/InspectorSection.vue'
import FieldToggle from '@/components/studio/fields/FieldToggle.vue'

const props = defineProps<{ block: StudioBlock }>()
const studio = useStudioStore()

function set<K extends keyof BlockConfig>(key: K, value: BlockConfig[K]) {
  studio.updateBlockConfig(props.block.id, { [key]: value })
}

const sourceSlug = computed(() => props.block.config.sourceSlug ?? '')
const sourceBlockId = computed(() => props.block.config.sourceBlockId ?? '')

// ─── Étape 1 : choisir le Statsdata ──────────────────────────────────────────
const query = ref('')
const results = ref<CatalogItem[]>([])
const searching = ref(false)

let searchToken = 0
watch(query, async (q) => {
  const token = ++searchToken
  if (!q.trim()) {
    results.value = []
    return
  }
  searching.value = true
  try {
    const res = await fetchPublicCatalog({ type: 'statsdata', q: q.trim(), per_page: 8 })
    if (token === searchToken) results.value = res.data
  } catch {
    if (token === searchToken) results.value = []
  } finally {
    if (token === searchToken) searching.value = false
  }
})

function pickDoc(item: CatalogItem) {
  studio.updateBlockConfig(props.block.id, {
    sourceSlug: item.slug,
    sourceDocTitle: item.title,
    sourceBlockId: undefined,
    sourceBlockType: undefined,
  })
  query.value = ''
  results.value = []
}

function changeDoc() {
  studio.updateBlockConfig(props.block.id, {
    sourceSlug: undefined,
    sourceDocTitle: undefined,
    sourceBlockId: undefined,
    sourceBlockType: undefined,
  })
}

// ─── Étape 2 : choisir le bloc ───────────────────────────────────────────────
const blocks = ref<EmbeddableBlockSummary[]>([])
const loadingBlocks = ref(false)
const blocksError = ref<string | null>(null)

watch(
  sourceSlug,
  async (slug) => {
    blocks.value = []
    blocksError.value = null
    if (!slug) return
    loadingBlocks.value = true
    try {
      const res = await fetchStatsDataEmbeddableBlocks(slug)
      blocks.value = res.blocks
      if (!res.blocks.length) blocksError.value = 'Ce Statsdata ne contient aucun bloc réutilisable.'
    } catch {
      blocksError.value = 'Impossible de charger les blocs de ce Statsdata.'
    } finally {
      loadingBlocks.value = false
    }
  },
  { immediate: true },
)

function pickBlock(b: EmbeddableBlockSummary) {
  studio.updateBlockConfig(props.block.id, { sourceBlockId: b.id, sourceBlockType: b.type })
}

// ─── Étape 3 : paramètres de la page source (filtres/expressions du bloc) ─────
const sourceParams = ref<PageParam[]>([])

watch(
  [sourceSlug, sourceBlockId],
  async ([slug, blockId]) => {
    sourceParams.value = []
    if (!slug || !blockId) return
    try {
      const res = await fetchPublicStatsDataBlock(slug, blockId)
      sourceParams.value = (res.params ?? []).filter((p) => p.name)
    } catch {
      /* silencieux */
    }
  },
  { immediate: true },
)

function paramValue(name: string, fallback?: string): string {
  return props.block.config.sourceParams?.[name] ?? fallback ?? ''
}
function setParam(name: string, value: string) {
  const next = { ...props.block.config.sourceParams }
  if (value) next[name] = value
  else delete next[name]
  studio.updateBlockConfig(props.block.id, { sourceParams: next })
}
</script>

<template>
  <div class="flex flex-col gap-5 px-4 py-4">
    <!-- Étape 1 -->
    <InspectorSection label="Statsdata source">
      <template v-if="!sourceSlug">
        <input
          v-model="query"
          type="search"
          class="studio-input"
          placeholder="Rechercher un Statsdata publié…"
        />
        <p v-if="searching" class="mt-2 text-[12px] text-[var(--studio-faint)]">Recherche…</p>
        <div v-else-if="results.length" class="mt-2 flex flex-col gap-1.5">
          <button
            v-for="item in results"
            :key="item.slug"
            type="button"
            class="flex flex-col items-start rounded-[10px] border-[1.5px] border-[var(--studio-line)] bg-white px-3 py-2 text-left transition-colors hover:border-[var(--color-primary)]"
            @click="pickDoc(item)"
          >
            <span class="text-[13px] font-bold text-[var(--studio-ink)]">{{ item.title }}</span>
            <span class="text-[11.5px] text-[var(--studio-faint)]">
              {{ item.publisher.name }} · {{ item.charts_count }} graphique(s)
            </span>
          </button>
        </div>
        <p v-else-if="query.trim()" class="mt-2 text-[12px] text-[var(--studio-faint)]">Aucun résultat.</p>
      </template>

      <div v-else class="flex items-center justify-between gap-2 rounded-[10px] bg-[var(--studio-wash)] px-3 py-2">
        <span class="min-w-0 truncate text-[13px] font-bold text-[var(--studio-ink)]">
          {{ block.config.sourceDocTitle || sourceSlug }}
        </span>
        <button type="button" class="shrink-0 text-[12px] font-bold text-[var(--color-primary)]" @click="changeDoc">
          Changer
        </button>
      </div>
    </InspectorSection>

    <!-- Étape 2 -->
    <InspectorSection v-if="sourceSlug" label="Bloc réutilisé">
      <p v-if="loadingBlocks" class="text-[12px] text-[var(--studio-faint)]">Chargement…</p>
      <p v-else-if="blocksError" class="text-[12px] text-[var(--studio-muted)]">{{ blocksError }}</p>
      <div v-else class="flex flex-col gap-1.5">
        <button
          v-for="b in blocks"
          :key="b.id"
          type="button"
          class="flex items-center gap-2.5 rounded-[10px] border-[1.5px] px-3 py-2 text-left transition-colors"
          :class="b.id === sourceBlockId
            ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)]'
            : 'border-[var(--studio-line)] bg-white hover:border-[var(--color-primary)]'"
          @click="pickBlock(b)"
        >
          <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]" :class="BLOCK_META[b.type].tint">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
              <path stroke-linecap="round" stroke-linejoin="round" :d="BLOCK_META[b.type].iconPath" />
            </svg>
          </span>
          <span class="min-w-0">
            <span class="block truncate text-[13px] font-bold text-[var(--studio-ink)]">{{ b.title }}</span>
            <span class="block truncate text-[11.5px] text-[var(--studio-faint)]">
              {{ BLOCK_META[b.type].label }}<template v-if="b.datasetName"> · {{ b.datasetName }}</template>
            </span>
          </span>
        </button>
      </div>
    </InspectorSection>

    <InspectorSection v-if="sourceBlockId && sourceParams.length" label="Paramètres du bloc source">
      <p class="mb-1 text-[11.5px] leading-[1.45] text-[var(--studio-faint)]">
        Ce bloc dépend de paramètres de son Statsdata. Sans valeur, la valeur par défaut de la source est utilisée.
      </p>
      <label v-for="p in sourceParams" :key="p.name" class="block">
        <span class="mb-[6px] block text-[12.5px] font-bold text-[var(--studio-ink)]">{{ p.label || p.name }}</span>
        <input
          class="studio-input"
          :value="paramValue(p.name)"
          :placeholder="p.defaultValue ? `Défaut : ${p.defaultValue}` : 'Toutes les valeurs'"
          @input="setParam(p.name, ($event.target as HTMLInputElement).value)"
        />
      </label>
    </InspectorSection>

    <InspectorSection v-if="sourceBlockId" label="Affichage">
      <FieldToggle
        :model-value="block.config.showSourceLink !== false"
        label="Lien « Ouvrir le Statsdata complet »"
        @update:model-value="set('showSourceLink', $event)"
      />
    </InspectorSection>
  </div>
</template>
