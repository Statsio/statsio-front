<script setup lang="ts">
import { computed, inject } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { BLOCK_META, isTextBlock, type StudioBlock } from '@/types/studio'
import BlockRenderer from '../blocks/BlockRenderer.vue'
import BlockCard from '../blocks/BlockCard.vue'
import { SECTION_CONTEXT, type SectionContext } from './section-context'

const props = defineProps<{ block: StudioBlock }>()
const studio = useStudioStore()

const section = inject<SectionContext>(SECTION_CONTEXT, { dark: false, carded: false })

const isSelected = computed(() => studio.selectedBlockId === props.block.id)
const isText = computed(() => isTextBlock(props.block.type))
const showChrome = computed(() => !studio.isPreview)

const meta = computed(() => BLOCK_META[props.block.type])
</script>

<template>
  <div
    class="group/blk relative box-border transition-colors"
    :class="[
      section.carded ? 'rounded-xl' : '',
      showChrome && !isText ? 'cursor-pointer' : '',
      showChrome && section.carded && !isSelected ? 'hover:bg-[color-mix(in_srgb,var(--studio-ink)_3%,transparent)]' : '',
    ]"
    @click="!isText && showChrome ? studio.selectBlock(block.id) : undefined"
  >
    <!-- Anneau de sélection (n'affecte pas la mise en page) -->
    <div
      v-if="isSelected && showChrome"
      class="pointer-events-none absolute -inset-1.5 rounded-2xl ring-2 ring-[var(--color-primary)]"
    />

    <!-- Barre d'outils flottante -->
    <div
      v-if="showChrome"
      class="absolute -top-3.5 right-2 z-20 flex items-center gap-0.5 rounded-[10px] border border-[var(--studio-line)] bg-white p-1 opacity-0 shadow-[0_6px_18px_rgba(20,20,30,0.14)] transition-opacity group-hover/blk:opacity-100"
      :class="isSelected ? 'opacity-100' : ''"
    >
      <button type="button" class="flex h-[26px] w-7 items-center justify-center rounded-[7px] text-[13px] text-[var(--studio-muted)] hover:bg-[var(--studio-wash)]" title="Configurer" @click.stop="studio.selectBlock(block.id)">⚙</button>
      <button type="button" class="flex h-[26px] w-7 items-center justify-center rounded-[7px] text-[13px] text-[var(--studio-muted)] hover:bg-[var(--studio-wash)]" title="Monter" @click.stop="studio.moveBlockWithinZone(block.id, -1)">↑</button>
      <button type="button" class="flex h-[26px] w-7 items-center justify-center rounded-[7px] text-[13px] text-[var(--studio-muted)] hover:bg-[var(--studio-wash)]" title="Descendre" @click.stop="studio.moveBlockWithinZone(block.id, 1)">↓</button>
      <button
        type="button"
        class="flex h-[26px] w-7 items-center justify-center rounded-[7px] text-[13px] hover:bg-[var(--studio-wash)]"
        :class="block.locked ? 'cursor-not-allowed text-[var(--studio-line-strong)]' : 'text-[var(--studio-muted)]'"
        :title="block.locked ? 'Bloc verrouillé' : 'Dupliquer'"
        :disabled="block.locked"
        @click.stop="studio.duplicateBlock(block.id)"
      >⧉</button>
      <button
        type="button"
        class="flex h-[26px] w-7 items-center justify-center rounded-[7px] text-[13px] hover:bg-[var(--studio-wash)]"
        :class="block.locked ? 'cursor-not-allowed text-[var(--studio-line-strong)]' : 'text-[var(--studio-muted)] hover:text-[var(--color-error)]'"
        :title="block.locked ? 'Bloc verrouillé' : 'Supprimer'"
        :disabled="block.locked"
        @click.stop="studio.removeBlock(block.id)"
      >🗑</button>
    </div>

    <!-- Étiquette de type (flottante, au survol) -->
    <div
      v-if="showChrome"
      class="pointer-events-none absolute -top-2.5 left-2 z-10 flex items-center gap-1.5 rounded-full border border-[var(--studio-line)] bg-white px-2 py-0.5 opacity-0 shadow-sm transition-opacity group-hover/blk:opacity-100"
      :class="isSelected ? 'opacity-100' : ''"
    >
      <span class="flex h-[14px] w-[14px] items-center justify-center rounded-[4px]" :class="meta.tint">
        <svg class="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" :d="meta.iconPath" />
        </svg>
      </span>
      <span class="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--studio-faint)]">{{ meta.label }}</span>
      <span v-if="block.locked" class="text-[9px] font-bold text-amber-600">🔒</span>
    </div>

    <BlockCard :block="block" :dark="section.dark" :flat="section.carded" :readonly="studio.isPreview">
      <BlockRenderer :block="block" :readonly="studio.isPreview" />
    </BlockCard>
  </div>
</template>
