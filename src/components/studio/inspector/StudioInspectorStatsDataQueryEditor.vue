<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { StudioBlockPayload } from '@/types/studio-document'
import type { StudioDataSource } from '@/types/studio-data-source'
import type { StatsDataQueryRequest } from '@/types/statsdata-query'
import type {
  StatsDataQueryRequestV2,
} from '@/types/statsdata-query-v2'
import StudioInspectorStatsDataQuerySourcesJoin from '@/components/studio/inspector/parts/StudioInspectorStatsDataQuerySourcesJoin.vue'
import StudioInspectorStatsDataQuerySelect from '@/components/studio/inspector/parts/StudioInspectorStatsDataQuerySelect.vue'
import StudioInspectorStatsDataQueryAggregationsLimitSearch from '@/components/studio/inspector/parts/StudioInspectorStatsDataQueryAggregationsLimitSearch.vue'

const props = defineProps<{
  idPrefix: string
  dataSources: StudioDataSource[]
  block: Extract<StudioBlockPayload, { type: 'table' | 'chart' | 'chart_line' | 'chart_pie' }>
}>()

const emit = defineEmits<{
  'push-payload': [StudioBlockPayload]
}>()

const isV2 = computed(() => (props.block.query as any)?.specVersion === 2)

const refOptions = computed(() => {
  const q = props.block.query as any
  if (q?.specVersion !== 2) return []
  const v2 = q as StatsDataQueryRequestV2
  const out: string[] = []
  for (const srcEntry of v2.sources ?? []) {
    const alias = String(srcEntry?.alias ?? '').trim()
    const sourceId = String(srcEntry?.sourceId ?? '').trim()
    if (!alias || !sourceId) continue
    const src = props.dataSources.find((s) => s.id === sourceId)
    if (!src) continue
    const fields = src.normalizationMapping ? [
      ...(src.normalizationMapping.keyFields?.map((f) => f.name).filter(Boolean) ?? []),
      ...(src.normalizationMapping.valueFields?.map((f) => f.name).filter(Boolean) ?? []),
      ...(src.normalizationMapping.staticKeys ? Object.keys(src.normalizationMapping.staticKeys) : []),
    ] : []
    for (const f of fields) out.push(`${alias}.${f}`)
  }
  return [...new Set(out)].sort((a, b) => a.localeCompare(b))
})

const baseV1 = computed<StatsDataQueryRequest | null>(() => {
  const q = props.block.query as any
  if (q?.specVersion === 2) return null
  if (q?.sources?.length && q?.columns?.length) return q as StatsDataQueryRequest
  return null
})

const v2Query = computed<StatsDataQueryRequestV2 | null>(() => {
  const q = props.block.query as any
  if (q?.specVersion !== 2) return null
  return q as StatsDataQueryRequestV2
})

const selectedSource = computed(() => {
  const id = props.block.dataBinding.sourceId
  if (!id) return undefined
  return props.dataSources.find((s) => s.id === id)
})

const toV2FromV1 = (q: StatsDataQueryRequest): StatsDataQueryRequestV2 => ({
  specVersion: 2,
  sources: q.sources.map((s) => ({ ...s })),
  ...(q.join ? { join: { type: q.join.type, on: [...q.join.on] } } : {}),
  select: q.columns.map((c) => ({ kind: 'from', label: c.label, from: c.from })),
  ...(q.search?.q ? { search: { q: q.search.q } } : {}),
  ...(typeof q.limit === 'number' ? { limit: q.limit } : {}),
  ...(typeof q.offset === 'number' ? { offset: q.offset } : {}),
})

const commitV2 = (q: StatsDataQueryRequestV2) => {
  const b = props.block
  const nextSourceId = q.sources?.[0]?.sourceId ?? b.dataBinding.sourceId
  const labels = q.select.map((c) => c.label.trim()).filter(Boolean)
  emit('push-payload', {
    ...b,
    dataBinding: { ...b.dataBinding, sourceId: nextSourceId, visibleColumnKeys: labels.length ? labels : [] },
    query: q,
  } as unknown as StudioBlockPayload)
}

const enableV2 = () => {
  const b = props.block
  const fromV1 = baseV1.value
  const q = fromV1
    ? toV2FromV1(fromV1)
    : ({
        specVersion: 2,
        sources: [{ alias: 's', sourceId: b.dataBinding.sourceId }],
        select: [{ kind: 'from', label: 'Colonne 1', from: 's.' }],
      } as StatsDataQueryRequestV2)
  commitV2(q)
}

const qDraft = computed(() => v2Query.value ?? null)

const didAutoUpgrade = ref(false)
const alive = ref(true)
onBeforeUnmount(() => {
  alive.value = false
})

const scheduleAutoUpgrade = async () => {
  if (!alive.value) return
  if (isV2.value) return
  if (didAutoUpgrade.value) return
  didAutoUpgrade.value = true
  // Defer to avoid triggering parent updates during the same mount/patch cycle.
  await nextTick()
  if (!alive.value) return
  if (isV2.value) return
  enableV2()
}

onMounted(() => {
  void scheduleAutoUpgrade()
})

watch(
  () => [isV2.value, props.block.query, props.block.dataBinding.sourceId] as const,
  () => {
    void scheduleAutoUpgrade()
  },
)

</script>

<template>
  <StudioInspectorStatsDataQuerySourcesJoin
    :id-prefix="idPrefix"
    :data-sources="dataSources"
    :block="block"
    :q-draft="qDraft"
    :selected-source="selectedSource"
    :enable-v2="enableV2"
    :commit-v2="commitV2"
  />

  <template v-if="qDraft">
    <StudioInspectorStatsDataQuerySelect
      :id-prefix="idPrefix"
      :data-sources="dataSources"
      :block="block"
      :q-draft="qDraft"
      :commit-v2="commitV2"
    />

    <StudioInspectorStatsDataQueryAggregationsLimitSearch
      :id-prefix="idPrefix"
      :data-sources="dataSources"
      :block="block"
      :q-draft="qDraft"
      :commit-v2="commitV2"
      :push-payload="(b) => emit('push-payload', b)"
      :ref-options="refOptions"
    />
  </template>
</template>
