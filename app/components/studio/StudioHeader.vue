<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { publishStatsDataDocument } from '@/api/studio'
import AppButton from '@/components/ui/AppButton.vue'

const emit = defineEmits<{ save: [] }>()
const studio = useStudioStore()

const isPublishing = ref(false)
const isPublished = computed(() => studio.content?.status === 'published')

// ─── Page management ──────────────────────────────────────────────────────────

const pagesDropdownRef = ref<HTMLElement | null>(null)
const pagesOpen = ref(false)

const currentPage = computed(() => studio.pages.find(p => p.id === studio.currentPageId))
const canRemovePage = computed(() => studio.pages.length > 1)

const editingPageId = ref<string | null>(null)
const editingPageTitle = ref('')

function startRename(id: string, title: string) {
  editingPageId.value = id
  editingPageTitle.value = title
  nextTick(() => (document.getElementById(`hdr-rename-${id}`) as HTMLInputElement)?.select())
}

function commitRename(id: string) {
  if (editingPageTitle.value.trim()) studio.updatePage(id, { title: editingPageTitle.value.trim() })
  editingPageId.value = null
}

function removePage(id: string, title: string) {
  if (window.confirm(`Supprimer la page « ${title} » et tous ses blocs ?`)) {
    studio.removePage(id)
  }
}

// Add page modal
const showAddModal = ref(false)
const newPageTitle = ref('')
const newPageSlug = ref('')
const newPageDesc = ref('')
const newPageIsTemplate = ref(false)
const newPageParam = ref('')

function openAddModal() {
  newPageTitle.value = ''
  newPageSlug.value = ''
  newPageDesc.value = ''
  newPageIsTemplate.value = false
  newPageParam.value = ''
  pagesOpen.value = false
  showAddModal.value = true
  nextTick(() => (document.getElementById('hdr-page-title') as HTMLInputElement)?.focus())
}

function onNewPageTitleInput() {
  newPageSlug.value = newPageTitle.value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function confirmAddPage() {
  if (!newPageTitle.value.trim()) return
  const page = studio.addPage(newPageTitle.value.trim(), {
    isTemplate: newPageIsTemplate.value || undefined,
    paramName: newPageIsTemplate.value ? newPageParam.value.trim() || undefined : undefined,
    description: newPageDesc.value.trim() || undefined,
  })
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
  // Let Tiptap and native inputs handle their own undo/redo
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
  if (pagesDropdownRef.value && !pagesDropdownRef.value.contains(e.target as Node)) {
    pagesOpen.value = false
    if (editingPageId.value) editingPageId.value = null
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
  <header class="h-12 shrink-0 flex items-center px-4 gap-3 border-b border-slate-200 bg-white z-20">
    <!-- Left: nav toggle + logo -->
    <div class="flex items-center gap-3 shrink-0">
      <button
        class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        title="Basculer la sidebar"
        @click="studio.setLeftTab('blocks')"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
      </button>

      <a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <span class="w-6 h-6 rounded bg-[var(--color-primary)] flex items-center justify-center text-white text-[10px] font-black">S</span>
        <span class="text-sm font-bold text-slate-800 hidden sm:block">Studio</span>
      </a>
    </div>

    <!-- Undo / Redo -->
    <div class="flex items-center gap-0.5 shrink-0">
      <button
        class="p-1.5 rounded-lg transition-colors"
        :class="studio.canUndo ? 'hover:bg-slate-100 text-slate-600' : 'text-slate-300 cursor-not-allowed'"
        title="Annuler (Ctrl+Z)"
        :disabled="!studio.canUndo"
        @click="studio.undo()"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
        </svg>
      </button>
      <button
        class="p-1.5 rounded-lg transition-colors"
        :class="studio.canRedo ? 'hover:bg-slate-100 text-slate-600' : 'text-slate-300 cursor-not-allowed'"
        title="Rétablir (Ctrl+Y)"
        :disabled="!studio.canRedo"
        @click="studio.redo()"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 15l6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" />
        </svg>
      </button>
    </div>

    <div class="w-px h-5 bg-slate-200 shrink-0" />

    <!-- Pages dropdown -->
    <div ref="pagesDropdownRef" class="relative shrink-0">
      <button
        class="flex items-center gap-1.5 h-7 px-2.5 rounded-xl text-xs font-semibold transition-colors border"
        :class="pagesOpen
          ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20'
          : 'text-slate-600 hover:bg-slate-100 border-slate-200'"
        @click="pagesOpen = !pagesOpen"
      >
        <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        <span class="max-w-[120px] truncate">{{ currentPage?.title ?? 'Pages' }}</span>
        <svg
          class="w-3 h-3 text-slate-400 flex-shrink-0 transition-transform duration-150"
          :class="pagesOpen ? 'rotate-180' : ''"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <div
        v-if="pagesOpen"
        class="absolute top-full left-0 mt-1.5 z-50 bg-white border border-[var(--color-secondary)] rounded-xl shadow-2xl shadow-[var(--color-primary)]/10 min-w-[210px] py-1 overflow-hidden"
      >
        <!-- Page list -->
        <div
          v-for="page in studio.pages"
          :key="page.id"
          class="group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors"
          :class="studio.currentPageId === page.id ? 'bg-[var(--color-primary)]/8' : 'hover:bg-slate-50'"
          @click="studio.switchPage(page.id); pagesOpen = false"
        >
          <template v-if="editingPageId === page.id">
            <input
              :id="`hdr-rename-${page.id}`"
              v-model="editingPageTitle"
              class="flex-1 text-xs font-medium text-slate-800 bg-slate-100 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
              @click.stop
              @blur="commitRename(page.id)"
              @keydown.enter.stop="commitRename(page.id)"
              @keydown.escape.stop="editingPageId = null"
            />
          </template>
          <template v-else>
            <span
              class="flex-1 text-xs font-medium truncate"
              :class="studio.currentPageId === page.id ? 'text-[var(--color-primary)]' : 'text-slate-700'"
            >{{ page.title }}</span>
            <span
              v-if="page.isTemplate"
              class="text-[9px] font-bold uppercase tracking-wide px-1 py-0.5 rounded bg-amber-100 text-amber-600 flex-shrink-0"
            >tpl</span>
            <svg
              v-if="studio.currentPageId === page.id"
              class="w-3.5 h-3.5 text-[var(--color-primary)] flex-shrink-0"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <div v-else class="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
              <button
                class="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                title="Renommer"
                @click.stop="startRename(page.id, page.title)"
              >
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
                </svg>
              </button>
              <button
                v-if="canRemovePage"
                class="p-1 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                title="Supprimer"
                @click.stop="removePage(page.id, page.title)"
              >
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </template>
        </div>

        <!-- Add page -->
        <div class="border-t border-slate-100 mt-1 pt-1 px-1">
          <button
            class="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/8 transition-colors"
            @click="openAddModal"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nouvelle page
          </button>
        </div>
      </div>
    </div>

    <!-- Center: editable title -->
    <div class="flex-1 flex justify-center">
      <div class="max-w-md w-full">
        <input
          v-if="isEditingTitle"
          ref="titleInput"
          type="text"
          class="w-full text-center text-sm font-semibold text-slate-800 bg-white border border-[var(--color-primary)] rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
          :value="studio.content?.title ?? ''"
          @blur="commitTitle"
          @keydown="handleTitleKeydown"
        />
        <button
          v-else
          class="w-full text-center text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg px-3 py-1 transition-colors truncate"
          @click="startEditTitle"
        >
          {{ studio.content?.title || 'Sans titre' }}
        </button>
      </div>
    </div>

    <!-- Right: save status + actions -->
    <div class="flex items-center gap-3 shrink-0">
      <!-- Save status indicator -->
      <div class="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
        <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="saveDotClass" />
        {{ saveLabel }}
      </div>

      <!-- Manual save -->
      <button
        class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        title="Enregistrer (⌘S)"
        @click="emit('save')"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      </button>

      <!-- Publish -->
      <AppButton
        size="sm"
        :variant="isPublished ? 'secondary' : 'primary'"
        :disabled="isPublishing"
        @click="publish"
      >
        {{ isPublishing ? 'Publication…' : isPublished ? '✓ Publié' : 'Publier' }}
      </AppButton>
    </div>
  </header>

  <!-- Add page modal -->
  <Teleport to="body">
    <div
      v-if="showAddModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      @mousedown.self="showAddModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4 border border-[var(--color-secondary)]">
        <h3 class="text-base font-bold text-slate-900">Nouvelle page</h3>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-slate-600">Titre <span class="text-red-500">*</span></label>
          <input
            id="hdr-page-title"
            v-model="newPageTitle"
            type="text"
            placeholder="Ex: Vue nationale"
            class="px-3 py-2 text-sm border border-[var(--color-secondary)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]/40"
            @input="onNewPageTitleInput"
            @keydown.enter="confirmAddPage"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-slate-600">Slug (URL)</label>
          <input
            v-model="newPageSlug"
            type="text"
            placeholder="vue-nationale"
            class="px-3 py-2 text-sm border border-[var(--color-secondary)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]/40 font-mono"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-slate-600">Description</label>
          <input
            v-model="newPageDesc"
            type="text"
            placeholder="Description de la page"
            class="px-3 py-2 text-sm border border-[var(--color-secondary)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]/40"
          />
        </div>

        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input v-model="newPageIsTemplate" type="checkbox" class="rounded accent-[var(--color-primary)]" />
          <span class="text-sm text-slate-700 font-medium">Page template (drill-down)</span>
        </label>

        <div v-if="newPageIsTemplate" class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-slate-600">Nom du paramètre</label>
          <input
            v-model="newPageParam"
            type="text"
            placeholder="Ex: ville"
            class="px-3 py-2 text-sm border border-[var(--color-secondary)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 font-mono"
          />
        </div>

        <div class="flex gap-2 justify-end mt-1">
          <button
            type="button"
            class="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            @click="showAddModal = false"
          >Annuler</button>
          <button
            type="button"
            :disabled="!newPageTitle.trim()"
            class="px-4 py-2 text-sm font-semibold bg-[var(--color-primary)] text-white rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            @click="confirmAddPage"
          >Créer la page</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
