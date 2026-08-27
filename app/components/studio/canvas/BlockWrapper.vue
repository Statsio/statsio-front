<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { BLOCK_META, isTextBlock, type StudioBlock } from '@/types/studio'
import BlockRenderer from '../blocks/BlockRenderer.vue'

const props = defineProps<{ block: StudioBlock }>()
const studio = useStudioStore()

const isSelected = computed(() => studio.selectedBlockId === props.block.id)
const isText = computed(() => isTextBlock(props.block.type))
const showChrome = computed(() => !studio.isPreview)

const meta = computed(() => BLOCK_META[props.block.type])
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
      <span class="flex h-[18px] w-[18px] items-center justify-center rounded-[6px]" :class="meta.tint">
        <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" :d="meta.iconPath" />
        </svg>
      </span>
      <span class="text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-[var(--studio-faint)]">{{ meta.label }}</span>
      <span
        v-if="block.locked"
        class="rounded-[5px] bg-amber-100 px-[7px] py-0.5 text-[10px] font-bold text-amber-800"
      >🔒 verrouillé · auto</span>
    </div>

    <BlockRenderer :block="block" :readonly="studio.isPreview" />
  </div>
</template>
