<script setup lang="ts">
import { ref, computed } from 'vue'
import type { BlockType } from '@/types/studio'
import { useStudioStore } from '@/stores/studio'
import { FORM_BLOCK_TYPES } from '@/types/studio'
import { filterPalette, paletteFor } from '@/lib/studio-palette'
import { useStudioToast } from '@/composables/useStudioToast'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import StudioIcon from '../ui/StudioIcon.vue'

const studio = useStudioStore()
const { show } = useStudioToast()
const search = ref('')

const isPetition = computed(() => studio.content?.type === 'survey' && studio.content?.survey_kind === 'petition')
const isQuick = computed(() => studio.content?.type === 'survey' && studio.content?.survey_kind === 'single_question')

const categories = computed(() => filterPalette(paletteFor(studio.content?.type), search.value))

/** Raison du verrouillage d'une tuile (format du sondage), sinon chaîne vide. */
function lockReason(type: BlockType): string {
  if (!FORM_BLOCK_TYPES.includes(type)) return ''
  if (isPetition.value) return 'Une pétition ne contient pas de questions'
  if (studio.isFormBlockLimitReached(type)) return 'Une question rapide n’a qu’une question'
  return ''
}

function tileTitle(type: BlockType, description: string): string {
  const lock = lockReason(type)
  if (lock) return lock
  if (studio.isBlockPremium(type)) return `${description} · Réservé à l'offre ${studio.requiredOfferForBlock(type)?.name ?? 'payante'}`
  return description
}

function onDragStart(event: DragEvent, type: BlockType) {
  if (lockReason(type)) {
    event.preventDefault()
    return
  }
  if (!studio.canUseBlock(type)) {
    event.preventDefault()
    studio.requestPremiumUpsell(type)
    return
  }
  if (!event.dataTransfer) return
  event.dataTransfer.setData('studio-block-type', type)
  event.dataTransfer.effectAllowed = 'copy'
}

function onBlockClick(type: BlockType, label: string) {
  const lock = lockReason(type)
  if (lock) {
    show(lock)
    return
  }
  if (type === 'sd-embed' && studio.content?.type === 'article') {
    studio.setLeftTab('sdlib')
    return
  }
  if (!studio.canUseBlock(type)) {
    studio.requestPremiumUpsell(type)
    return
  }
  studio.addBlockSmart(type)
  show(`Bloc « ${label} » ajouté`)
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="shrink-0 px-4 pb-3">
      <p class="st-hint mb-3">
        Cliquez pour ajouter <b>{{ studio.selectedBlock ? 'après le bloc sélectionné' : 'en fin de page' }}</b>, ou glissez sur le canevas.
      </p>
      <label class="st-find">
        <span class="sr-only">Chercher un bloc</span>
        <StudioIcon name="search" :size="16" />
        <input v-model="search" type="search" placeholder="Chercher un bloc…" autocomplete="off" />
      </label>
    </div>

    <div class="flex min-h-0 flex-1 flex-col gap-[18px] overflow-auto px-4 pb-10 pt-1">
      <div v-if="isPetition || isQuick" class="st-notice">
        <StudioIcon name="callout" :size="16" />
        <span>
          {{ isPetition ? 'Format pétition : les blocs de questions sont désactivés.' : 'Format question rapide : une seule question par sondage.' }}
          Changez le format dans <b>Réglages</b>.
        </span>
      </div>

      <div v-for="category in categories" :key="category.id" class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="st-lbl">{{ category.label }}</span>
          <button v-if="category.id === 'statsio'" type="button" class="st-addl !py-0" @click="studio.setLeftTab('sdlib')">Parcourir →</button>
        </div>
        <div class="st-tiles">
          <button
            v-for="block in category.blocks"
            :key="block.type"
            type="button"
            class="st-tile relative select-none"
            :aria-disabled="lockReason(block.type) ? 'true' : undefined"
            :draggable="!lockReason(block.type)"
            :data-block-type="block.type"
            :title="tileTitle(block.type, block.description)"
            @dragstart="onDragStart($event, block.type)"
            @click="onBlockClick(block.type, block.label)"
          >
            <span
              v-if="studio.isBlockPremium(block.type)"
              class="st-badge absolute right-1.5 top-1.5"
            >{{ studio.requiredOfferForBlock(block.type)?.name ?? 'Premium' }}</span>
            <span class="st-tg" :class="{ 'st-tg--data': block.data }">
              <DsTypeGlyph v-if="block.type === 'sd-embed'" kind="statsdata" :size="20" mono />
              <StudioIcon v-else :name="block.type" :size="20" />
            </span>
            <b>{{ block.label }}</b>
            <small>{{ block.description }}</small>
          </button>
        </div>
      </div>

      <p v-if="categories.length === 0" class="st-hint">
        Aucun bloc pour « {{ search }} ». Essayez « graphique », « question » ou « image ».
      </p>
    </div>
  </div>
</template>
