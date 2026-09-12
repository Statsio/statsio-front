<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import { contentPropertiesPath, publicContentPath } from '@/lib/content-display'
import { getContentCollaborators, type ContentCollaborator } from '@/api/studio'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import { getNameInitials } from '@/lib/format'

const { publishing, compact } = defineProps<{ publishing?: boolean; compact?: boolean }>()
const emit = defineEmits<{ publish: [] }>()
const studio = useStudioStore()

const isPublished = computed(() => studio.content?.status === 'published')
/** Rien à publier : déjà en ligne et aucune modification depuis (y compris brouillon autosavé). */
const upToDate = computed(() =>
  isPublished.value && !studio.isDirty && !studio.hasUnpublishedChanges,
)
const publishLabel = computed(() => {
  if (publishing) return 'Publication…'
  if (!isPublished.value) return 'Publier'
  return upToDate.value ? 'Publié' : 'Mettre à jour'
})

const settingsPath = computed(() => {
  const content = studio.content
  if (!content) return null
  return contentPropertiesPath(content.type ?? 'statsdata', content.slug)
})

const accesPath = computed(() => {
  const base = settingsPath.value
  return base ? `${base}/acces` : null
})

// Lien « voir sur la page publique » — nécessite un slug (contenu déjà enregistré).
const publicPath = computed(() => {
  const content = studio.content
  if (!content?.slug) return null
  return publicContentPath(content.type ?? 'statsdata', content.slug)
})

const isOwner = computed(() => studio.content?.access?.is_owner === true)

const dropdownRef = ref<HTMLElement | null>(null)
const shareOpen = ref(false)
const collaborators = ref<ContentCollaborator[]>([])
const collaboratorsLoading = ref(false)
const collaboratorsLoaded = ref(false)
/** True si l'API collaborateurs a répondu (propriétaire). */
const canManageCollaborators = ref(false)

const showAccessSection = computed(() => isOwner.value || canManageCollaborators.value)

async function loadCollaborators() {
  const slug = studio.content?.slug
  if (!slug) {
    collaborators.value = []
    collaboratorsLoaded.value = true
    canManageCollaborators.value = false
    return
  }
  if (studio.content?.access && !isOwner.value) {
    collaborators.value = []
    collaboratorsLoaded.value = true
    canManageCollaborators.value = false
    return
  }
  collaboratorsLoading.value = true
  try {
    collaborators.value = await getContentCollaborators(slug)
    canManageCollaborators.value = true
    collaboratorsLoaded.value = true
  } catch {
    collaborators.value = []
    canManageCollaborators.value = false
    collaboratorsLoaded.value = true
  } finally {
    collaboratorsLoading.value = false
  }
}

async function toggleShare() {
  shareOpen.value = !shareOpen.value
  if (shareOpen.value && !collaboratorsLoaded.value) {
    await loadCollaborators()
  }
}

function publish() {
  const id = studio.content?.id
  if (!id || id === 'demo') return
  shareOpen.value = false
  emit('publish')
}

watch(
  () => studio.content?.slug,
  () => {
    collaboratorsLoaded.value = false
    canManageCollaborators.value = false
    collaborators.value = []
  },
)

function onDocMousedown(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    shareOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onDocMousedown))
onUnmounted(() => document.removeEventListener('mousedown', onDocMousedown))
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <button
      type="button"
      class="studio-gradient flex items-center gap-1.5 rounded-full font-extrabold tracking-[0.06em] text-white"
      :class="compact ? 'gap-1 px-3.5 py-2 text-[11.5px]' : 'px-5 py-[11px] text-[12.5px]'"
      @click="toggleShare"
    >
      Partager
      <span class="text-[9px] opacity-80">{{ shareOpen ? '▴' : '▾' }}</span>
    </button>

    <div
      v-if="shareOpen"
      class="absolute right-0 top-11 z-[120] w-[min(320px,calc(100vw-24px))] rounded-[15px] border border-[var(--studio-line)] bg-white p-3 shadow-[var(--studio-shadow-pop)]"
    >
      <button
        type="button"
        class="w-full rounded-full px-4 py-3 text-[12.5px] font-extrabold tracking-[0.06em] transition-colors"
        :class="upToDate
          ? 'cursor-not-allowed bg-[var(--studio-wash)] text-[var(--studio-faint)]'
          : 'studio-gradient text-white disabled:opacity-50'"
        :disabled="publishing || upToDate"
        @click="publish"
      >
        {{ publishLabel }}
      </button>

      <a
        v-if="publicPath"
        :href="publicPath"
        target="_blank"
        rel="noopener"
        class="mt-2 flex w-full items-center justify-between gap-2 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-[var(--studio-ink)] transition-colors hover:bg-[var(--studio-wash)]"
        :class="!isPublished ? 'opacity-60' : ''"
        @click="shareOpen = false"
      >
        <span class="flex items-center gap-2">
          <svg class="h-4 w-4 text-[var(--studio-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          Voir la page publique
        </span>
        <span class="text-[11px] text-[var(--studio-faint)]">↗</span>
      </a>
      <p
        v-else
        class="mt-2 px-3 py-2 text-[12px] text-[var(--studio-faint)]"
      >
        Enregistrez le contenu pour obtenir un lien public.
      </p>

      <div v-if="showAccessSection" class="mt-3 border-t border-[var(--studio-line)] pt-3">
        <p class="mb-2 px-1 text-[10px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">
          Accès édition
        </p>

        <div v-if="collaboratorsLoading" class="space-y-2 px-1 py-1">
          <div class="h-9 animate-pulse rounded-lg bg-[var(--studio-wash)]" />
          <div class="h-9 animate-pulse rounded-lg bg-[var(--studio-wash)]" />
        </div>
        <template v-else>
          <p
            v-if="!collaborators.length"
            class="px-1 py-1.5 text-[12.5px] text-[var(--studio-muted)]"
          >
            Aucun collaborateur pour l’instant.
          </p>
          <div v-else class="mb-2 flex max-h-[160px] flex-col gap-0.5 overflow-y-auto">
            <div
              v-for="collab in collaborators"
              :key="collab.user_id"
              class="flex items-center gap-2.5 rounded-[10px] px-2 py-2"
            >
              <AppAvatar
                :src="collab.avatar ?? undefined"
                :initials="getNameInitials(collab.name)"
                size="sm"
                background="linear-gradient(135deg, var(--color-primary), var(--color-accent))"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-[12.5px] font-bold text-[var(--studio-ink)]">{{ collab.name }}</p>
                <p class="truncate text-[11px] text-[var(--studio-faint)]">{{ collab.email }}</p>
              </div>
            </div>
          </div>
        </template>

        <RouterLink
          v-if="accesPath"
          :to="accesPath"
          class="mt-1 flex w-full items-center justify-center rounded-full border-[1.5px] border-[var(--studio-line-strong)] px-4 py-2.5 text-[12.5px] font-bold text-[var(--studio-ink)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          @click="shareOpen = false"
        >
          Inviter
        </RouterLink>
      </div>
    </div>
  </div>
</template>
