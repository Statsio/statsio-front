<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock, TableColumnFormat } from '@/types/studio'

/**
 * Style d'affichage d'une colonne : alignement, gras / italique / souligné,
 * et (carte uniquement) visibilité dans la fiche au survol d'un point.
 * Même emplacement/gabarit que `FieldValueLabels` (bouton à bascule + panneau).
 */
const props = defineProps<{ block: StudioBlock; columnRef: string }>()

const studio = useStudioStore()
const fm = computed(() => props.block.fieldMapping)
const fmt = computed<TableColumnFormat>(() => fm.value.columnFormats?.[props.columnRef] ?? {})
const isMap = computed(() => props.block.type === 'map')

/** Nombre d'attributs de style non par défaut, affiché en badge sur le bouton replié. */
const count = computed(() => {
  const f = fmt.value
  let n = 0
  if (f.align) n++
  if (f.bold) n++
  if (f.italic) n++
  if (f.underline) n++
  if (isMap.value && f.showOnHover === false) n++
  return n
})

const open = ref(false)

function patch(next: Partial<TableColumnFormat>) {
  const all: Record<string, TableColumnFormat> = { ...fm.value.columnFormats }
  const merged: TableColumnFormat = { ...all[props.columnRef], ...next }
  const empty =
    !merged.format && !merged.align && !merged.bold && !merged.italic && !merged.underline && merged.showOnHover !== false
  if (empty) delete all[props.columnRef]
  else all[props.columnRef] = merged
  studio.updateBlockFieldMapping(props.block.id, { columnFormats: Object.keys(all).length ? all : undefined })
}

const ALIGNS = [
  { v: undefined, l: 'Auto' },
  { v: 'left', l: '⇤' },
  { v: 'center', l: '↔' },
  { v: 'right', l: '⇥' },
] as const
</script>

<template>
  <div class="flex flex-col gap-2">
    <button
      type="button"
      class="flex items-center gap-2 text-left text-[12px] font-semibold text-[var(--studio-muted)]"
      @click="open = !open"
    >
      <span class="inline-block transition-transform" :class="open ? 'rotate-90' : ''">›</span>
      Style
      <span
        v-if="count"
        class="rounded-full bg-[var(--studio-accent-wash)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--studio-tag-ink)]"
        >{{ count }}</span
      >
    </button>

    <div v-if="open" class="flex flex-col gap-2.5 rounded-xl border border-[var(--studio-line)] bg-white p-2.5">
      <div class="flex items-center gap-1.5">
        <span class="w-[72px] shrink-0 text-[11px] text-[var(--studio-faint)]">Alignement</span>
        <span class="flex gap-1">
          <button
            v-for="a in ALIGNS"
            :key="a.l"
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-md border text-[12px]"
            :class="(fmt.align ?? undefined) === a.v
              ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--studio-tag-ink)]'
              : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)]'"
            :title="a.l === 'Auto' ? 'Auto' : `Aligner : ${a.l}`"
            @click="patch({ align: a.v })"
          >{{ a.l === 'Auto' ? 'A' : a.l }}</button>
        </span>
      </div>

      <div class="flex items-center gap-1.5">
        <span class="w-[72px] shrink-0 text-[11px] text-[var(--studio-faint)]">Style texte</span>
        <span class="flex gap-1">
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-md border text-[12px] font-bold"
            :class="fmt.bold ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--studio-tag-ink)]' : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)]'"
            title="Gras"
            @click="patch({ bold: !fmt.bold })"
          >G</button>
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-md border text-[12px] italic"
            :class="fmt.italic ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--studio-tag-ink)]' : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)]'"
            title="Italique"
            @click="patch({ italic: !fmt.italic })"
          >I</button>
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-md border text-[12px] underline"
            :class="fmt.underline ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--studio-tag-ink)]' : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)]'"
            title="Souligné"
            @click="patch({ underline: !fmt.underline })"
          >S</button>
        </span>
      </div>

      <label v-if="isMap" class="flex cursor-pointer items-center gap-2 pt-0.5">
        <input
          type="checkbox"
          :checked="fmt.showOnHover !== false"
          @change="patch({ showOnHover: ($event.target as HTMLInputElement).checked ? undefined : false })"
        />
        <span class="text-[11.5px] text-[var(--studio-ink)]">Affiché sur la fiche de survol</span>
      </label>
    </div>
  </div>
</template>
