<script setup lang="ts">
import draggable from 'vuedraggable'
import { computed, inject, ref, watch } from 'vue'
import type { StudioBlock, StudioBlockAction } from '@/types/studio-document'
import type { StudioDataSource } from '@/types/studio-data-source'
import { blockToPayload, cloneBlock, mergeBlockWithPayload } from '@/types/studio-document'
import { resolveStudioBlock } from '@/components/studio/blocks/studio-block-registry'
import StudioBlockCard from '@/components/studio/StudioBlockCard.vue'
import { studioSelectBlockKey, studioSelectedBlockIdKey } from '@/lib/studio-inject-keys'

type Payload = {
  type: 'layout_2col' | 'layout_3col'
  columns: StudioBlock[][]
  gap?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(
  defineProps<{
    payload: Payload
    fieldId: string
    editable?: boolean
    dataSources?: StudioDataSource[]
    pages?: Array<{ id: string; name: string }>
  }>(),
  { editable: true },
)

const emit = defineEmits<{
  'update:payload': [Payload]
  action: [action: StudioBlockAction, context: Record<string, unknown>]
}>()

const selectedBlockId = inject(studioSelectedBlockIdKey, ref<string | null>(null))
const selectBlock = inject(studioSelectBlockKey, () => {})

const columnCount = computed(() => (props.payload.type === 'layout_3col' ? 3 : 2))

const gapClass = computed(() => {
  const g = props.payload.gap ?? 'md'
  if (g === 'sm') return 'gap-4'
  if (g === 'lg') return 'gap-10'
  return 'gap-6'
})

// Must match Studio canvas + palette group to allow dropping blocks inside columns.
const group = { name: 'studio-blocks', pull: true, put: true } as const
const handle = '.studio-canvas-drag-handle'

const normalizeColumns = (rawCols: unknown): StudioBlock[][] => {
  const cols = Array.isArray(rawCols) ? (rawCols as unknown[]) : []
  const wanted = columnCount.value
  const out: StudioBlock[][] = []
  for (let i = 0; i < wanted; i++) {
    const col = cols[i]
    out.push(Array.isArray(col) ? [...(col as StudioBlock[])] : [])
  }
  return out
}

// Use a local mutable state for draggable columns.
// Using :model-value without v-model makes the list effectively read-only for Sortable,
// which causes drops into nested lists to fail (parent list captures the drop).
const columnsState = ref<StudioBlock[][]>(normalizeColumns(props.payload.columns))

watch(
  () => [props.payload.columns, props.payload.type] as const,
  () => {
    columnsState.value = normalizeColumns(props.payload.columns)
  },
  { deep: true },
)

const emitColumns = (next: StudioBlock[][]) => {
  emit('update:payload', {
    type: props.payload.type,
    columns: next,
    ...(props.payload.gap ? { gap: props.payload.gap } : {}),
  })
}

const updateChild = (colIndex: number, nextChild: StudioBlock) => {
  const next = columnsState.value.map((c) => [...c])
  next[colIndex] = (next[colIndex] ?? []).map((b) => (b.id === nextChild.id ? nextChild : b))
  columnsState.value = next
  emitColumns(next)
}

const onColumnChange = () => {
  // v-model already applies Sortable changes in columnsState.
  // Re-deriving from event payload can desync nested DnD depending on source list.
  const next = columnsState.value.map((c) => [...c])
  columnsState.value = next
  emitColumns(next)
}

const removeChild = (colIndex: number, id: string) => {
  const next = columnsState.value.map((c) => [...c])
  next[colIndex] = (next[colIndex] ?? []).filter((b) => b.id !== id)
  columnsState.value = next
  emitColumns(next)
}

const duplicateChild = (colIndex: number, id: string) => {
  const next = columnsState.value.map((c) => [...c])
  const idx = (next[colIndex] ?? []).findIndex((b) => b.id === id)
  if (idx === -1) return
  const copy = cloneBlock(next[colIndex]![idx]!)
  next[colIndex]!.splice(idx + 1, 0, copy)
  columnsState.value = next
  emitColumns(next)
}

const onSelectChild = (id: string) => {
  selectBlock(id)
}

const onChildAction = (payload: { action: StudioBlockAction; context: Record<string, unknown> }) => {
  emit('action', payload.action, payload.context)
}
</script>

<template>
  <section class="content-block content-block--layout my-2">
    <!-- Studio (editable): draggable columns + block actions. -->
    <div
      v-if="editable"
      class="grid"
      :class="[columnCount === 3 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2', gapClass]"
    >
      <div
        v-for="(col, colIndex) in columnsState"
        :key="`col-${fieldId}-${colIndex}`"
        class="rounded-2xl border border-dashed border-slate-200 bg-transparent p-0"
      >
        <draggable
          v-model="columnsState[colIndex]"
          item-key="id"
          :group="group"
          :handle="handle"
          :empty-insert-threshold="48"
          class="flex min-h-[8rem] flex-col gap-3 p-3"
          ghost-class="studio-dnd-ghost"
          chosen-class="studio-dnd-chosen"
          drag-class="studio-dnd-drag"
          @change="onColumnChange"
        >
          <template #item="{ element }">
            <StudioBlockCard
              :block="element"
              :selected="element.id === selectedBlockId"
              :data-sources="dataSources"
              :pages="pages"
              stop-select-bubble
              @select="onSelectChild(element.id)"
              @update="updateChild(colIndex, $event)"
              @duplicate="duplicateChild(colIndex, $event)"
              @remove="removeChild(colIndex, $event)"
              @action="onChildAction"
            />
          </template>

          <template #footer>
            <div
              v-if="col.length === 0"
              class="flex min-h-[6rem] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-[11px] font-medium uppercase tracking-wide text-slate-400"
            >
              Déposer ici
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <!-- Public/readonly (not editable): render children blocks without Studio chrome. -->
    <div
      v-else
      class="grid"
      :class="[columnCount === 3 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2', gapClass]"
    >
      <div
        v-for="(col, colIndex) in normalizeColumns(payload.columns)"
        :key="`col-ro-${fieldId}-${colIndex}`"
        class="flex min-h-[5.5rem] flex-col gap-3"
      >
        <div v-if="col.length === 0" class="min-h-[4.5rem]" />
        <component
          v-for="child in col"
          :key="child.id"
          :is="resolveStudioBlock(child.type)"
          :payload="blockToPayload(child)"
          :field-id="child.id"
          :editable="false"
          :data-sources="dataSources"
          :pages="pages"
          @action="onChildAction"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
:deep(.studio-dnd-ghost) {
  opacity: 0.65;
}
:deep(.studio-dnd-chosen) {
  opacity: 0.95;
}
:deep(.studio-dnd-drag) {
  opacity: 1;
}
</style>
