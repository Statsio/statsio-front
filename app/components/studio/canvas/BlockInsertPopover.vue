<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { FORM_BLOCK_TYPES, type BlockType } from '@/types/studio'
import { filterPalette, paletteFor } from '@/lib/studio-palette'
import { useStudioToast } from '@/composables/useStudioToast'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import StudioIcon from '../ui/StudioIcon.vue'

/**
 * Popover d'insertion ouvert par le « + » d'un bloc : recherche + catégories du
 * type de contenu ; insère le bloc à `index` dans `zoneId`.
 * Clavier : ↑/↓ pour parcourir, Entrée pour insérer, Échap pour fermer.
 */
const props = defineProps<{ anchor: HTMLElement; zoneId: string; index: number }>()
const emit = defineEmits<{ close: [] }>()

const studio = useStudioStore()
const { show } = useStudioToast()
const query = ref('')
const input = ref<HTMLInputElement | null>(null)
const root = ref<HTMLElement | null>(null)
const active = ref(0)

function locked(type: BlockType): boolean {
  if (!FORM_BLOCK_TYPES.includes(type)) return false
  return studio.content?.survey_kind === 'petition' || studio.isFormBlockLimitReached(type)
}

const cats = computed(() =>
  filterPalette(paletteFor(studio.content?.type), query.value)
    .map((c) => ({ ...c, blocks: c.blocks.filter((b) => !locked(b.type)) }))
    .filter((c) => c.blocks.length),
)
const flat = computed(() => cats.value.flatMap((c) => c.blocks))

const pos = ref({ top: 0, left: 0 })
function place() {
  const r = props.anchor.getBoundingClientRect()
  const h = Math.min(window.innerHeight * 0.6, 440)
  pos.value = {
    top: Math.max(8, Math.min(r.bottom + 8, window.innerHeight - h - 12)),
    left: Math.max(8, Math.min(r.left + r.width / 2 - 150, window.innerWidth - 308)),
  }
}

function insert(type: BlockType, label: string) {
  emit('close')
  if (type === 'sd-embed' && studio.content?.type === 'article') {
    studio.setLeftTab('sdlib')
    return
  }
  if (!studio.canUseBlock(type)) {
    studio.requestPremiumUpsell(type)
    return
  }
  studio.addBlock(type, props.zoneId, props.index)
  show(`Bloc « ${label} » ajouté`)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    emit('close')
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    const n = flat.value.length
    if (n) active.value = (active.value + (e.key === 'ArrowDown' ? 1 : n - 1)) % n
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const b = flat.value[active.value]
    if (b) insert(b.type, b.label)
  }
}

function onDocDown(e: MouseEvent) {
  const t = e.target as Node
  if (root.value?.contains(t) || props.anchor.contains(t)) return
  emit('close')
}

onMounted(() => {
  place()
  nextTick(() => input.value?.focus())
  document.addEventListener('mousedown', onDocDown)
  window.addEventListener('resize', place)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocDown)
  window.removeEventListener('resize', place)
})
</script>

<template>
  <Teleport to="body">
    <div
      ref="root"
      class="st-pop"
      role="menu"
      aria-label="Ajouter un bloc"
      :style="{ top: `${pos.top}px`, left: `${pos.left}px` }"
      @keydown="onKeydown"
    >
      <label class="st-find !shadow-none">
        <span class="sr-only">Chercher un bloc</span>
        <StudioIcon name="search" :size="15" />
        <input ref="input" v-model="query" placeholder="Chercher un bloc…" autocomplete="off" @input="active = 0" />
      </label>
      <template v-for="cat in cats" :key="cat.id">
        <div class="st-lbl px-1.5 pb-0.5 pt-1.5">{{ cat.label }}</div>
        <button
          v-for="b in cat.blocks"
          :key="b.type"
          type="button"
          class="st-it"
          role="menuitem"
          :data-active="flat[active]?.type === b.type"
          @click="insert(b.type, b.label)"
          @mouseenter="active = flat.findIndex((x) => x.type === b.type)"
        >
          <span class="st-tg" :class="{ 'st-tg--data': b.data }">
            <DsTypeGlyph v-if="b.type === 'sd-embed'" kind="statsdata" :size="16" mono />
            <StudioIcon v-else :name="b.type" :size="16" />
          </span>
          <span><b>{{ b.label }}</b><small>{{ b.description }}</small></span>
        </button>
      </template>
      <p v-if="!cats.length" class="st-hint p-2">Aucun bloc.</p>
    </div>
  </Teleport>
</template>
