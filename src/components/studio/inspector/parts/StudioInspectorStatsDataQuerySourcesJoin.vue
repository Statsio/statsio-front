<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlockPayload } from '@/types/studio-document'
import type { StudioDataSource } from '@/types/studio-data-source'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import type { StatsDataQueryRequestV2 } from '@/types/statsdata-query-v2'
import { ensureUniqueAliases, normalizedFieldOptionsForSource, TABLE_ALIAS_POOL } from '@/components/studio/inspector/statsdata-query-editor'

const props = defineProps<{
  idPrefix: string
  dataSources: StudioDataSource[]
  block: Extract<StudioBlockPayload, { type: 'table' | 'chart' | 'chart_line' | 'chart_pie' }>
  qDraft: StatsDataQueryRequestV2 | null
  selectedSource?: StudioDataSource
  enableV2: () => void
  commitV2: (q: StatsDataQueryRequestV2) => void
}>()

const sourcesById = computed(() => new Map(props.dataSources.map((s) => [s.id, s] as const)))

const dataSourceSelectOptions = computed(() => [
  { value: '', label: '— Choisir une source —' },
  ...props.dataSources.map((s) => ({ value: s.id, label: s.name })),
])

const joinTypeSelectOptions = [
  { value: 'inner', label: 'Inner' },
  { value: 'left', label: 'Left' },
]

const sourceEntries = computed(() => (props.qDraft?.sources ?? []).map((s) => ({ alias: s.alias.trim(), sourceId: s.sourceId.trim() })))

const setSources = (entries: { alias: string; sourceId: string }[]) => {
  const cur = props.qDraft
  if (!cur) return
  const cleaned = entries
    .map((e) => ({ alias: e.alias.trim(), sourceId: e.sourceId.trim() }))
    .filter((e) => e.sourceId)
  const uniq = ensureUniqueAliases(cleaned)
  const next: StatsDataQueryRequestV2 = { ...cur, sources: uniq, ...(uniq.length <= 1 ? { join: undefined } : {}) }
  props.commitV2(next)
}

const addSource = () => {
  const cur = props.qDraft
  if (!cur) return
  const used = new Set(cur.sources.map((s) => s.alias))
  const alias = TABLE_ALIAS_POOL.find((x) => !used.has(x)) ?? `a${cur.sources.length + 1}`
  props.commitV2({ ...cur, sources: [...cur.sources, { alias, sourceId: '' }] })
}

const removeSource = (alias: string) => {
  const cur = props.qDraft
  if (!cur) return
  const nextSources = ensureUniqueAliases(cur.sources.filter((s) => s.alias !== alias))
  props.commitV2({ ...cur, sources: nextSources, ...(nextSources.length <= 1 ? { join: undefined } : {}) })
}

const joinFieldOptions = computed(() => {
  const entries = sourceEntries.value
  const selected = entries.map((e) => sourcesById.value.get(e.sourceId)).filter(Boolean) as StudioDataSource[]
  if (selected.length < 2) return [] as string[]
  const sets = selected.map((s) => new Set(normalizedFieldOptionsForSource(s)))
  const first = sets[0]!
  const inter = [...first].filter((x) => sets.every((st) => st.has(x)))
  return inter.sort((a, b) => a.localeCompare(b))
})

const joinType = computed({
  get: () => (props.qDraft?.join?.type === 'left' ? 'left' : 'inner'),
  set: (t: 'inner' | 'left') => {
    const cur = props.qDraft
    if (!cur) return
    const on = cur.join?.on?.length ? [...cur.join.on] : []
    props.commitV2({ ...cur, join: { type: t, on } })
  },
})

const joinOn = computed(() => props.qDraft?.join?.on ?? [])

const toggleJoinOnField = (field: string, checked: boolean) => {
  const cur = props.qDraft
  if (!cur) return
  const on = [...(cur.join?.on ?? [])]
  const has = on.includes(field)
  const next = checked && !has ? [...on, field] : !checked && has ? on.filter((x) => x !== field) : on
  props.commitV2({ ...cur, join: next.length ? { type: joinType.value, on: next } : undefined })
}
</script>

<template>
  <details class="group rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3">
    <summary class="flex cursor-pointer list-none select-none items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
      <span>Sources</span>
      <svg viewBox="0 0 20 20" fill="currentColor" class="ml-auto h-4 w-4 text-slate-400 transition group-open:rotate-180" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
          clip-rule="evenodd"
        />
      </svg>
    </summary>

    <template v-if="!qDraft">
      <p class="mt-3 text-[11px] text-slate-600">Active le mode v2 pour configurer les sources.</p>
    </template>

    <template v-else>
      <div
        v-if="selectedSource"
        class="mt-3 rounded-xl border border-slate-200/90 bg-white/85 px-2.5 py-2 text-[11px] text-slate-600"
      >
        <p class="font-semibold text-slate-800">{{ selectedSource.name }}</p>
        <p v-if="selectedSource.lastSnapshot" class="mt-1">
          <span :class="selectedSource.lastSnapshot.status === 'ok' ? 'text-emerald-700' : 'text-rose-700'">
            {{ selectedSource.lastSnapshot.status === 'ok' ? 'Snapshot OK' : 'Échec snapshot' }}
          </span>
          <span v-if="typeof selectedSource.lastSnapshot.rowCount === 'number'">
            · {{ selectedSource.lastSnapshot.rowCount }} ligne(s)
          </span>
        </p>
      </div>

      <div class="mt-3 space-y-2 rounded-xl border border-slate-200/90 bg-white/75 px-2.5 py-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-xs font-semibold text-slate-800">Sources & jointure</p>
          <AppButton variant="ghost" size="sm" type="button" @click="addSource">+ Source</AppButton>
        </div>
        <ul class="flex flex-col gap-2">
          <li v-for="(se, i) in sourceEntries" :key="`src-${se.alias}-${i}`" class="rounded-xl border border-slate-200 bg-white px-2.5 py-2">
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-end">
              <div>
                <label class="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Alias</label>
                <input
                  :value="se.alias"
                  type="text"
                  class="w-24 rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-[11px] text-slate-900 outline-none focus:border-primary/40"
                  @change="
                    setSources(
                      sourceEntries.map((x) =>
                        x.alias === se.alias ? { ...x, alias: ($event.target as HTMLInputElement).value } : x,
                      ),
                    )
                  "
                />
              </div>
              <div>
                <label class="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Source</label>
                <AppSelect
                  :model-value="se.sourceId"
                  :options="dataSourceSelectOptions"
                  size="sm"
                  button-class="w-full rounded-lg bg-white px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary/20"
                  panel-class="mt-1"
                  aria-label="Source"
                  @change="
                    (v) =>
                      setSources(sourceEntries.map((x) => (x.alias === se.alias ? { ...x, sourceId: String(v || '') } : x)))
                  "
                />
              </div>
              <div class="flex justify-end">
                <AppButton
                  variant="ghost"
                  size="sm"
                  type="button"
                  class="text-rose-700"
                  :disabled="sourceEntries.length <= 1"
                  @click="removeSource(se.alias)"
                >
                  Retirer
                </AppButton>
              </div>
            </div>
          </li>
        </ul>

        <div v-if="sourceEntries.length >= 2" class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <label class="text-[11px] font-semibold text-slate-700" :for="`${idPrefix}-join-type`">Type de jointure</label>
            <AppSelect
              :id="`${idPrefix}-join-type`"
              :model-value="joinType"
              :options="joinTypeSelectOptions"
              size="sm"
              button-class="rounded-lg bg-white px-2 py-1 text-[11px] text-slate-800 focus:ring-2 focus:ring-primary/20"
              panel-class="mt-1"
              aria-label="Type de jointure"
              @change="(v) => (joinType = String(v) as 'inner' | 'left')"
            />
          </div>

          <div v-if="joinFieldOptions.length" class="max-h-40 overflow-auto rounded-xl border border-slate-200 bg-white p-2">
            <ul class="flex flex-col gap-1.5">
              <li v-for="f in joinFieldOptions" :key="`join-${f}`" class="flex items-center gap-2">
                <input
                  :id="`${idPrefix}-join-${f}`"
                  type="checkbox"
                  class="h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary/30"
                  :checked="joinOn.includes(f)"
                  @change="toggleJoinOnField(f, ($event.target as HTMLInputElement).checked)"
                />
                <label :for="`${idPrefix}-join-${f}`" class="text-sm text-slate-800">{{ f }}</label>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  </details>

  <div v-if="!qDraft" class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
    <p class="font-semibold">Formules & agrégations</p>
    <p class="mt-0.5">Active le mode v2 pour créer des colonnes calculées et des groupBy/sum/avg…</p>
    <div class="mt-2">
      <AppButton variant="secondary" size="sm" type="button" @click="enableV2">Passer aux formules (v2)</AppButton>
    </div>
  </div>
</template>
