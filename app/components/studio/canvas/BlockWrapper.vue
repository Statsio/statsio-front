<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import type { BlockType, StudioBlock } from '@/types/studio'
import { isTextBlock } from '@/types/studio'
import BlockRenderer from '../blocks/BlockRenderer.vue'

const props = defineProps<{ block: StudioBlock }>()
const studio = useStudioStore()

const isSelected = computed(() => studio.selectedBlockId === props.block.id)
const isText = computed(() => isTextBlock(props.block.type))
const showChrome = computed(() => !studio.isPreview)

const BLOCK_LABELS: Record<BlockType, string> = {
  bar: 'Barres', line: 'Lignes', pie: 'Camembert', table: 'Tableau', kpi: 'KPI',
  heading: 'Titre', paragraph: 'Paragraphe', quote: 'Citation', callout: 'Encadré',
  image: 'Image', video: 'Vidéo', button: 'Bouton', 'link-card': 'Carte de lien', retenir: 'À retenir',
  choice: 'Choix unique', checkboxes: 'Cases à cocher', dropdown: 'Liste déroulante', scale: 'Échelle linéaire', rating: 'Avis',
  search: 'Recherche',
}
const kindLabel = computed(() => BLOCK_LABELS[props.block.type] ?? props.block.type)
</script>

<template>
  <div
    class="group relative box-border rounded-2xl border-2 bg-white px-[22px] py-[18px] shadow-[var(--studio-shadow-card)] transition-colors"
    :class="[
      isSelected ? 'border-[var(--color-primary)]' : 'border-transparent',
      showChrome && !isText ? 'cursor-pointer hover:border-[var(--studio-line-strong)]' : '',
      isText ? 'overflow-visible' : '',
    ]"
    @click="!isText && showChrome ? studio.selectBlock(block.id) : undefined"
  >
    <!-- Floating hover toolbar -->
    <div
      v-if="showChrome"
      class="absolute -top-3.5 right-3.5 z-10 flex items-center gap-0.5 rounded-[10px] border border-[var(--studio-line)] bg-white p-1 opacity-0 shadow-[0_6px_18px_rgba(20,20,30,0.14)] transition-opacity group-hover:opacity-100"
      :class="isSelected ? 'opacity-100' : ''"
    >
      <button
        type="button"
        class="flex h-[26px] w-7 items-center justify-center rounded-[7px] text-[13px] text-[var(--studio-muted)] hover:bg-[var(--studio-wash)]"
        title="Configurer"
        @click.stop="studio.selectBlock(block.id)"
      >⚙</button>
      <button
        type="button"
        class="flex h-[26px] w-7 items-center justify-center rounded-[7px] text-[13px] text-[var(--studio-muted)] hover:bg-[var(--studio-wash)]"
        title="Monter"
        @click.stop="studio.moveBlockWithinZone(block.id, -1)"
      >↑</button>
      <button
        type="button"
        class="flex h-[26px] w-7 items-center justify-center rounded-[7px] text-[13px] text-[var(--studio-muted)] hover:bg-[var(--studio-wash)]"
        title="Descendre"
        @click.stop="studio.moveBlockWithinZone(block.id, 1)"
      >↓</button>
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

    <!-- Kind label + lock badge -->
    <div v-if="showChrome" class="mb-3 flex items-center gap-2">
      <span class="text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-[var(--studio-faint)]">{{ kindLabel }}</span>
      <span
        v-if="block.locked"
        class="rounded-[5px] bg-amber-100 px-[7px] py-0.5 text-[10px] font-bold text-amber-800"
      >🔒 verrouillé · auto</span>
    </div>

    <BlockRenderer :block="block" :readonly="studio.isPreview" />
  </div>
</template>
