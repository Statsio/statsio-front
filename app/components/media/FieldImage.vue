<script setup lang="ts">
import { ref } from 'vue'
import { useMediaLibrary } from '@/composables/useMediaLibrary'
import { uploadMedia } from '@/api/media'

const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    /** Répertoire de destination des uploads. */
    directory?: string
    /** Ratio du cadre d'aperçu. */
    ratio?: 'video' | 'square' | 'wide'
  }>(),
  { label: '', hint: '', directory: 'studio/images', ratio: 'video' },
)

/** URL de l'image (source de vérité pour l'affichage). */
const model = defineModel<string>({ default: '' })
/** Id du média lié en bibliothèque (optionnel). */
const mediaId = defineModel<number | undefined>('mediaId', { default: undefined })

const { open } = useMediaLibrary()
const uploading = ref(false)
const error = ref('')
const dragOver = ref(false)

const ratioClass = { video: 'aspect-video', square: 'aspect-square', wide: 'aspect-[3/1]' }[props.ratio]

function choose() {
  open({
    mode: 'pick',
    directory: props.directory,
    onSelect: (media) => {
      model.value = media.url
      mediaId.value = media.id
    },
  })
}

function clear() {
  model.value = ''
  mediaId.value = undefined
}

async function uploadDirect(file: File) {
  if (!file.type.startsWith('image/')) { error.value = 'Seules les images sont acceptées.'; return }
  error.value = ''
  uploading.value = true
  try {
    const media = await uploadMedia(file, props.directory)
    model.value = media.url
    mediaId.value = media.id
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Échec de l'upload."
  } finally {
    uploading.value = false
  }
}
function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) uploadDirect(file)
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-xs font-semibold text-slate-500">{{ label }}</label>

    <div
      class="relative overflow-hidden rounded-xl border-2 border-dashed transition-colors"
      :class="[
        ratioClass,
        dragOver ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-slate-300',
        model ? 'border-solid' : 'bg-slate-50',
      ]"
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop.prevent="onDrop"
    >
      <img v-if="model" :src="model" alt="" class="h-full w-full object-cover" />
      <div v-else class="flex h-full flex-col items-center justify-center gap-1 px-3 text-center text-slate-400">
        <svg class="h-6 w-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
        </svg>
        <span class="text-[11px] font-medium">Aucune image</span>
      </div>
      <div v-if="uploading" class="absolute inset-0 flex items-center justify-center bg-white/70 text-xs text-slate-500">Envoi…</div>
    </div>

    <div class="flex gap-2">
      <button
        type="button"
        class="rounded-[9px] border-[1.5px] border-[var(--color-primary)] px-3 py-1.5 text-[12px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/5"
        @click="choose"
      >{{ model ? 'Changer l’image' : 'Choisir une image' }}</button>
      <button
        v-if="model"
        type="button"
        class="rounded-[9px] border-[1.5px] border-slate-200 px-3 py-1.5 text-[12px] font-bold text-slate-500 transition-colors hover:border-red-300 hover:text-red-500"
        @click="clear"
      >Retirer</button>
    </div>

    <p v-if="error" class="text-[11px] text-red-500">{{ error }}</p>
    <p v-else-if="hint" class="text-[11px] text-slate-400">{{ hint }}</p>
  </div>
</template>
