<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMediaLibrary } from '@/composables/useMediaLibrary'
import { fetchMyMedia, uploadMedia, deleteMedia, type MediaItem } from '@/api/media'
import StudioModal from '@/components/studio/ui/StudioModal.vue'
import StudioIcon from '@/components/studio/ui/StudioIcon.vue'

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
    items.value = await fetchMyMedia(state.studioContentSlug ?? undefined)
    loadedOnce = true
  } catch {
    loadError.value = 'Impossible de charger la bibliothèque.'
  } finally {
    loading.value = false
  }
}

watch(
  () => state.open,
  (open) => {
    if (open) {
      loadedOnce = false
      load(true)
    }
  },
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
    const media = await uploadMedia(file, state.directory, state.studioContentSlug ?? undefined)
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
  <StudioModal
    v-if="state.open"
    :title="state.mode === 'pick' ? 'Choisir une image' : 'Bibliothèque de médias'"
    :subtitle="state.mode === 'pick' ? 'Une image déjà envoyée, ou un nouveau fichier.' : 'Les images de votre bibliothèque.'"
    :width="760"
    @close="close"
  >
    <div class="flex flex-col gap-4">
      <div
        class="relative flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[4px] border-2 border-dashed px-4 py-6 text-center transition-colors"
        :class="dragOver
          ? 'border-[var(--ds-ol)] bg-[var(--ds-tint)] shadow-[3px_3px_0_var(--ds-sh)]'
          : 'border-[var(--ds-divide)] bg-[var(--ds-tint)] hover:border-[var(--ds-ol)]'"
        @click="fileInput?.click()"
        @dragover.prevent="dragOver = true"
        @dragleave="dragOver = false"
        @drop.prevent="onDrop"
      >
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
        <span v-if="uploading" class="st-meta">Envoi…</span>
        <template v-else>
          <StudioIcon name="media" :size="22" class="text-[var(--ds-accent)]" />
          <p class="text-[14px] font-extrabold text-[var(--ds-text)]" style="font-family: var(--ds-display)">Glisser une image ici</p>
          <p class="st-meta">ou cliquer pour parcourir · JPG, PNG, WebP · 10 Mo max</p>
        </template>
      </div>
      <p
        v-if="uploadError"
        class="rounded-[3px] border-2 border-[var(--ds-warn-line)] bg-[var(--ds-warn-bg)] px-3 py-2 text-[12.5px] font-semibold text-[var(--ds-warn-ink)]"
      >
        {{ uploadError }}
      </p>

      <div v-if="loading" class="grid grid-cols-3 gap-3 sm:grid-cols-4">
        <div
          v-for="i in 8"
          :key="i"
          class="aspect-square animate-pulse rounded-[4px] border-2 border-[var(--ds-divide)] bg-[var(--ds-tint)]"
        />
      </div>
      <p
        v-else-if="loadError"
        class="rounded-[3px] border-2 border-[var(--ds-warn-line)] bg-[var(--ds-warn-bg)] px-3 py-6 text-center text-[13px] font-semibold text-[var(--ds-warn-ink)]"
      >
        {{ loadError }}
      </p>
      <p v-else-if="!items.length" class="py-10 text-center text-[13px] text-[var(--ds-muted)]">
        Aucune image pour l'instant. Ajoutez-en une ci-dessus.
      </p>
      <div v-else class="grid grid-cols-3 gap-3 sm:grid-cols-4">
        <div
          v-for="item in items"
          :key="item.id"
          class="group relative aspect-square overflow-hidden rounded-[4px] border-2 border-[var(--ds-divide)] bg-[var(--ds-tint)] transition-[border-color,box-shadow] hover:border-[var(--ds-ol)] hover:shadow-[3px_3px_0_var(--ds-sh)]"
        >
          <button
            type="button"
            class="block h-full w-full"
            :class="state.mode === 'pick' ? 'cursor-pointer' : 'cursor-default'"
            :disabled="state.mode !== 'pick'"
            @click="state.mode === 'pick' && select(item)"
          >
            <img :src="item.url" alt="" class="h-full w-full object-cover" loading="lazy" />
          </button>
          <span
            v-if="state.mode === 'pick'"
            class="pointer-events-none absolute inset-x-0 bottom-0 bg-[var(--ds-action)] py-1.5 text-center text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--ds-action-ink)] opacity-0 transition group-hover:opacity-100"
            style="font-family: var(--ds-display)"
          >Choisir</span>
          <button
            type="button"
            class="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-[3px] border-2 border-[var(--ds-ol)] bg-[var(--ds-surface)] text-[var(--ds-text)] opacity-0 shadow-[2px_2px_0_var(--ds-sh)] transition hover:text-[var(--ds-warn-ink)] group-hover:opacity-100 disabled:opacity-40"
            :disabled="deletingId === item.id"
            title="Supprimer de la bibliothèque"
            @click.stop="remove(item)"
          >
            <StudioIcon name="trash" :size="14" />
          </button>
        </div>
      </div>
    </div>
  </StudioModal>
</template>
