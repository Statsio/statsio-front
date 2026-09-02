<script setup lang="ts">
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { columnRefLabel } from '@/lib/studio-columns'
import { useColumnDrillIn } from '@/composables/useColumnDrillIn'
import type { ResultPart, StudioBlock } from '@/types/studio'

const props = defineProps<{ block: StudioBlock; modelValue: ResultPart[]; mode: 'title' | 'desc' }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: ResultPart[]): void }>()

const datasets = useStudioDatasetsStore()
const drillIn = useColumnDrillIn()

const parts = () => props.modelValue ?? []

function write(next: ResultPart[]) {
  emit('update:modelValue', next)
}
function update(i: number, patch: Partial<ResultPart>) {
  write(parts().map((p, k) => (k === i ? { ...p, ...patch } : p)))
}
function remove(i: number) {
  write(parts().filter((_, k) => k !== i))
}
function move(i: number, dir: -1 | 1) {
  const next = [...parts()]
  const j = i + dir
  if (j < 0 || j >= next.length) return
  ;[next[i], next[j]] = [next[j]!, next[i]!]
  write(next)
}
function pickColumn(i: number) {
  drillIn.open({
    block: props.block,
    title: props.mode === 'title' ? 'Colonne du titre' : 'Colonne de la description',
    selected: parts()[i]?.ref ? [parts()[i]!.ref] : [],
    onCommit: (refs) => { if (refs[0]) update(i, { ref: refs[0] }) },
  })
}
function addPart() {
  drillIn.open({
    block: props.block,
    title: props.mode === 'title' ? 'Colonne du titre' : 'Colonne de la description',
    selected: [],
    onCommit: (refs) => { if (refs[0]) write([...parts(), { ref: refs[0] }]) },
  })
}
const label = (ref: string) => (ref ? columnRefLabel(ref, props.block, datasets) : '')
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="(part, i) in parts()"
      :key="i"
      class="flex flex-col gap-1.5 rounded-xl border border-[var(--studio-line)] bg-white p-2.5"
    >
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-[10px] border-[1.5px] border-[var(--studio-line-strong)] bg-white px-2.5 py-2 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--studio-accent-wash)]"
          @click="pickColumn(i)"
        >
          <span
            class="min-w-0 flex-1 truncate font-mono text-[11.5px]"
            :class="part.ref ? 'font-semibold text-[var(--studio-ink)]' : 'text-[var(--studio-faint)]'"
          >{{ label(part.ref) || 'colonne' }}</span>
          <svg class="h-3.5 w-3.5 shrink-0 text-[var(--studio-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        <button
          type="button"
          class="flex h-6 w-5 shrink-0 items-center justify-center rounded text-[10px] text-[var(--studio-muted)] transition-colors hover:bg-[var(--studio-wash)] disabled:opacity-30"
          :disabled="i === 0"
          aria-label="Monter"
          @click="move(i, -1)"
        >▲</button>
        <button
          type="button"
          class="flex h-6 w-5 shrink-0 items-center justify-center rounded text-[10px] text-[var(--studio-muted)] transition-colors hover:bg-[var(--studio-wash)] disabled:opacity-30"
          :disabled="i === parts().length - 1"
          aria-label="Descendre"
          @click="move(i, 1)"
        >▼</button>
        <button
          type="button"
          class="shrink-0 text-[13px] leading-none text-[var(--studio-faint)] transition-colors hover:text-[var(--color-error)]"
          aria-label="Retirer"
          @click="remove(i)"
        >✕</button>
      </div>

      <!-- Description : libellé affiché devant la valeur -->
      <input
        v-if="mode === 'desc'"
        :value="part.label ?? ''"
        type="text"
        class="studio-input !py-1.5 !text-[12px]"
        placeholder="Libellé (défaut : nom de la colonne)"
        @input="update(i, { label: ($event.target as HTMLInputElement).value || undefined })"
      />

      <!-- Titre : texte statique avant / après -->
      <div v-else class="flex gap-1.5">
        <input
          :value="part.prefix ?? ''"
          type="text"
          class="studio-input min-w-0 flex-1 !py-1.5 !text-[12px]"
          placeholder="avant…"
          @input="update(i, { prefix: ($event.target as HTMLInputElement).value || undefined })"
        />
        <input
          :value="part.suffix ?? ''"
          type="text"
          class="studio-input min-w-0 flex-1 !py-1.5 !text-[12px]"
          placeholder="après…"
          @input="update(i, { suffix: ($event.target as HTMLInputElement).value || undefined })"
        />
      </div>
    </div>

    <button
      type="button"
      class="self-start rounded-lg border-[1.5px] border-dashed border-[var(--studio-line-strong)] px-2.5 py-1 text-[11.5px] font-bold text-[var(--color-primary)]"
      @click="addPart"
    >+ {{ mode === 'title' ? 'Ajouter au titre' : 'Ajouter une ligne' }}</button>
  </div>
</template>
