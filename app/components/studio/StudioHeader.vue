<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import { publishStatsDataDocument } from '@/api/studio'
import { contentPropertiesPath } from '@/lib/content-display'
import StudioModal from '@/components/studio/ui/StudioModal.vue'
import VariablePickerModal from '@/components/studio/VariablePickerModal.vue'
import FieldText from '@/components/studio/fields/FieldText.vue'
import { slugify } from '@/lib/slug'
import type { StudioDocumentPage } from '@/types/studio'
import studioLogo from '@/assets/brand/statsio-studio.svg'

const emit = defineEmits<{ save: [] }>()
const studio = useStudioStore()

const isPublishing = ref(false)
const isPublished = computed(() => studio.content?.status === 'published')

const settingsPath = computed(() => {
  const content = studio.content
  if (!content) return null
  return contentPropertiesPath(content.type ?? 'statsdata', content.slug)
})

// ─── Page kind badge ─────────────────────────────────────────────────────────

function pageKind(page?: StudioDocumentPage | null) {
  return (page?.params?.length ?? 0) > 0
    ? { tag: 'PARM', cls: 'bg-[#f2ecfd] text-[#7c3aed]' }
    : { tag: 'PAGE', cls: 'bg-[#eaf1fe] text-[#2563eb]' }
}

// ─── Page management ──────────────────────────────────────────────────────────

const pagesDropdownRef = ref<HTMLElement | null>(null)
const pagesOpen = ref(false)

const currentPage = computed(() => studio.pages.find((p) => p.id === studio.currentPageId))
const canRemovePage = computed(() => studio.pages.length > 1)

const editingPageId = ref<string | null>(null)
const editingPageTitle = ref('')

function startRename(id: string, title: string) {
  editingPageId.value = id
  editingPageTitle.value = title
  nextTick(() => (document.getElementById(`hdr-rename-${id}`) as HTMLInputElement)?.select())
}

function commitRename(id: string) {
  if (showPageTokenModal.value) return
  if (editingPageTitle.value.trim()) studio.updatePage(id, { title: editingPageTitle.value.trim() })
  editingPageId.value = null
}

// ─── Insert dynamic page variable (template pages) ────────────────────────────

const showPageTokenModal = ref(false)

function closePageTokenModal() {
  showPageTokenModal.value = false
  nextTick(() => (document.getElementById(`hdr-rename-${editingPageId.value}`) as HTMLInputElement)?.focus())
}

function onPickPageTitleToken(token: string) {
  editingPageTitle.value = (editingPageTitle.value ? `${editingPageTitle.value} ${token}` : token).trim()
  if (editingPageId.value) studio.updatePage(editingPageId.value, { title: editingPageTitle.value })
}

function removePage(id: string, title: string) {
  if (window.confirm(`Supprimer la page « ${title} » et tous ses blocs ?`)) {
    studio.removePage(id)
  }
}

// ─── Add page modal ──────────────────────────────────────────────────────────

const showAddModal = ref(false)
const newPageTitle = ref('')
const newPageSlug = ref('')

function openAddModal() {
  newPageTitle.value = ''
  newPageSlug.value = ''
  pagesOpen.value = false
  showAddModal.value = true
}

const newPageUrlPreview = computed(() => '/' + (newPageSlug.value || 'nouvelle-page'))

function onNewPageTitleInput() {
  newPageSlug.value = slugify(newPageTitle.value)
}

const canCreatePage = computed(() => !!newPageTitle.value.trim())

function confirmAddPage() {
  if (!canCreatePage.value) return
  const page = studio.addPage(newPageTitle.value.trim())
  if (newPageSlug.value) studio.updatePage(page.id, { slug: newPageSlug.value })
  showAddModal.value = false
}

async function publish() {
  const id = studio.content?.id
  if (!id || id === 'demo') return
  isPublishing.value = true
  try {
    await publishStatsDataDocument(id)
    if (studio.content) studio.content.status = 'published'
  } finally {
    isPublishing.value = false
  }
}

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
  const target = e.target as HTMLElement
  if (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
  const ctrl = e.ctrlKey || e.metaKey
  if (!ctrl) return
  if (e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    studio.undo()
  } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
    e.preventDefault()
    studio.redo()
  }
}

function onDocMousedown(e: MouseEvent) {
  if (showPageTokenModal.value) return
  if (pagesDropdownRef.value && !pagesDropdownRef.value.contains(e.target as Node)) {
    pagesOpen.value = false
    if (editingPageId.value) commitRename(editingPageId.value)
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('mousedown', onDocMousedown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('mousedown', onDocMousedown)
})

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
  <header
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

      <!-- Page picker -->
      <div ref="pagesDropdownRef" class="relative ml-1">
        <button
          class="flex max-w-[300px] items-center gap-[9px] rounded-full border-[1.5px] px-3 py-[7px] transition-colors"
          :class="pagesOpen
            ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)]'
            : 'border-[var(--studio-line-strong)] bg-white hover:border-[var(--color-primary)]'"
          @click="pagesOpen = !pagesOpen"
        >
          <span class="shrink-0 rounded-[5px] px-1.5 py-[3px] font-mono text-[9.5px] font-semibold" :class="pageKind(currentPage).cls">
            {{ pageKind(currentPage).tag }}
          </span>
          <span class="truncate text-[12.5px] font-bold text-[var(--studio-ink)]">{{ currentPage?.title ?? 'Page' }}</span>
          <span class="shrink-0 text-[8px] text-[var(--studio-faint)]">▾</span>
        </button>

        <div
          v-if="pagesOpen"
          class="absolute left-0 top-11 z-[120] w-[352px] rounded-[15px] border border-[var(--studio-line)] bg-white p-2 shadow-[var(--studio-shadow-pop)]"
        >
          <div class="px-2.5 pb-[7px] pt-2 text-[10px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">
            Pages de ce contenu
          </div>
          <div class="flex max-h-[290px] flex-col gap-0.5 overflow-auto">
            <div
              v-for="page in studio.pages"
              :key="page.id"
              class="group grid grid-cols-[34px_1fr_16px] items-center gap-2.5 rounded-[10px] px-2.5 py-[9px] transition-colors"
              :class="studio.currentPageId === page.id ? 'bg-[var(--studio-accent-wash)]' : 'hover:bg-[var(--studio-wash)]'"
            >
              <span class="rounded-[5px] py-[3px] text-center font-mono text-[9px] font-semibold" :class="pageKind(page).cls">
                {{ pageKind(page).tag }}
              </span>
              <button
                v-if="editingPageId !== page.id"
                class="min-w-0 text-left"
                @click="studio.switchPage(page.id); pagesOpen = false"
              >
                <span class="block truncate text-[12.5px] font-bold text-[var(--studio-ink)]">{{ page.title }}</span>
                <span class="mt-0.5 block truncate font-mono text-[10px] text-[var(--studio-faint)]">{{ page.slug ? '/' + page.slug : '—' }}</span>
              </button>
              <div v-else class="relative min-w-0">
                <input
                  :id="`hdr-rename-${page.id}`"
                  v-model="editingPageTitle"
                  class="studio-input !py-1.5 !pr-7 !text-[12.5px]"
                  @click.stop
                  @blur="commitRename(page.id)"
                  @keydown.enter.stop="commitRename(page.id)"
                  @keydown.escape.stop="editingPageId = null"
                />
                <button
                  type="button"
                  class="studio-tag absolute right-1 top-1/2 -translate-y-1/2 !py-0.5 text-[10px]"
                  title="Insérer une variable de page"
                  @mousedown.prevent="showPageTokenModal = true"
                  @click.stop
                >{ }</button>
              </div>
              <span class="text-center text-[11px] text-[var(--color-primary)]">
                <template v-if="studio.currentPageId === page.id && editingPageId !== page.id">✓</template>
                <span v-else class="hidden items-center gap-0.5 group-hover:flex">
                  <button class="text-[var(--studio-faint)] hover:text-[var(--studio-ink)]" title="Renommer" @click.stop="startRename(page.id, page.title)">✎</button>
                  <button v-if="canRemovePage" class="text-[var(--studio-faint)] hover:text-[var(--color-error)]" title="Supprimer" @click.stop="removePage(page.id, page.title)">✕</button>
                </span>
              </span>
            </div>
          </div>
          <button
            class="mt-1.5 w-full border-t border-[var(--studio-line)] p-[11px] text-center text-[12.5px] font-bold text-[var(--color-primary)]"
            @click="openAddModal"
          >
            + Nouvelle page
          </button>
        </div>
      </div>
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
        class="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--studio-muted)] transition-colors hover:bg-[var(--studio-wash)]"
        title="Enregistrer (⌘S)"
        @click="emit('save')"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
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

      <button
        type="button"
        class="studio-gradient rounded-full px-5 py-[11px] text-[12.5px] font-extrabold tracking-[0.08em] text-white disabled:opacity-50"
        :disabled="isPublishing"
        @click="publish"
      >
        {{ isPublishing ? 'PUBLICATION…' : isPublished ? '✓ PUBLIÉ' : 'PUBLIER' }}
      </button>
    </div>
  </header>

  <!-- Add page modal -->
  <StudioModal
    v-if="showAddModal"
    title="Nouvelle page"
    subtitle="La page est ajoutée à ce contenu et partage ses sources de données."
    :width="520"
    @close="showAddModal = false"
  >
    <div class="flex flex-col gap-4">
      <FieldText
        v-model="newPageTitle"
        label="Titre de la page"
        placeholder="ex. Prix par département"
        @update:model-value="onNewPageTitleInput"
      />
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-[11.5px] text-[var(--studio-muted)]">URL</span>
        <span class="studio-tag text-[11px]">{{ newPageUrlPreview }}</span>
      </div>
      <p class="text-[11.5px] leading-relaxed text-[var(--studio-faint)]">
        Pour une page pilotée par une valeur (carburant, commune…), ajoutez ensuite un bloc
        <b>Paramètre</b> ou <b>Recherche</b> : les blocs qui filtrent sur ce paramètre se
        rechargent automatiquement.
      </p>
    </div>
    <template #footer>
      <button type="button" class="text-[13px] font-bold text-[var(--studio-faint)]" @click="showAddModal = false">Annuler</button>
      <button
        type="button"
        class="studio-gradient rounded-[10px] px-[22px] py-3 text-[13.5px] font-bold text-white disabled:opacity-40"
        :disabled="!canCreatePage"
        @click="confirmAddPage"
      >
        Créer la page
      </button>
    </template>
  </StudioModal>

  <!-- Insertion de variable dynamique (pages template) -->
  <VariablePickerModal
    v-if="showPageTokenModal"
    :page-id="editingPageId ?? undefined"
    context="titre de la page"
    @pick="onPickPageTitleToken"
    @close="closePageTokenModal"
  />
</template>
