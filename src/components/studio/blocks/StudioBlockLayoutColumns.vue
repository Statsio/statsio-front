<script setup lang="ts">
import draggable from 'vuedraggable'
import { computed, inject, ref, watch } from 'vue'
import type { StudioBlock } from '@/types/studio-document'
import { blockToPayload, cloneBlock, mergeBlockWithPayload } from '@/types/studio-document'
import { resolveStudioBlock } from '@/components/studio/blocks/studio-block-registry'
import StudioBlockCard from '@/components/studio/StudioBlockCard.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
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
  }>(),
  { editable: true },
)

const emit = defineEmits<{
  'update:payload': [Payload]
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

type DraggableChangeEvent =
  | { added: { element: StudioBlock; newIndex: number } }
  | { removed: { element: StudioBlock; oldIndex: number } }
  | { moved: { element: StudioBlock; oldIndex: number; newIndex: number } }
  | Record<string, never>

const patchGap = (gap: Payload['gap']) => {
  emit('update:payload', { type: props.payload.type, columns: columnsState.value, gap })
}

const gapSelectOptions = [
  { value: 'sm', label: 'Compact' },
  { value: 'md', label: 'Normal' },
  { value: 'lg', label: 'Large' },
]

const updateChild = (colIndex: number, nextChild: StudioBlock) => {
  const next = columnsState.value.map((c) => [...c])
  next[colIndex] = (next[colIndex] ?? []).map((b) => (b.id === nextChild.id ? nextChild : b))
  columnsState.value = next
  emitColumns(next)
}

const onColumnChange = (colIndex: number, evt: DraggableChangeEvent) => {
  const next = columnsState.value.map((c) => [...c])
  const col = [...(next[colIndex] ?? [])]

  if ('added' in evt && evt.added) {
    const { element, newIndex } = evt.added
    const without = col.filter((b) => b.id !== element.id)
    const idx = Math.max(0, Math.min(newIndex, without.length))
    without.splice(idx, 0, element)
    next[colIndex] = without
    columnsState.value = next
    emitColumns(next)
    return
  }

  if ('removed' in evt && evt.removed) {
    const { element } = evt.removed
    next[colIndex] = col.filter((b) => b.id !== element.id)
    columnsState.value = next
    emitColumns(next)
    return
  }

  if ('moved' in evt && evt.moved) {
    const { oldIndex, newIndex } = evt.moved
    const copy = [...col]
    const [item] = copy.splice(oldIndex, 1)
    if (!item) return
    const idx = Math.max(0, Math.min(newIndex, copy.length))
    copy.splice(idx, 0, item)
    next[colIndex] = copy
    columnsState.value = next
    emitColumns(next)
  }
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
</script>

<template>
  <section class="content-block content-block--layout my-2">
    <div v-if="editable" class="mb-2 flex justify-end">
      <label class="sr-only" :for="`${fieldId}-gap`">Espacement</label>
      <AppSelect
        :model-value="payload.gap ?? 'md'"
        :options="gapSelectOptions"
        size="sm"
        button-class="min-h-0 border-slate-200 bg-white px-2 py-1 text-xs focus:ring-2 focus:ring-primary/20"
        panel-class="mt-1"
        aria-label="Espacement"
        @change="(v) => patchGap(String(v) as Payload['gap'])"
      />
    </div>

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
          :empty-insert-threshold="32"
          class="flex min-h-[5.5rem] flex-col gap-3 p-3"
          ghost-class="studio-dnd-ghost"
          chosen-class="studio-dnd-chosen"
          drag-class="studio-dnd-drag"
          @change="onColumnChange(colIndex, $event)"
        >
          <template #item="{ element }">
            <StudioBlockCard
              :block="element"
              :selected="element.id === selectedBlockId"
              stop-select-bubble
              @select="onSelectChild(element.id)"
              @update="updateChild(colIndex, $event)"
              @duplicate="duplicateChild(colIndex, $event)"
              @remove="removeChild(colIndex, $event)"
            />
          </template>

          <template #footer>
            <div v-if="col.length === 0" class="min-h-[4.5rem]" />
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

