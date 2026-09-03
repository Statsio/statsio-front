<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { useStudioStore } from '@/stores/studio'
import type { BlockType, StudioBlock } from '@/types/studio'
import BlockWrapper from './BlockWrapper.vue'

/**
 * vuedraggable embarque un bundle sortablejs (wrapper UMD) qui plante à l'évaluation
 * sur Cloudflare Workers (`Function("return this")` interdit → global object undefined).
 * On le charge donc en import dynamique, uniquement côté client et pour l'éditeur :
 * en preview / SSR (pages publiques), la zone rend une simple liste statique.
 */
const draggable = defineAsyncComponent(() => import('vuedraggable'))

const props = defineProps<{
  zoneId: string
  colIndex: number
  /**
   * Zone imbriquée (contenu d'un bloc boucle). Deux sortables imbriqués partageant
   * exactement le même groupe se gênent ; on donne à la zone interne un nom de
   * groupe distinct qui accepte quand même les échanges avec les zones de section.
   */
  nested?: boolean
}>()

const studio = useStudioStore()

/** Zone triable seulement dans l'éditeur, côté client (jamais en SSR ni en preview). */
const editable = computed(() => import.meta.client && !studio.isPreview)

// vuedraggable v-model: handles reorder within zone AND cross-zone moves
const zoneBlocks = computed<StudioBlock[]>({
  get: () => studio.blocksByZone[props.zoneId] ?? [],
  set: (newBlocks: StudioBlock[]) => {
    studio.setZoneBlocks(props.zoneId, newBlocks.map((b) => b.id))
  },
})

const isEmpty = computed(() => zoneBlocks.value.length === 0)

const dragGroup = computed(() =>
  props.nested
    ? { name: 'canvas-blocks-loop', put: ['canvas-blocks', 'canvas-blocks-loop'], pull: true }
    : { name: 'canvas-blocks', put: true, pull: true },
)

// ─── Drop position tracking (sidebar → canvas) ────────────────────────────────

const isDragOver  = ref(false)
const dropIndex   = ref(-1) // -1 = append at end
const draggableEl = ref<{ $el: HTMLElement } | null>(null)
const rootEl      = ref<HTMLElement | null>(null)

/**
 * Vrai quand l'événement vise en réalité une zone imbriquée (contenu d'un bloc
 * boucle) : la zone parente doit alors s'effacer et ne rien afficher, sinon on
 * voit deux indicateurs de dépôt superposés.
 */
function targetsNestedZone(event: DragEvent): boolean {
  const nearest = (event.target as Element | null)?.closest?.('[data-canvas-zone]')
  return !!nearest && nearest !== rootEl.value
}

function getDropIndex(event: DragEvent): number {
  const el = draggableEl.value?.$el
  if (!el) return zoneBlocks.value.length

  // Block items are marked with data-block-index to survive indicator divs in the DOM
  const blockEls = Array.from(el.querySelectorAll('[data-block-index]')) as HTMLElement[]
  const mouseY   = event.clientY

  for (const blockEl of blockEls) {
    const idx  = parseInt(blockEl.dataset.blockIndex!, 10)
    const rect = blockEl.getBoundingClientRect()
    if (mouseY < rect.top + rect.height / 2) return idx
  }
  return zoneBlocks.value.length
}

function onDragOver(event: DragEvent) {
  if (!event.dataTransfer?.types.includes('studio-block-type')) return
  if (targetsNestedZone(event)) {
    isDragOver.value = false
    dropIndex.value  = -1
    return
  }
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
  isDragOver.value = true
  dropIndex.value  = getDropIndex(event)
}

function onDragEnter(event: DragEvent) {
  if (event.dataTransfer?.types.includes('studio-block-type') && !targetsNestedZone(event)) {
    isDragOver.value = true
  }
}

function onDragLeave(event: DragEvent) {
  if (!event.currentTarget || !(event.currentTarget as Element).contains(event.relatedTarget as Node)) {
    isDragOver.value = false
    dropIndex.value  = -1
  }
}

function onDrop(event: DragEvent) {
  isDragOver.value = false
  const idx = dropIndex.value
  dropIndex.value  = -1
  if (targetsNestedZone(event)) return
  event.preventDefault()
  const blockType = event.dataTransfer?.getData('studio-block-type') as BlockType
  if (blockType) {
    studio.addBlock(blockType, props.zoneId, idx >= 0 ? idx : undefined)
  }
}

// Garde-fou : un drag palette → canevas qui se termine hors zone (drop annulé,
// touche Échap…) laissait l'indicateur violet affiché. On réinitialise à la fin
// de tout glisser-déposer, où qu'il finisse.
function resetDragState() {
  isDragOver.value = false
  dropIndex.value = -1
}
onMounted(() => {
  window.addEventListener('dragend', resetDragState)
  window.addEventListener('drop', resetDragState)
})
onBeforeUnmount(() => {
  window.removeEventListener('dragend', resetDragState)
  window.removeEventListener('drop', resetDragState)
})
</script>

<template>
  <div
    ref="rootEl"
    data-canvas-zone
    class="relative flex min-w-0 flex-col transition-all"
    :class="[
      nested ? '' : 'rounded-xl',
      isEmpty && !studio.isPreview
        ? (nested
            ? 'min-h-[72px] rounded-lg border border-dashed border-[var(--studio-line)] bg-transparent'
            : 'min-h-[104px] rounded-xl border-2 border-dashed border-[var(--studio-line-strong)] bg-[color-mix(in_srgb,var(--studio-ink)_3%,transparent)]')
        : 'bg-transparent',
      isDragOver
        ? 'rounded-xl border-2 border-dashed border-[var(--color-primary)] bg-[var(--studio-accent-wash)]'
        : '',
    ]"
    @dragover="onDragOver"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Empty placeholder -->
    <div
      v-if="isEmpty && !isDragOver && !studio.isPreview"
      class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2"
    >
      <svg class="h-6 w-6 text-[var(--studio-line-strong)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      <p class="text-[11px] font-medium text-[var(--studio-faint)]">Glisser un bloc ici</p>
      <button
        v-if="!nested"
        type="button"
        class="pointer-events-auto rounded-lg border border-dashed border-[var(--studio-line-strong)] px-2.5 py-1 text-[11px] font-semibold text-[var(--studio-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        @click="studio.addBlock('layout', zoneId)"
      >
        + Ajouter une disposition
      </button>
    </div>

    <!-- Drag over highlight text (empty zone) -->
    <div
      v-if="isDragOver && isEmpty"
      class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
    >
      <span class="text-xs font-semibold text-[var(--color-primary)]">Déposer ici</span>
    </div>

    <!-- Éditeur (client) : vuedraggable — reorder + déplacements inter-zones -->
    <component
      :is="draggable"
      v-if="editable"
      ref="draggableEl"
      v-model="zoneBlocks"
      :group="dragGroup"
      :disabled="studio.isPreview"
      item-key="id"
      class="flex min-w-0 flex-1 flex-col gap-4"
      :class="isEmpty && !studio.isPreview ? 'min-h-[104px]' : ''"
      ghost-class="studio-drag-ghost"
      animation="150"
    >
      <template #item="{ element, index }">
        <div :data-block-index="index" class="flex flex-col">
          <!-- Insertion indicator: above this block -->
          <div
            v-if="isDragOver && dropIndex === index"
            class="relative h-0.5 rounded-full bg-[var(--color-primary)] mx-1 mb-2 shrink-0"
          >
            <div class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />
          </div>
          <BlockWrapper :block="element" />
        </div>
      </template>

      <!-- Insertion indicator: after all blocks (append) -->
      <template #footer>
        <div
          v-if="isDragOver && dropIndex >= zoneBlocks.length"
          class="relative h-0.5 rounded-full bg-[var(--color-primary)] mx-1 mt-2 shrink-0"
        >
          <div class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />
        </div>
      </template>
    </component>

    <!-- Preview / SSR (pages publiques) : liste statique, sans vuedraggable -->
    <div v-else class="flex min-w-0 flex-1 flex-col gap-4">
      <div
        v-for="(element, index) in zoneBlocks"
        :key="element.id"
        :data-block-index="index"
        class="flex flex-col"
      >
        <BlockWrapper :block="element" />
      </div>
    </div>
  </div>
</template>

<!-- Non scopé : SortableJS applique cette classe à un clone qu'il insère dans le DOM.
     Un seul token (sinon `classList.add()` lève « token can not contain whitespace »). -->
<style>
.studio-drag-ghost {
  opacity: 0.3;
  border-radius: 0.75rem;
  outline: 2px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
}
</style>
