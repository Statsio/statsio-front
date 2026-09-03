<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMediaLibrary } from '@/composables/useMediaLibrary'
import { fetchMyMedia, uploadMedia, deleteMedia, type MediaItem } from '@/api/media'

const { state, select, close } = useMediaLibrary()

const items = ref<MediaItem[]>([])
const loading = ref(false)
const loadError = ref('')
const uploading = ref(false)
const uploadError = ref('')
const dragOver = ref(false)
const deletingId = ref<number | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

let loadedOnce = false

async function load(force = false) {
  if (loading.value || (loadedOnce && !force)) return
  loading.value = true
  loadError.value = ''
  try {
    items.value = await fetchMyMedia()
    loadedOnce = true
  } catch {
    loadError.value = 'Impossible de charger la bibliothèque.'
  } finally {
    loading.value = false
  }
}

watch(
  () => state.open,
  (open) => { if (open) load() },
  { immediate: true },
)

async function upload(file: File) {
  if (!file.type.startsWith('image/')) {
    uploadError.value = 'Seules les images sont acceptées.'
    return
  }
  uploadError.value = ''
  uploading.value = true
  try {
    const media = await uploadMedia(file, state.directory)
    items.value = [media, ...items.value]
    if (state.mode === 'pick') select(media)
  } catch (e: unknown) {
    uploadError.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Échec de l'upload."
  } finally {
    uploading.value = false
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) upload(input.files[0])
  input.value = ''
}
function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) upload(file)
}

async function remove(item: MediaItem) {
  if (deletingId.value) return
  if (!window.confirm('Supprimer définitivement cette image de votre bibliothèque ?')) return
  deletingId.value = item.id
  try {
    await deleteMedia(item.id)
    items.value = items.value.filter((m) => m.id !== item.id)
  } catch {
    uploadError.value = 'Suppression impossible.'
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <AppModal
    :open="state.open"
    :title="state.mode === 'pick' ? 'Choisir une image' : 'Bibliothèque de médias'"
    size="lg"
    @close="close"
  >
    <div class="flex flex-col gap-4">
      <!-- Upload zone -->
      <div
        class="relative flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors"
        :class="dragOver ? 'border-primary bg-primary/5' : 'border-slate-300 bg-slate-50 hover:border-primary/60'"
        @click="fileInput?.click()"
        @dragover.prevent="dragOver = true"
        @dragleave="dragOver = false"
        @drop.prevent="onDrop"
      >
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
        <span v-if="uploading" class="text-sm text-slate-500">Envoi…</span>
        <template v-else>
          <p class="text-sm font-semibold text-slate-700">Glisser une image ici</p>
          <p class="text-xs text-slate-400">ou cliquer pour parcourir · JPG, PNG, WebP · 10 Mo max</p>
        </template>
      </div>
      <p v-if="uploadError" class="text-xs text-red-500">{{ uploadError }}</p>

      <!-- Grid -->
      <div v-if="loading" class="grid grid-cols-3 gap-3 sm:grid-cols-4">
        <div v-for="i in 8" :key="i" class="aspect-square animate-pulse rounded-lg bg-slate-100" />
      </div>
      <p v-else-if="loadError" class="py-8 text-center text-sm text-red-500">{{ loadError }}</p>
      <p v-else-if="!items.length" class="py-10 text-center text-sm text-slate-400">
        Aucune image pour l'instant. Ajoutez-en une ci-dessus.
      </p>
      <div v-else class="grid max-h-[46vh] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
        <div
          v-for="item in items"
          :key="item.id"
          class="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
        >
          <button
            type="button"
            class="block h-full w-full"
            :class="state.mode === 'pick' ? 'cursor-pointer' : 'cursor-default'"
            :disabled="state.mode !== 'pick'"
            @click="state.mode === 'pick' && select(item)"
          >
            <img :src="item.url" alt="" class="h-full w-full object-cover transition group-hover:opacity-90" loading="lazy" />
          </button>
          <span
            v-if="state.mode === 'pick'"
            class="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/0 text-xs font-bold text-white opacity-0 transition group-hover:bg-primary/30 group-hover:opacity-100"
          >Choisir</span>
          <button
            type="button"
            class="absolute right-1 top-1 rounded-md bg-white/90 p-1 text-slate-500 opacity-0 shadow-sm transition hover:text-red-500 group-hover:opacity-100 disabled:opacity-40"
            :disabled="deletingId === item.id"
            title="Supprimer de la bibliothèque"
            @click.stop="remove(item)"
          >
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </AppModal>
</template>
