<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import type { BlockConfig, StudioBlock } from '@/types/studio'
import InspectorSection from '@/components/studio/fields/InspectorSection.vue'
import FieldText from '@/components/studio/fields/FieldText.vue'
import FieldSegmented from '@/components/studio/fields/FieldSegmented.vue'
import FieldPicker from '@/components/studio/fields/FieldPicker.vue'
import FieldNote from '@/components/studio/fields/FieldNote.vue'
import EditorialContentModal from '@/components/studio/ui/EditorialContentModal.vue'

const props = defineProps<{ block: StudioBlock }>()
const studio = useStudioStore()

const TOKEN_HINT = '{{ colonne }}'

function set<K extends keyof BlockConfig>(key: K, value: BlockConfig[K]) {
  studio.updateBlockConfig(props.block.id, { [key]: value })
}

// ─── Grille de champs (field-grid) ──────────────────────────────────────────
const gridItems = computed(() => props.block.config.fieldGridItems ?? [])
function saveGrid(items: { label: string; value: string }[]) {
  set('fieldGridItems', items.length ? items : undefined)
}
function addGridItem() { saveGrid([...gridItems.value, { label: '', value: '' }]) }
function updateGridItem(i: number, key: 'label' | 'value', v: string) {
  saveGrid(gridItems.value.map((it, idx) => (idx === i ? { ...it, [key]: v } : it)))
}
function removeGridItem(i: number) { saveGrid(gridItems.value.filter((_, idx) => idx !== i)) }

// ─── Image upload ────────────────────────────────────────────────────────────

const fileInput = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)
const uploading = ref(false)
const uploadError = ref('')

async function uploadFile(file: File) {
  uploadError.value = ''
  uploading.value = true
  try {
    const form = new FormData()
    form.append('file', file)
    form.append('directory', 'studio/images')
    const { data } = await apiHttp.post(STATSIO_API.media.upload, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    set('imageUrl', data.data.url)
  } catch (e: unknown) {
    uploadError.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      "Erreur lors de l'upload de l'image"
  } finally {
    uploading.value = false
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) uploadFile(input.files[0])
  input.value = ''
}
function onDrop(event: DragEvent) {
  dragOver.value = false
  const file = event.dataTransfer?.files[0]
  if (file) uploadFile(file)
}

// ─── Button / link-card / retenir → sub-modal ────────────────────────────────

const showModal = ref(false)

const editorialPicker = computed(() => {
  const c = props.block.config
  if (props.block.type === 'button') return { label: 'Bouton', value: c.buttonLabel || 'Configurer le bouton' }
  if (props.block.type === 'link-card') return { label: 'Carte de lien', value: c.linkTitle || 'Configurer la carte' }
  const n = (c.retenirItems ?? []).length
  return { label: 'À retenir', value: n ? `${n} point${n > 1 ? 's' : ''} clé${n > 1 ? 's' : ''}` : 'Configurer les points clés' }
})

const WIDTHS = [
  { label: 'Petite', value: 'sm' },
  { label: 'Moyenne', value: 'md' },
  { label: 'Grande', value: 'lg' },
  { label: 'Pleine', value: 'full' },
]
const ALIGNS = [
  { label: 'Gauche', value: 'left' },
  { label: 'Centre', value: 'center' },
  { label: 'Droite', value: 'right' },
]
</script>

<template>
  <div class="flex flex-col gap-5 px-4 py-4">
    <!-- IMAGE -->
    <template v-if="block.type === 'image'">
      <InspectorSection label="Image">
        <div
          class="relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-colors"
          :class="dragOver
            ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)]'
            : block.config.imageUrl ? 'border-[var(--studio-line-strong)]' : 'border-[var(--studio-line-strong)] bg-[var(--studio-note)]'"
          @click="fileInput?.click()"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop.prevent="onDrop"
        >
          <input ref="fileInput" type="file" accept="image/*" class="sr-only" @change="onFileChange" />
          <img v-if="block.config.imageUrl" :src="block.config.imageUrl" class="h-28 w-full object-cover" alt="" />
          <div v-else class="pointer-events-none flex flex-col items-center gap-1.5 px-4 py-8 text-center">
            <p class="text-xs font-medium text-[var(--studio-muted)]">Glisser une image ici</p>
            <p class="text-[11px] text-[var(--studio-faint)]">ou cliquer pour parcourir</p>
          </div>
          <div v-if="uploading" class="absolute inset-0 flex items-center justify-center bg-white/70">
            <span class="text-xs text-[var(--studio-muted)]">Envoi…</span>
          </div>
          <button
            v-if="block.config.imageUrl && !uploading"
            type="button"
            class="absolute right-1.5 top-1.5 rounded-lg bg-white/90 p-1 text-[var(--studio-muted)] shadow-sm hover:text-red-500"
            @click.stop="set('imageUrl', '')"
          >✕</button>
        </div>
        <p v-if="uploadError" class="text-[11px] text-red-500">{{ uploadError }}</p>
        <FieldText
          :model-value="block.config.imageAlt ?? ''"
          label="Texte alternatif"
          placeholder="Description de l'image"
          @update:model-value="set('imageAlt', $event)"
        />
        <FieldText
          :model-value="block.config.imageCaption ?? ''"
          label="Légende"
          placeholder="Source : …"
          @update:model-value="set('imageCaption', $event)"
        />
      </InspectorSection>
      <InspectorSection label="Mise en page">
        <FieldSegmented
          :model-value="block.config.imageWidth ?? 'full'"
          label="Largeur"
          :options="WIDTHS"
          @update:model-value="set('imageWidth', $event as BlockConfig['imageWidth'])"
        />
        <FieldSegmented
          :model-value="block.config.imageAlign ?? 'center'"
          label="Alignement"
          :options="ALIGNS"
          @update:model-value="set('imageAlign', $event as BlockConfig['imageAlign'])"
        />
      </InspectorSection>
    </template>

    <!-- VIDEO -->
    <template v-else-if="block.type === 'video'">
      <InspectorSection label="Vidéo">
        <FieldText
          :model-value="block.config.videoUrl ?? ''"
          label="Lien vidéo"
          hint="YouTube · Vimeo · Dailymotion"
          placeholder="https://www.youtube.com/watch?v=…"
          @update:model-value="set('videoUrl', $event)"
        />
        <FieldText
          :model-value="block.config.videoCaption ?? ''"
          label="Légende"
          placeholder="Description de la vidéo"
          @update:model-value="set('videoCaption', $event)"
        />
        <FieldNote>Lecteur intégré en iframe au ratio 16:9, avec badge du fournisseur détecté automatiquement.</FieldNote>
      </InspectorSection>
    </template>

    <!-- MAP -->
    <template v-else-if="block.type === 'map'">
      <InspectorSection label="Point GPS">
        <FieldText :model-value="block.config.mapLat ?? ''" label="Latitude" :placeholder="`ex. 45.75781 ou ${TOKEN_HINT}`" @update:model-value="set('mapLat', $event)" />
        <FieldText :model-value="block.config.mapLng ?? ''" label="Longitude" :placeholder="`ex. 4.83201 ou ${TOKEN_HINT}`" @update:model-value="set('mapLng', $event)" />
        <FieldText :model-value="block.config.mapLabel ?? ''" label="Libellé" placeholder="Nom du lieu (optionnel)" @update:model-value="set('mapLabel', $event)" />
        <FieldNote>Les jetons {{ TOKEN_HINT }} sont résolus — utile sur une page générée par valeur.</FieldNote>
      </InspectorSection>
    </template>

    <!-- FIELD-GRID -->
    <template v-else-if="block.type === 'field-grid'">
      <InspectorSection label="Grille de champs">
        <FieldSegmented
          :model-value="String(block.config.fieldGridColumns ?? 3)"
          label="Colonnes"
          :options="[{ label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }]"
          @update:model-value="set('fieldGridColumns', Number($event) as 2 | 3 | 4)"
        />
        <div class="flex flex-col gap-2">
          <div v-for="(it, i) in gridItems" :key="i" class="flex items-center gap-1.5">
            <input :value="it.label" type="text" placeholder="Libellé" class="mb-input w-[110px] shrink-0" @change="updateGridItem(i, 'label', ($event.target as HTMLInputElement).value)" />
            <input :value="it.value" type="text" placeholder="Valeur ({{ '{{jeton}}' }} ok)" class="mb-input min-w-0 flex-1" @change="updateGridItem(i, 'value', ($event.target as HTMLInputElement).value)" />
            <button type="button" class="shrink-0 text-[12px] text-[var(--studio-faint)] hover:text-red-400" @click="removeGridItem(i)">✕</button>
          </div>
          <button type="button" class="text-[11px] font-bold text-[var(--color-primary)]" @click="addGridItem">+ Ajouter une paire</button>
        </div>
      </InspectorSection>
    </template>

    <!-- BUTTON / LINK-CARD / RETENIR -->
    <template v-else>
      <FieldPicker
        :label="editorialPicker.label"
        :value="editorialPicker.value"
        action="Configurer"
        @open="showModal = true"
      />
      <EditorialContentModal :show="showModal" :block="block" @close="showModal = false" />
    </template>
  </div>
</template>

<style scoped>
@reference "tailwindcss";
.mb-input {
  box-sizing: border-box;
  padding: 8px 10px;
  border-radius: 9px;
  border: 1.5px solid var(--studio-line-strong);
  font-size: 12px;
  color: var(--studio-ink);
  background: #fff;
}
.mb-input:focus { outline: none; border-color: var(--color-primary); }
</style>
