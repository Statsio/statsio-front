<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import { useAuthStore } from '@/stores/auth'
import { contentPropertiesPath } from '@/lib/content-display'
import { useStudioBreakpoint } from '@/composables/useStudioBreakpoint'
import StudioJsonModal from '@/components/studio/StudioJsonModal.vue'
import StudioShareDropdown from '@/components/studio/StudioShareDropdown.vue'
import StudioPagePicker from '@/components/studio/StudioPagePicker.vue'
import studioLogo from '@/assets/brand/statsio-studio.svg'

const emit = defineEmits<{ save: []; publish: [] }>()
const studio = useStudioStore()
const auth = useAuthStore()
const { isMobile } = useStudioBreakpoint()

// Outil « JSON » : réservé aux administrateurs (copie du JSON / prompt IA + import).
const showJsonModal = ref(false)
const mobileMenuOpen = ref(false)

defineProps<{ publishing?: boolean }>()

const settingsPath = computed(() => {
  const content = studio.content
  if (!content) return null
  return contentPropertiesPath(content.type ?? 'statsdata', content.slug)
})

// ─── Document title ──────────────────────────────────────────────────────────

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

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────

function onKeydown(e: KeyboardEvent) {
  const ctrl = e.ctrlKey || e.metaKey
  // Ctrl/Cmd+S : enregistrer — actif même en train de saisir dans un bloc.
  if (ctrl && (e.key === 's' || e.key === 'S')) {
    e.preventDefault()
    emit('save')
    return
  }
  const target = e.target as HTMLElement
  if (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
  if (!ctrl) return
  if (e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    studio.undo()
  } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
    e.preventDefault()
    studio.redo()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// ─── Save status ──────────────────────────────────────────────────────────────

const saveLabel = computed(() => {
  switch (studio.saveStatus) {
    case 'saving': return 'Enregistrement…'
    case 'saved': return 'Enregistré'
    case 'error': return 'Erreur'
    default: return studio.isDirty ? 'Modifications non sauvegardées' : 'À jour'
  }
})

const saveDotClass = computed(() => {
  switch (studio.saveStatus) {
    case 'saving': return 'bg-amber-400 animate-pulse'
    case 'saved': return 'bg-emerald-400'
    case 'error': return 'bg-red-400'
    default: return studio.isDirty ? 'bg-amber-400' : 'bg-slate-300'
  }
})
</script>

<template>
  <!-- ─── Desktop header ────────────────────────────────────────────────────── -->
  <header
    v-if="!isMobile"
    class="flex h-[66px] shrink-0 items-center justify-between gap-[18px] border-b border-[var(--studio-line)] bg-white px-5 font-sans"
  >
    <!-- Left: toggle + logo + page picker -->
    <div class="flex shrink-0 items-center gap-[13px]">
      <button
        class="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] text-[15px] text-[var(--studio-muted)] transition-colors hover:bg-[var(--studio-wash)]"
        title="Afficher / masquer le panneau"
        @click="studio.setLeftTab(studio.activeLeftTab)"
      >
        <svg class="h-[17px] w-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <a href="/" class="flex items-center gap-[9px] transition-opacity hover:opacity-80">
        <img :src="studioLogo" alt="Statsio Studio" class="h-8 w-8 shrink-0 rounded-[10px]" />
        <span class="hidden text-[14px] font-extrabold uppercase tracking-[0.14em] text-[var(--studio-ink)] sm:block">Studio</span>
      </a>

      <!-- Undo / redo -->
      <div class="flex shrink-0 items-center">
        <button
          class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          :class="studio.canUndo ? 'text-[var(--studio-muted)] hover:bg-[var(--studio-wash)]' : 'cursor-not-allowed text-[var(--studio-line-strong)]'"
          title="Annuler (Ctrl+Z)"
          :disabled="!studio.canUndo"
          @click="studio.undo()"
        >
          <svg class="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </svg>
        </button>
        <button
          class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          :class="studio.canRedo ? 'text-[var(--studio-muted)] hover:bg-[var(--studio-wash)]' : 'cursor-not-allowed text-[var(--studio-line-strong)]'"
          title="Rétablir (Ctrl+Y)"
          :disabled="!studio.canRedo"
          @click="studio.redo()"
        >
          <svg class="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 15l6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" />
          </svg>
        </button>
      </div>

      <!-- Page picker (StatsData uniquement — article/sondage = page unique) -->
      <StudioPagePicker v-if="studio.supportsPages" />
    </div>

    <!-- Center: editable title -->
    <input
      v-if="isEditingTitle"
      ref="titleInput"
      type="text"
      class="min-w-0 max-w-[460px] flex-1 rounded-[9px] border-[1.5px] border-[var(--color-primary)] bg-white px-3 py-[9px] text-center text-[16.5px] font-semibold text-[var(--studio-ink)] focus:outline-none"
      :value="studio.content?.title ?? ''"
      @blur="commitTitle"
      @keydown="handleTitleKeydown"
    />
    <button
      v-else
      class="min-w-0 max-w-[460px] flex-1 truncate rounded-[9px] border-[1.5px] border-transparent px-3 py-[9px] text-center text-[16.5px] font-semibold text-[var(--studio-ink)] transition-colors hover:border-[var(--studio-line-strong)]"
      @click="startEditTitle"
    >
      {{ studio.content?.title || 'Sans titre' }}
    </button>

    <!-- Right: save status + actions -->
    <div class="flex shrink-0 items-center gap-3">
      <div class="hidden items-center gap-[7px] sm:flex">
        <span class="h-[7px] w-[7px] shrink-0 rounded-full" :class="saveDotClass" />
        <span class="text-[13px] text-[var(--studio-muted)]">{{ saveLabel }}</span>
      </div>

      <button
        v-if="auth.isAdmin"
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--studio-muted)] transition-colors hover:bg-[var(--studio-wash)]"
        title="JSON du contenu (admin) — copier le JSON / le prompt IA, importer un JSON"
        @click="showJsonModal = true"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.25 6.75 22.5 12l-5.25 5.25M6.75 17.25 1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
        </svg>
      </button>

      <RouterLink
        v-if="settingsPath"
        :to="settingsPath"
        class="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--studio-muted)] transition-colors hover:bg-[var(--studio-wash)]"
        title="Paramètres du contenu"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      </RouterLink>

      <button
        type="button"
        class="rounded-full border-[1.5px] px-3.5 py-[9px] text-[12.5px] font-bold transition-colors"
        :class="studio.isPreview
          ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--color-primary)]'
          : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)] hover:border-[var(--color-primary)]'"
        title="Aperçu"
        @click="studio.togglePreview()"
      >
        {{ studio.isPreview ? 'Éditer' : 'Aperçu' }}
      </button>

      <StudioShareDropdown :publishing="publishing" @publish="emit('publish')" />
    </div>
  </header>

  <!-- ─── Mobile header : burger + logo + statut + partager ────────────────── -->
  <header
    v-else
    class="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[var(--studio-line)] bg-white px-3 font-sans"
  >
    <div class="flex min-w-0 items-center gap-2">
      <button
        type="button"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-[var(--studio-muted)] transition-colors hover:bg-[var(--studio-wash)]"
        aria-label="Ouvrir le menu"
        @click="mobileMenuOpen = true"
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <a href="/" class="flex min-w-0 items-center gap-2">
        <img :src="studioLogo" alt="Statsio Studio" class="h-7 w-7 shrink-0 rounded-[8px]" />
        <span class="truncate text-[13px] font-extrabold uppercase tracking-[0.12em] text-[var(--studio-ink)]">Studio</span>
      </a>
    </div>

    <div class="flex shrink-0 items-center gap-2.5">
      <span class="h-[7px] w-[7px] shrink-0 rounded-full" :class="saveDotClass" :title="saveLabel" aria-hidden="true" />
      <StudioShareDropdown compact :publishing="publishing" @publish="emit('publish')" />
    </div>
  </header>

  <!-- ─── Mobile menu drawer : le reste des actions du header ──────────────── -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-220 ease-out"
      enter-from-class="opacity-0 -translate-x-3"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition duration-160 ease-in"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 -translate-x-3"
    >
      <div
        v-if="isMobile && mobileMenuOpen"
        class="fixed inset-0 z-50 flex flex-col bg-white"
        role="dialog"
        aria-modal="true"
        aria-label="Menu du studio"
      >
        <div class="flex shrink-0 items-center justify-between border-b border-[var(--studio-line)] px-4 py-3">
          <span class="flex items-center gap-2">
            <img :src="studioLogo" alt="Statsio Studio" class="h-7 w-7 shrink-0 rounded-[8px]" />
            <span class="text-[13px] font-extrabold uppercase tracking-[0.12em] text-[var(--studio-ink)]">Studio</span>
          </span>
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--studio-line-strong)] text-[var(--studio-muted)] transition-colors hover:bg-[var(--studio-wash)]"
            aria-label="Fermer le menu"
            @click="mobileMenuOpen = false"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 space-y-5 overflow-y-auto p-4">
          <!-- Titre du contenu -->
          <div>
            <p class="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">Titre</p>
            <input
              v-if="isEditingTitle"
              ref="titleInput"
              type="text"
              class="w-full rounded-[9px] border-[1.5px] border-[var(--color-primary)] bg-white px-3 py-2.5 text-[15px] font-semibold text-[var(--studio-ink)] focus:outline-none"
              :value="studio.content?.title ?? ''"
              @blur="commitTitle"
              @keydown="handleTitleKeydown"
            />
            <button
              v-else
              class="w-full truncate rounded-[9px] border-[1.5px] border-[var(--studio-line-strong)] bg-white px-3 py-2.5 text-left text-[15px] font-semibold text-[var(--studio-ink)]"
              @click="startEditTitle"
            >
              {{ studio.content?.title || 'Sans titre' }}
            </button>
          </div>

          <!-- Annuler / rétablir -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--studio-line)] py-2.5 text-[13px] font-bold transition-colors"
              :class="studio.canUndo ? 'text-[var(--studio-ink)] hover:bg-[var(--studio-wash)]' : 'cursor-not-allowed text-[var(--studio-line-strong)]'"
              :disabled="!studio.canUndo"
              @click="studio.undo()"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
              </svg>
              Annuler
            </button>
            <button
              type="button"
              class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--studio-line)] py-2.5 text-[13px] font-bold transition-colors"
              :class="studio.canRedo ? 'text-[var(--studio-ink)] hover:bg-[var(--studio-wash)]' : 'cursor-not-allowed text-[var(--studio-line-strong)]'"
              :disabled="!studio.canRedo"
              @click="studio.redo()"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 15l6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" />
              </svg>
              Rétablir
            </button>
          </div>

          <!-- Pages -->
          <div v-if="studio.supportsPages">
            <p class="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">Pages</p>
            <StudioPagePicker compact />
          </div>

          <!-- Aperçu -->
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-xl border-[1.5px] px-3.5 py-2.5 text-[13px] font-bold transition-colors"
            :class="studio.isPreview
              ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--color-primary)]'
              : 'border-[var(--studio-line-strong)] text-[var(--studio-ink)]'"
            @click="studio.togglePreview()"
          >
            {{ studio.isPreview ? 'Repasser en édition' : 'Aperçu' }}
          </button>

          <!-- Paramètres du contenu -->
          <RouterLink
            v-if="settingsPath"
            :to="settingsPath"
            class="flex w-full items-center gap-2.5 rounded-xl border border-[var(--studio-line)] px-3.5 py-2.5 text-[13px] font-bold text-[var(--studio-ink)]"
            @click="mobileMenuOpen = false"
          >
            <svg class="h-4 w-4 shrink-0 text-[var(--studio-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            Paramètres du contenu
          </RouterLink>

          <!-- JSON (admin) -->
          <button
            v-if="auth.isAdmin"
            type="button"
            class="flex w-full items-center gap-2.5 rounded-xl border border-[var(--studio-line)] px-3.5 py-2.5 text-[13px] font-bold text-[var(--studio-ink)]"
            @click="showJsonModal = true; mobileMenuOpen = false"
          >
            <svg class="h-4 w-4 shrink-0 text-[var(--studio-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.25 6.75 22.5 12l-5.25 5.25M6.75 17.25 1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
            </svg>
            JSON du contenu (admin)
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Outil JSON (admin) -->
  <StudioJsonModal v-if="showJsonModal" @close="showJsonModal = false" />
</template>
