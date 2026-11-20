<script setup lang="ts">
import { computed, inject, nextTick, onMounted, ref } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { BLOCK_META, FORM_BLOCK_TYPES, isTextBlock, type StudioBlock } from '@/types/studio'
import { DATA_BLOCK_TYPES } from '@/lib/studio-palette'
import { useStudioToast } from '@/composables/useStudioToast'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import BlockRenderer from '../blocks/BlockRenderer.vue'
import BlockCard from '../blocks/BlockCard.vue'
import StudioIcon from '../ui/StudioIcon.vue'
import BlockInsertPopover from './BlockInsertPopover.vue'
import { SECTION_CONTEXT, type SectionContext } from './section-context'

const props = defineProps<{ block: StudioBlock }>()
const studio = useStudioStore()
const { show } = useStudioToast()

const section = inject<SectionContext>(SECTION_CONTEXT, { dark: false, carded: false })

const isSelected = computed(() => studio.selectedBlockId === props.block.id)
const isText = computed(() => isTextBlock(props.block.type))
const showChrome = computed(() => !studio.isPreview)
const meta = computed(() => BLOCK_META[props.block.type])
const isData = computed(() => DATA_BLOCK_TYPES.has(props.block.type))

/** Contrôle du format de sondage : question en trop (rapide) ou interdite (pétition). */
const formatWarning = computed(() => {
  if (studio.content?.type !== 'survey' || !FORM_BLOCK_TYPES.includes(props.block.type)) return ''
  if (studio.content.survey_kind === 'petition') return 'hors format : une pétition n’a pas de questions'
  if (studio.content.survey_kind === 'single_question') {
    const first = studio.blocks.find((b) => FORM_BLOCK_TYPES.includes(b.type))
    if (first && first.id !== props.block.id) return 'hors format : une question rapide n’en a qu’une'
  }
  return ''
})

function select() {
  if (!isText.value && showChrome.value) studio.selectBlock(props.block.id)
}

function duplicate() {
  if (studio.duplicateBlock(props.block.id)) show('Bloc dupliqué')
}
function remove() {
  const label = meta.value?.label ?? 'Bloc'
  studio.removeBlock(props.block.id)
  show(`Bloc « ${label} » supprimé`, 'Annuler', () => studio.undo())
}

// ─── « + » : popover d'insertion juste après ce bloc ─────────────────────────
const addBtn = ref<HTMLElement | null>(null)
const popOpen = ref(false)
const insertIndex = computed(() => {
  const ids = (studio.blocksByZone[props.block.zoneId] ?? []).map((b) => b.id)
  const i = ids.indexOf(props.block.id)
  return i >= 0 ? i + 1 : ids.length
})

// ─── Apparition d'un bloc tout juste ajouté (sélectionné à son montage) ──────
const root = ref<HTMLElement | null>(null)
const isNew = ref(false)
onMounted(() => {
  if (!showChrome.value || studio.selectedBlockId !== props.block.id) return
  isNew.value = true
  setTimeout(() => (isNew.value = false), 700)
  nextTick(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    root.value?.scrollIntoView?.({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
  })
})
</script>

<template>
  <div
    ref="root"
    class="st-b group/blk"
    :class="{
      'is-sel': isSelected && showChrome,
      'is-warn': !!formatWarning && showChrome,
      'st-b--new': isNew,
      'cursor-pointer': showChrome && !isText,
    }"
    :data-block-id="block.id"
    :tabindex="showChrome ? 0 : undefined"
    :aria-label="showChrome ? `Bloc ${meta.label}` : undefined"
    @click="select"
    @keydown.enter.self.prevent="studio.selectBlock(block.id)"
  >
    <template v-if="showChrome">
      <!-- Étiquette de type -->
      <div class="st-b-tag">
        <DsTypeGlyph v-if="isData" kind="statsdata" :size="12" mono />
        <StudioIcon v-else :name="block.type" :size="12" />
        <span>{{ meta.label }}</span>
        <StudioIcon v-if="block.locked" name="lock" :size="11" />
        <em v-if="formatWarning">{{ formatWarning }}</em>
      </div>

      <!-- Barre d'outils (bloc sélectionné) -->
      <div class="st-b-tools" role="toolbar" aria-label="Actions du bloc" @click.stop>
        <button type="button" title="Monter (Alt+↑)" aria-label="Monter" @click="studio.moveBlockWithinZone(block.id, -1)">
          <StudioIcon name="up" :size="15" />
        </button>
        <button type="button" title="Descendre (Alt+↓)" aria-label="Descendre" @click="studio.moveBlockWithinZone(block.id, 1)">
          <StudioIcon name="down" :size="15" />
        </button>
        <button type="button" :disabled="block.locked" :title="block.locked ? 'Bloc verrouillé' : 'Dupliquer (Ctrl+D)'" aria-label="Dupliquer" @click="duplicate">
          <StudioIcon name="dup" :size="15" />
        </button>
        <button type="button" :disabled="block.locked" :title="block.locked ? 'Bloc verrouillé' : 'Supprimer (Suppr)'" aria-label="Supprimer" @click="remove">
          <StudioIcon name="trash" :size="15" />
        </button>
        <button type="button" title="Réglages du bloc" aria-label="Réglages du bloc" @click="studio.selectBlock(block.id)">
          <StudioIcon name="gear" :size="15" />
        </button>
      </div>

      <!-- Ajouter un bloc après -->
      <button
        ref="addBtn"
        type="button"
        class="st-b-add"
        title="Ajouter un bloc après"
        aria-label="Ajouter un bloc après"
        :aria-expanded="popOpen"
        @click.stop="popOpen = !popOpen"
      >
        <StudioIcon name="plus" :size="14" />
      </button>
      <BlockInsertPopover
        v-if="popOpen && addBtn"
        :anchor="addBtn"
        :zone-id="block.zoneId"
        :index="insertIndex"
        @close="popOpen = false"
      />
    </template>

    <div class="st-b-body">
      <BlockCard :block="block" :dark="section.dark" :flat="section.carded" :readonly="studio.isPreview">
        <BlockRenderer :block="block" :readonly="studio.isPreview" />
      </BlockCard>
    </div>
  </div>
</template>
