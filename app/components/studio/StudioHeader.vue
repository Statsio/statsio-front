<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import { useAuthStore } from '@/stores/auth'
import { contentPropertiesPath } from '@/lib/content-display'
import { useStudioBreakpoint } from '@/composables/useStudioBreakpoint'
import { glyphForContentType } from '@/lib/ds/types'
import { sectorPath } from '@/lib/ds/pie'
import StudioJsonModal from '@/components/studio/StudioJsonModal.vue'
import StudioShareDropdown from '@/components/studio/StudioShareDropdown.vue'
import StudioIcon from '@/components/studio/ui/StudioIcon.vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import DsButton from '@/components/ds/DsButton.vue'
import studioLogo from '@/assets/brand/statsio-studio.svg'

const emit = defineEmits<{ save: []; publish: [] }>()
const { publishing } = defineProps<{ publishing?: boolean }>()
const studio = useStudioStore()
const auth = useAuthStore()
const { isMobile } = useStudioBreakpoint()

// Outil « JSON » : réservé aux administrateurs (copie du JSON / prompt IA + import).
const showJsonModal = ref(false)
const moreOpen = ref(false)

const settingsPath = computed(() => {
  const content = studio.content
  if (!content) return null
  return contentPropertiesPath(content.type ?? 'statsdata', content.slug)
})

// ─── Type de contenu (indicateur, non cliquable : fixé à la création) ─────────
const TYPE_LABEL = { statsdata: 'StatsData', article: 'Article', survey: 'Sondage' } as const
const typeKey = computed(() => studio.content?.type ?? 'statsdata')
const typeLabel = computed(() => TYPE_LABEL[typeKey.value])
const typeGlyph = computed(() => glyphForContentType(typeKey.value))

// ─── Titre ────────────────────────────────────────────────────────────────────
const isEditingTitle = ref(false)
const titleInput = ref<HTMLInputElement | null>(null)

function startEditTitle() {
  isEditingTitle.value = true
  setTimeout(() => titleInput.value?.select(), 0)
}
function commitTitle(e: Event) {
  const val = (e.target as HTMLInputElement).value.trim()
  if (val) studio.setTitle(val)
  isEditingTitle.value = false
}
function handleTitleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
  if (e.key === 'Escape') isEditingTitle.value = false
}

// ─── État d'enregistrement ────────────────────────────────────────────────────
const savedAt = ref<Date | null>(studio.content?.updated_at ? new Date(studio.content.updated_at) : null)
watch(
  () => studio.saveStatus,
  (s) => {
    if (s === 'saved') savedAt.value = new Date()
  },
)
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
const saveLabel = computed(() => {
  switch (studio.saveStatus) {
    case 'saving': return 'Enregistrement…'
    case 'error': return 'Erreur d’enregistrement'
    default:
      if (studio.isDirty) return 'Modifications non enregistrées'
      return savedAt.value ? `Brouillon enregistré à ${hhmm(savedAt.value)}` : 'Brouillon enregistré'
  }
})
const fullPie = sectorPath(6, 6, 5, -90, 270)

// ─── Publication ─────────────────────────────────────────────────────────────
const isPublished = computed(() => studio.content?.status === 'published')
const upToDate = computed(() => isPublished.value && !studio.isDirty && !studio.hasUnpublishedChanges)
const canPublish = computed(() => !!studio.content?.id && studio.content.id !== 'demo')
const publishLabel = computed(() => {
  if (publishing) return 'Publication…'
  if (!isPublished.value) return 'Publier'
  return upToDate.value ? 'Publié' : 'Mettre à jour'
})
function publish() {
  if (!canPublish.value || publishing || upToDate.value) return
  emit('publish')
}

function onMoreBlur(e: FocusEvent) {
  const next = e.relatedTarget as Node | null
  if (!next || !(e.currentTarget as HTMLElement).contains(next)) moreOpen.value = false
}
</script>

<template>
  <header class="st-hd" :class="isMobile ? '!h-14 !gap-2 !px-3' : ''">
    <!-- Marque -->
    <a href="/" class="flex flex-none items-center gap-2" aria-label="Retour au site">
      <img :src="studioLogo" alt="" class="h-7 w-7" />
      <span v-if="!isMobile" class="st-wm"><span class="text-[var(--ds-violet-500)]">STAT</span><span class="text-[var(--ds-blue-500)]">SIO</span></span>
      <span class="st-wm-studio">Studio</span>
    </a>

    <!-- Titre + état d'enregistrement -->
    <div v-if="!isMobile" class="st-docid hidden xl:flex">
      <input
        v-if="isEditingTitle"
        ref="titleInput"
        type="text"
        class="studio-input !h-7 !py-0 max-w-[34ch] text-[14px] font-bold"
        :value="studio.content?.title ?? ''"
        aria-label="Titre du contenu"
        @blur="commitTitle"
        @keydown="handleTitleKeydown"
      />
      <button
        v-else
        type="button"
        class="max-w-[34ch] truncate text-left text-[14px] font-bold"
        title="Renommer"
        @click="startEditTitle"
      >{{ studio.content?.title || 'Sans titre' }}</button>
      <span class="st-save" :class="{ 'st-save--busy': studio.saveStatus === 'saving', 'st-save--error': studio.saveStatus === 'error' }" aria-live="polite">
        <StudioIcon v-if="studio.saveStatus === 'saving'" name="refresh" :size="12" />
        <svg v-else width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <circle cx="6" cy="6" r="5" fill="var(--ds-line)" />
          <path v-if="!studio.isDirty" :d="fullPie" fill="var(--ds-t1)" />
          <circle cx="6" cy="6" r="5" fill="none" stroke="var(--ds-ol)" stroke-width="1.2" />
        </svg>
        {{ saveLabel }}
      </span>
    </div>

    <!-- Type de contenu -->
    <span class="st-type mx-auto" :class="isMobile ? '!h-8 !px-2' : ''" :title="`Type de contenu : ${typeLabel}`">
      <DsTypeGlyph :kind="typeGlyph" :size="15" />
      <span v-if="!isMobile">{{ typeLabel }}</span>
    </span>

    <!-- Actions -->
    <div class="flex flex-none items-center gap-1.5">
      <button class="st-ibtn" type="button" :disabled="!studio.canUndo" title="Annuler (Ctrl+Z)" aria-label="Annuler (Ctrl+Z)" @click="studio.undo()">
        <StudioIcon name="undo" :size="17" />
      </button>
      <button class="st-ibtn" type="button" :disabled="!studio.canRedo" title="Rétablir (Ctrl+Maj+Z)" aria-label="Rétablir (Ctrl+Maj+Z)" @click="studio.redo()">
        <StudioIcon name="redo" :size="17" />
      </button>

      <template v-if="!isMobile">
        <span class="st-hd-sep" aria-hidden="true" />
        <button
          class="st-ibtn"
          type="button"
          aria-label="Aperçu ordinateur"
          title="Aperçu ordinateur"
          :aria-pressed="studio.previewDevice === 'desktop'"
          @click="studio.setPreviewDevice('desktop')"
        >
          <StudioIcon name="desktop" :size="17" />
        </button>
        <button
          class="st-ibtn"
          type="button"
          aria-label="Aperçu mobile"
          title="Aperçu mobile"
          :aria-pressed="studio.previewDevice === 'mobile'"
          @click="studio.setPreviewDevice('mobile')"
        >
          <StudioIcon name="mobile" :size="17" />
        </button>
      </template>

      <StudioShareDropdown :compact="isMobile" />

      <!-- Plus : propriétés, JSON (admin) -->
      <div class="relative" @focusout="onMoreBlur">
        <button
          class="st-ibtn"
          type="button"
          aria-label="Plus d’actions"
          aria-haspopup="menu"
          :aria-expanded="moreOpen"
          :aria-pressed="moreOpen"
          @click="moreOpen = !moreOpen"
        >
          <StudioIcon name="more" :size="17" />
        </button>
        <div v-if="moreOpen" class="st-pop !absolute right-0 top-11 !z-[120]" role="menu">
          <button v-if="isMobile" type="button" class="st-it" role="menuitem" @click="startEditTitle(); moreOpen = false">
            <span class="st-tg"><StudioIcon name="pen" :size="16" /></span>
            <span><b>Renommer</b><small class="block truncate">{{ studio.content?.title || 'Sans titre' }}</small></span>
          </button>
          <RouterLink v-if="settingsPath" :to="settingsPath" class="st-it" role="menuitem" @click="moreOpen = false">
            <span class="st-tg"><StudioIcon name="gear" :size="16" /></span>
            <span><b>Paramètres du contenu</b><small>Adresse, catégories, accès, historique</small></span>
          </RouterLink>
          <button v-if="auth.isAdmin" type="button" class="st-it" role="menuitem" @click="showJsonModal = true; moreOpen = false">
            <span class="st-tg"><StudioIcon name="code" :size="16" /></span>
            <span><b>JSON du contenu</b><small>Admin : copier, prompt IA, importer</small></span>
          </button>
        </div>
      </div>

      <DsButton
        variant="secondary"
        size="sm"
        :aria-pressed="studio.isPreview"
        @click="studio.togglePreview()"
      >
        <StudioIcon :name="studio.isPreview ? 'pen' : 'eye'" :size="15" />
        <span v-if="!isMobile">{{ studio.isPreview ? 'Modifier' : 'Aperçu' }}</span>
      </DsButton>
      <DsButton size="sm" :disabled="!canPublish || publishing || upToDate" @click="publish">
        <span>{{ publishLabel }}</span><span v-if="!upToDate" aria-hidden="true">→</span>
      </DsButton>
    </div>
  </header>

  <!-- Renommer (mobile) -->
  <Teleport to="body">
    <div v-if="isMobile && isEditingTitle" class="st-pop !left-3 !right-3 !top-16 !w-auto" role="dialog" aria-label="Renommer">
      <label class="st-lbl" for="st-title-m">Titre</label>
      <input
        id="st-title-m"
        ref="titleInput"
        type="text"
        class="studio-input"
        :value="studio.content?.title ?? ''"
        @blur="commitTitle"
        @keydown="handleTitleKeydown"
      />
    </div>
  </Teleport>

  <StudioJsonModal v-if="showJsonModal" @close="showJsonModal = false" />
</template>
