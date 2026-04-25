<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { StudioBlockPayload } from '@/types/studio-document'
import type { StudioDataSource } from '@/types/studio-data-source'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import StudioFormulaEditor from '@/components/studio/inspector/parts/StudioFormulaEditor.vue'
import type { StatsDataQueryRequestV2, StatsDataQuerySelectV2, StatsDataFormulaAst } from '@/types/statsdata-query-v2'
import { normalizedFieldOptionsForSource, parseFrom } from '@/components/studio/inspector/statsdata-query-editor'
import { astToExpr, highlightFormulaHtml, parseFormulaToAst, tokenizeFormula } from '@/lib/statsdata-formula'

const props = defineProps<{
  idPrefix: string
  dataSources: StudioDataSource[]
  block: Extract<StudioBlockPayload, { type: 'table' | 'chart' | 'chart_line' | 'chart_pie' }>
  qDraft: StatsDataQueryRequestV2
  commitV2: (q: StatsDataQueryRequestV2) => void
}>()

const sourcesById = computed(() => new Map(props.dataSources.map((s) => [s.id, s] as const)))
const sourceEntries = computed(() => (props.qDraft.sources ?? []).map((s) => ({ alias: s.alias.trim(), sourceId: s.sourceId.trim() })))
const aliasOptions = computed(() => sourceEntries.value.map((se) => ({ value: se.alias, label: se.alias })))

function fieldOptionsForAlias(alias: string) {
  const sourceId = sourceEntries.value.find((x) => x.alias === alias)?.sourceId || ''
  const src = sourcesById.value.get(sourceId)
  return [{ value: '', label: '— Champ —' }, ...normalizedFieldOptionsForSource(src).map((f) => ({ value: f, label: f }))]
}

const selectList = computed<StatsDataQuerySelectV2[]>(() => props.qDraft.select ?? [])

const addFromSelect = () => {
  const n = props.qDraft.select.length + 1
  props.commitV2({ ...props.qDraft, select: [...props.qDraft.select, { kind: 'from', label: `Colonne ${n}`, from: 's.' }] })
}
const removeSelect = (index: number) => props.commitV2({ ...props.qDraft, select: props.qDraft.select.filter((_, i) => i !== index) })
const setSelect = (index: number, next: StatsDataQuerySelectV2) =>
  props.commitV2({ ...props.qDraft, select: props.qDraft.select.map((c, i) => (i === index ? next : c)) })

const setSelectLabel = (index: number, label: string) => {
  const cur = selectList.value[index]
  if (!cur) return
  setSelect(index, { ...cur, label })
}
const setSelectFromParts = (index: number, alias: string, field: string) => {
  const cur = selectList.value[index]
  if (!cur || cur.kind !== 'from') return
  setSelect(index, { ...cur, from: alias && field ? `${alias}.${field}` : `${alias}.` })
}

const formulaExprByIdx = ref<Record<number, string>>({})
const formulaErrorByIdx = ref<Record<number, string | null>>({})
const lastFromByIdx = ref<Record<number, string>>({})
const timers = ref<Record<number, number>>({})

const formulaRefButtons = computed(() => {
  const out: { label: string; insert: string; hint?: string }[] = []
  const seen = new Set<string>()
  for (const c of selectList.value) {
    const label = String((c as any)?.label ?? '').trim()
    if (!label || seen.has(label)) continue
    seen.add(label)
    out.push({ label, insert: `[${label}]`, hint: c.kind === 'from' ? String((c as any).from ?? '') : undefined })
  }
  return out
})
const formulaFieldButtons = computed(() => {
  const out: { label: string; insert: string; hint?: string }[] = []
  const seen = new Set<string>()
  for (const se of sourceEntries.value) {
    const src = sourcesById.value.get(se.sourceId)
    for (const f of normalizedFieldOptionsForSource(src)) {
      const ref = `${se.alias}.${f}`
      if (seen.has(ref)) continue
      seen.add(ref)
      out.push({ label: ref, insert: `[${ref}]`, hint: src?.name })
    }
  }
  return out
})

watch(
  selectList,
  (list) => {
    const next = { ...formulaExprByIdx.value }
    let changed = false
    for (let i = 0; i < list.length; i++) {
      const sel = list[i]
      if (!sel || sel.kind !== 'formula') continue
      if (next[i] != null && String(next[i]).trim() !== '') continue
      const expr = astToExpr((sel as any).expr as StatsDataFormulaAst)
      if (expr) {
        next[i] = expr
        changed = true
      }
    }
    if (changed) formulaExprByIdx.value = next
  },
  { immediate: true },
)

function applyFormulaAtIndex(idx: number) {
  try {
    const exprSrc = formulaExprByIdx.value[idx] ?? ''
    const ast = parseFormulaToAst(tokenizeFormula(exprSrc))
    const sel = props.qDraft.select[idx]
    if (!sel) return
    formulaErrorByIdx.value = { ...formulaErrorByIdx.value, [idx]: null }
    props.commitV2({ ...props.qDraft, select: props.qDraft.select.map((c, i) => (i === idx ? { kind: 'formula', label: c.label, expr: ast } : c)) })
  } catch (e) {
    formulaErrorByIdx.value = { ...formulaErrorByIdx.value, [idx]: e instanceof Error ? e.message : 'Expression invalide.' }
  }
}
function scheduleApply(idx: number, opts?: { immediate?: boolean }) {
  const prev = timers.value[idx]
  if (typeof prev === 'number') window.clearTimeout(prev)
  if (opts?.immediate) return applyFormulaAtIndex(idx)
  const t = window.setTimeout(() => applyFormulaAtIndex(idx), 450)
  timers.value = { ...timers.value, [idx]: t }
}
onBeforeUnmount(() => Object.values(timers.value).forEach((t) => typeof t === 'number' && window.clearTimeout(t)))

const toggleComputedAtIndex = (idx: number, checked: boolean) => {
  const sel = props.qDraft.select[idx]
  if (!sel) return
  if (checked) {
    if (sel.kind === 'from') lastFromByIdx.value = { ...lastFromByIdx.value, [idx]: sel.from }
    return props.commitV2({
      ...props.qDraft,
      select: props.qDraft.select.map((c, i) => (i === idx ? { kind: 'formula', label: c.label, expr: { kind: 'number', value: 0 } } : c)),
    })
  }
  const fallbackFrom = lastFromByIdx.value[idx] ?? 's.'
  props.commitV2({ ...props.qDraft, select: props.qDraft.select.map((c, i) => (i === idx ? { kind: 'from', label: c.label, from: fallbackFrom } : c)) })
}
</script>

<template>
  <details class="group rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3" open>
    <summary class="flex cursor-pointer list-none select-none items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
      <span>Colonnes</span>
      <svg viewBox="0 0 20 20" fill="currentColor" class="ml-auto h-4 w-4 text-slate-400 transition group-open:rotate-180" aria-hidden="true">
        <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z" clip-rule="evenodd" />
      </svg>
    </summary>

    <div class="mt-3 space-y-2">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xs font-semibold text-slate-700">Select</span>
        <AppButton variant="ghost" size="sm" type="button" :disabled="!block.dataBinding.sourceId" @click="addFromSelect">+ From</AppButton>
      </div>

      <ul v-if="selectList.length" class="flex flex-col gap-2">
        <li v-for="(sel, idx) in selectList" :key="`sel-${idx}`" class="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">{{ sel.kind }}</span>
              <input :value="sel.label" type="text" class="w-56 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-primary/40" @change="setSelectLabel(idx, ($event.target as HTMLInputElement).value)" />
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <label class="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30" :checked="sel.kind === 'formula'" @change="toggleComputedAtIndex(idx, ($event.target as HTMLInputElement).checked)" />
                Calculée
              </label>
              <AppButton variant="ghost" size="sm" type="button" class="text-rose-700" @click="removeSelect(idx)">Retirer</AppButton>
            </div>
          </div>

          <div v-if="sel.kind === 'from'" class="mt-2 grid grid-cols-1 gap-2">
            <div>
              <label class="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Alias</label>
              <AppSelect :model-value="parseFrom(sel.from).alias || sourceEntries[0]?.alias || 's'" :options="aliasOptions" size="sm" button-class="w-full rounded-lg bg-white px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary/20" panel-class="mt-1" aria-label="Alias" @change="(v) => setSelectFromParts(idx, String(v), parseFrom(sel.from).field)" />
            </div>
            <div>
              <label class="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Champ</label>
              <AppSelect :model-value="parseFrom(sel.from).field" :options="fieldOptionsForAlias(parseFrom(sel.from).alias || sourceEntries[0]?.alias || 's')" size="sm" button-class="w-full rounded-lg bg-white px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary/20" panel-class="mt-1" aria-label="Champ" @change="(v) => setSelectFromParts(idx, parseFrom(sel.from).alias || sourceEntries[0]?.alias || 's', String(v || ''))" />
            </div>
            <p class="sm:col-span-2 font-mono text-[10px] text-slate-500">from: {{ sel.from }}</p>
          </div>

          <div v-else class="mt-2 space-y-2 rounded-lg bg-slate-50 px-2 py-2">
            <StudioFormulaEditor
              :model-value="formulaExprByIdx[idx] ?? ''"
              :field-buttons="formulaFieldButtons"
              :reference-buttons="formulaRefButtons.filter((x) => x.label !== sel.label)"
              :highlighted-html="highlightFormulaHtml(formulaExprByIdx[idx] ?? '') || '<span class=&quot;text-slate-400&quot;>[Champ A] * [Champ B] / 100</span>'"
              :placeholder-html="'<span class=&quot;text-slate-400&quot;>[Champ A] * [Champ B] / 100</span>'"
              :error="formulaErrorByIdx[idx]"
              @update:model-value="(value) => { formulaExprByIdx = { ...formulaExprByIdx, [idx]: value }; scheduleApply(idx) }"
              @blur="scheduleApply(idx, { immediate: true })"
            />
          </div>
        </li>
      </ul>
    </div>
  </details>
</template>
