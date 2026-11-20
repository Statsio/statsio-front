<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import { contentPropertiesPath, publicContentPath } from '@/lib/content-display'
import { getContentCollaborators, type ContentCollaborator } from '@/api/studio'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import StudioIcon from '@/components/studio/ui/StudioIcon.vue'
import { getNameInitials } from '@/lib/format'

const { compact } = defineProps<{ compact?: boolean }>()
const studio = useStudioStore()

const isPublished = computed(() => studio.content?.status === 'published')

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
      class="st-ibtn"
      :aria-pressed="shareOpen"
      aria-haspopup="dialog"
      title="Partager"
      aria-label="Partager"
      @click="toggleShare"
    >
      <StudioIcon name="share" :size="17" />
    </button>

    <div
      v-if="shareOpen"
      class="st-pop !absolute right-0 top-11 !z-[120] w-[min(320px,calc(100vw-24px))]"
      :class="compact ? '!fixed !left-3 !right-3 !top-14 !w-auto' : ''"
      role="dialog"
      aria-label="Partager"
    >
      <a
        v-if="publicPath"
        :href="publicPath"
        target="_blank"
        rel="noopener"
        class="st-it"
        :class="!isPublished ? 'opacity-60' : ''"
        @click="shareOpen = false"
      >
        <span class="st-tg"><StudioIcon name="eye" :size="16" /></span>
        <span><b>Voir la page publique</b><small>{{ isPublished ? 'Ouvre un nouvel onglet' : 'Pas encore publiée' }}</small></span>
      </a>
      <p v-else class="st-hint px-1.5 py-1">Enregistrez le contenu pour obtenir un lien public.</p>

      <div v-if="showAccessSection" class="mt-1 border-t-2 border-[var(--ds-divide)] pt-3">
        <p class="st-lbl mb-2 px-1">Accès édition</p>

        <div v-if="collaboratorsLoading" class="space-y-2 px-1 py-1">
          <div class="h-9 animate-pulse rounded-[3px] bg-[var(--ds-tint)]" />
          <div class="h-9 animate-pulse rounded-[3px] bg-[var(--ds-tint)]" />
        </div>
        <template v-else>
          <p v-if="!collaborators.length" class="st-hint px-1 py-1.5">Aucun collaborateur pour l’instant.</p>
          <div v-else class="mb-2 flex max-h-[160px] flex-col gap-0.5 overflow-y-auto">
            <div v-for="collab in collaborators" :key="collab.user_id" class="flex items-center gap-2.5 px-2 py-2">
              <AppAvatar
                :src="collab.avatar ?? undefined"
                :initials="getNameInitials(collab.name)"
                size="sm"
                background="var(--ds-action)"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-[12.5px] font-bold">{{ collab.name }}</p>
                <p class="st-meta truncate">{{ collab.email }}</p>
              </div>
            </div>
          </div>
        </template>

        <RouterLink v-if="accesPath" :to="accesPath" class="st-add-ghost w-full justify-center" @click="shareOpen = false">
          <StudioIcon name="plus" :size="14" />Inviter
        </RouterLink>
      </div>
    </div>
  </div>
</template>
