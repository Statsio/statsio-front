<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { fetchColumnFacets } from '@/api/studio'
import { blockSourceParams } from '@/composables/useBlockData'
import { columnRefLabel } from '@/lib/studio-columns'
import { BLOCK_FILTER_OPERATORS, type BlockFilter, type ColumnFacet, type StudioBlock } from '@/types/studio'
import { useFilterDrillIn } from '@/composables/useFilterDrillIn'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import VariableButton from '@/components/studio/fields/VariableButton.vue'
import FieldNote from '@/components/studio/fields/FieldNote.vue'

const props = defineProps<{ block: StudioBlock }>()

const datasets = useStudioDatasetsStore()
const drillIn = useFilterDrillIn()
const draft = drillIn.state.draft

const FACETED_OPERATORS = ['=', '!=', 'in', 'not_in']
const isFaceted = computed(() => FACETED_OPERATORS.includes(draft.operator))

const columnLabel = computed(() => (draft.column ? columnRefLabel(draft.column, props.block, datasets) : ''))

const numberFmt = new Intl.NumberFormat('fr-FR')

// ─── Facettes ───────────────────────────────────────────────────────────────
const search = ref('')
const offset = ref(0)
const facets = ref<ColumnFacet[]>([])
const total = ref(0)
const hasCounts = ref(true)
const partial = ref(false)
const loading = ref(false)
const errored = ref(false)

const LIMIT = 50
let debounceId: ReturnType<typeof setTimeout> | undefined

function otherFilters(): BlockFilter[] {
  const all = (drillIn.state.mode === 'comparison' ? props.block.comparisonFilters : props.block.filters) ?? []
  return all.filter((_, i) => i !== drillIn.state.editIndex)
}

async function load(append = false) {
  if (!draft.column || !isFaceted.value) return
  const sp = blockSourceParams(props.block)
  if (!sp.urlDatasetId) return

  loading.value = true
  errored.value = false
  try {
    const res = await fetchColumnFacets(sp.urlDatasetId, draft.column, {
      search: search.value,
      offset: offset.value,
      limit: LIMIT,
      filters: otherFilters(),
      ctx: { sources: sp.sources, primarySourceId: sp.primarySourceId, joins: sp.joins },
    })
    facets.value = append ? [...facets.value, ...res.values] : res.values
    total.value = res.total
    hasCounts.value = res.hasCounts
    partial.value = res.partial
  } catch {
    errored.value = true
    if (!append) facets.value = []
  } finally {
    loading.value = false
  }
}

function reload() {
  offset.value = 0
  load(false)
}

function loadMore() {
  offset.value += LIMIT
  load(true)
}

watch(
  () => draft.column,
  () => {
    search.value = ''
    reload()
  },
  { immediate: true },
)

watch(isFaceted, (faceted) => {
  if (faceted && facets.value.length === 0) reload()
})

watch(search, () => {
  clearTimeout(debounceId)
  debounceId = setTimeout(reload, 250)
})

onBeforeUnmount(() => clearTimeout(debounceId))

// ─── Sélection ──────────────────────────────────────────────────────────────
const selected = computed(() => new Set(draft.values))

function toggleValue(value: string) {
  const set = new Set(draft.values)
  if (set.has(value)) set.delete(value)
  else set.add(value)
  draft.values = Array.from(set)
  draft.dynamicValue = null

  // 2ᵉ valeur cochée sur un opérateur scalaire → promotion multi.
  if (draft.values.length > 1 && (draft.operator === '=' || draft.operator === '!=')) {
    draft.operator = draft.operator === '!=' ? 'not_in' : 'in'
  }
  // Retour à une seule valeur → on redescend en scalaire.
  if (draft.values.length <= 1 && (draft.operator === 'in' || draft.operator === 'not_in')) {
    draft.operator = draft.operator === 'not_in' ? '!=' : '='
  }
}

function pickOperator(op: BlockFilter['operator']) {
  draft.operator = op
  if (!FACETED_OPERATORS.includes(op)) {
    // opérateur texte : on garde une seule valeur libre
    draft.values = draft.values.slice(0, 1)
  }
}

function onDynamicPick(token: string) {
  draft.dynamicValue = token
  draft.values = []
  if (draft.operator === 'in' || draft.operator === 'not_in') draft.operator = '='
}

function clearDynamic() {
  draft.dynamicValue = null
}

const textValue = computed({
  get: () => draft.values[0] ?? '',
  set: (v: string) => {
    draft.values = v === '' ? [] : [v]
    draft.dynamicValue = null
  },
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <p class="font-mono text-[12px] font-semibold text-[var(--studio-ink)]">{{ columnLabel }}</p>

    <!-- Opérateur -->
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="op in BLOCK_FILTER_OPERATORS"
        :key="op.value"
        type="button"
        class="flex items-center gap-1.5 rounded-[9px] border-[1.5px] px-2 py-1 text-[11px] font-bold transition-colors"
        :class="draft.operator === op.value
          ? 'border-[var(--studio-ink)] bg-[var(--studio-ink)] text-white'
          : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)] hover:border-[var(--color-primary)]'"
        @click="pickOperator(op.value)"
      >
        <span class="font-mono opacity-70">{{ op.short }}</span>
        {{ op.label }}
      </button>
    </div>

    <!-- Valeur dynamique choisie -->
    <div v-if="draft.dynamicValue" class="flex items-center gap-2">
      <span class="rounded-[6px] bg-[var(--studio-tag)] px-2 py-1 font-mono text-[11px] font-semibold text-[var(--studio-tag-ink)]">
        {{ draft.dynamicValue }}
      </span>
      <button type="button" class="text-[12px] font-bold text-[var(--studio-faint)] hover:text-[var(--color-error)]" @click="clearDynamic">
        Retirer
      </button>
    </div>

    <template v-else>
      <!-- Champ texte (opérateurs de comparaison / contient) -->
      <div v-if="!isFaceted" class="flex items-stretch gap-2">
        <input
          v-model="textValue"
          type="text"
          class="studio-input studio-input--mono min-w-0 flex-1"
          placeholder="valeur"
        />
        <VariableButton context="valeur de filtre" :block-id="block.id" @pick="onDynamicPick" />
      </div>

      <!-- Liste à facettes -->
      <template v-else>
        <div class="flex items-center gap-2 rounded-lg bg-[var(--studio-note)] px-2.5 py-1.5">
          <span class="h-3 w-3 shrink-0 rounded-full border-[1.6px] border-[color:color-mix(in_srgb,var(--studio-ink)_35%,transparent)]" />
          <input
            v-model="search"
            type="search"
            placeholder="Rechercher une valeur…"
            class="min-w-0 flex-1 bg-transparent text-[12px] text-[var(--studio-ink)] placeholder:text-[var(--studio-faint)] focus:outline-none"
          />
        </div>

        <div class="flex flex-col gap-0.5">
          <label
            v-for="facet in facets"
            :key="facet.value"
            class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--studio-note)]"
          >
            <input
              type="checkbox"
              class="h-3.5 w-3.5 shrink-0 accent-[var(--color-primary)]"
              :checked="selected.has(facet.value)"
              @change="toggleValue(facet.value)"
            />
            <span class="min-w-0 flex-1 truncate font-mono text-[12px] text-[var(--studio-ink)]">{{ facet.value }}</span>
            <span
              v-if="hasCounts && facet.count != null"
              class="shrink-0 font-mono text-[11px] tabular-nums text-[var(--studio-faint)]"
            >{{ numberFmt.format(facet.count) }}</span>
          </label>
        </div>

        <p v-if="loading" class="px-2 py-1 text-[11.5px] text-[var(--studio-faint)]">Chargement…</p>
        <p v-else-if="errored" class="px-2 py-1 text-[11.5px] text-[var(--color-error)]">
          Impossible de charger les valeurs.
        </p>
        <p v-else-if="!facets.length" class="px-2 py-1 text-[11.5px] text-[var(--studio-faint)]">
          {{ search ? `Aucune valeur pour « ${search} ».` : 'Aucune valeur.' }}
        </p>

        <button
          v-if="facets.length < total"
          type="button"
          class="self-start text-[11.5px] font-bold text-[var(--color-primary)] hover:underline"
          @click="loadMore"
        >
          Voir plus ({{ facets.length }} / {{ total }})
        </button>

        <FieldNote v-if="partial">
          Valeurs indicatives (source en direct) : la liste peut être incomplète et les décomptes ne sont pas disponibles.
        </FieldNote>

        <div class="flex items-center gap-2 pt-1">
          <VariableButton context="valeur de filtre" :block-id="block.id" @pick="onDynamicPick" />
          <span class="text-[11.5px] text-[var(--studio-faint)]">Utiliser un paramètre de page ou une valeur calculée</span>
        </div>
      </template>
    </template>
  </div>
</template>
