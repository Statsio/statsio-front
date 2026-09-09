<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { fetchColumnFacets } from '@/api/studio'
import { blockSourceParams } from '@/composables/useBlockData'
import { useStudioStore } from '@/stores/studio'
import type { ColumnFacet, StudioBlock } from '@/types/studio'

/**
 * Éditeur des libellés d'affichage par VALEUR d'un champ
 * (`fieldMapping.valueLabels[columnRef]`). Liste les valeurs distinctes de la
 * colonne via l'API de facettes (comme le panneau de filtres) ; une saisie par
 * valeur, placeholder = valeur brute. N'affecte que l'affichage — la valeur brute
 * reste la clé technique (agrégation, tri, filtres, drill-in).
 */
const props = defineProps<{ block: StudioBlock; columnRef: string }>()

const studio = useStudioStore()
const fm = computed(() => props.block.fieldMapping)
const overrides = computed<Record<string, string>>(
  () => fm.value.valueLabels?.[props.columnRef] ?? {},
)
const count = computed(() => Object.keys(overrides.value).length)

const open = ref(false)
const search = ref('')
const offset = ref(0)
const facets = ref<ColumnFacet[]>([])
const total = ref(0)
const partial = ref(false)
const loading = ref(false)
const errored = ref(false)

const LIMIT = 50
let debounceId: ReturnType<typeof setTimeout> | undefined

async function load(append = false) {
  const sp = blockSourceParams(props.block)
  if (!sp.urlDatasetId || !props.columnRef) return
  loading.value = true
  errored.value = false
  try {
    const res = await fetchColumnFacets(sp.urlDatasetId, props.columnRef, {
      search: search.value,
      offset: offset.value,
      limit: LIMIT,
      filters: props.block.filters ?? [],
      ctx: { sources: sp.sources, primarySourceId: sp.primarySourceId, joins: sp.joins },
    })
    facets.value = append ? [...facets.value, ...res.values] : res.values
    total.value = res.total
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

watch(open, (v) => {
  if (v && !facets.value.length) reload()
})
watch(
  () => props.columnRef,
  () => {
    if (open.value) {
      search.value = ''
      reload()
    }
  },
)
watch(search, () => {
  clearTimeout(debounceId)
  debounceId = setTimeout(reload, 250)
})
onBeforeUnmount(() => clearTimeout(debounceId))

/** Valeurs déjà renommées mais absentes de la page de facettes courante — gardées éditables. */
const extraValues = computed(() => {
  const shown = new Set(facets.value.map((f) => f.value))
  return Object.keys(overrides.value).filter((v) => !shown.has(v))
})

function setLabel(raw: string, text: string) {
  const all: Record<string, Record<string, string>> = { ...fm.value.valueLabels }
  const map = { ...all[props.columnRef] }
  if (text.trim()) map[raw] = text.trim()
  else delete map[raw]
  if (Object.keys(map).length) all[props.columnRef] = map
  else delete all[props.columnRef]
  studio.updateBlockFieldMapping(props.block.id, {
    valueLabels: Object.keys(all).length ? all : undefined,
  })
}

function clearAll() {
  const all = { ...fm.value.valueLabels }
  delete all[props.columnRef]
  studio.updateBlockFieldMapping(props.block.id, {
    valueLabels: Object.keys(all).length ? all : undefined,
  })
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <button
      type="button"
      class="flex items-center gap-2 text-left text-[12px] font-semibold text-[var(--studio-muted)]"
      @click="open = !open"
    >
      <span class="inline-block transition-transform" :class="open ? 'rotate-90' : ''">›</span>
      Libellés des valeurs
      <span
        v-if="count"
        class="rounded-full bg-[var(--studio-accent-wash)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--studio-tag-ink)]"
        >{{ count }}</span
      >
    </button>

    <div
      v-if="open"
      class="flex flex-col gap-2 rounded-xl border border-[var(--studio-line)] bg-white p-2.5"
    >
      <div class="flex items-center gap-2 rounded-lg bg-[var(--studio-note)] px-2.5 py-1.5">
        <input
          v-model="search"
          type="search"
          placeholder="Rechercher une valeur…"
          class="min-w-0 flex-1 bg-transparent text-[12px] text-[var(--studio-ink)] placeholder:text-[var(--studio-faint)] focus:outline-none"
        />
        <button
          v-if="count"
          type="button"
          class="shrink-0 text-[11px] font-bold text-[var(--studio-faint)] hover:text-[var(--color-error)]"
          @click="clearAll"
        >
          Tout effacer
        </button>
      </div>

      <div class="flex flex-col gap-1.5">
        <div v-for="raw in extraValues" :key="`x-${raw}`" class="flex items-center gap-2">
          <span
            class="w-[92px] shrink-0 truncate rounded-md bg-[var(--studio-tag)] px-2 py-1.5 font-mono text-[10.5px] font-semibold text-[var(--studio-tag-ink)]"
            :title="raw"
            >{{ raw }}</span
          >
          <input
            :value="overrides[raw] ?? ''"
            type="text"
            class="studio-input min-w-0 flex-1 !py-2 !text-[12px]"
            :placeholder="raw"
            @change="setLabel(raw, ($event.target as HTMLInputElement).value)"
          />
        </div>

        <div v-for="facet in facets" :key="facet.value" class="flex items-center gap-2">
          <span
            class="w-[92px] shrink-0 truncate rounded-md bg-[var(--studio-tag)] px-2 py-1.5 font-mono text-[10.5px] font-semibold text-[var(--studio-tag-ink)]"
            :title="facet.value"
            >{{ facet.value }}</span
          >
          <input
            :value="overrides[facet.value] ?? ''"
            type="text"
            class="studio-input min-w-0 flex-1 !py-2 !text-[12px]"
            :placeholder="facet.value"
            @change="setLabel(facet.value, ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <p v-if="loading" class="px-1 text-[11.5px] text-[var(--studio-faint)]">Chargement…</p>
      <p v-else-if="errored" class="px-1 text-[11.5px] text-[var(--color-error)]">
        Impossible de charger les valeurs.
      </p>
      <p
        v-else-if="!facets.length && !extraValues.length"
        class="px-1 text-[11.5px] text-[var(--studio-faint)]"
      >
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

      <p
        v-if="partial"
        class="rounded-lg bg-[var(--studio-note)] px-2.5 py-1.5 text-[11px] leading-[1.5] text-[var(--studio-faint)]"
      >
        Valeurs indicatives (source en direct) : la liste peut être incomplète.
      </p>
    </div>
  </div>
</template>
