<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useStudioStore } from '@/stores/studio'

const studio = useStudioStore()

// ─── Add page modal ───────────────────────────────────────────────────────────

const showAddModal = ref(false)
const newTitle     = ref('')
const newDesc      = ref('')
const isTemplate   = ref(false)
const paramName    = ref('')
const newSlug      = ref('')

function openAddModal() {
  newTitle.value   = ''
  newDesc.value    = ''
  isTemplate.value = false
  paramName.value  = ''
  newSlug.value    = ''
  showAddModal.value = true
  nextTick(() => (document.getElementById('page-title-input') as HTMLInputElement)?.focus())
}

function onTitleInput() {
  newSlug.value = newTitle.value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function confirmAdd() {
  if (!newTitle.value.trim()) return
  const page = studio.addPage(newTitle.value.trim(), {
    isTemplate: isTemplate.value || undefined,
    paramName: isTemplate.value ? paramName.value.trim() || undefined : undefined,
    description: newDesc.value.trim() || undefined,
  })
  if (newSlug.value) {
    studio.updatePage(page.id, { slug: newSlug.value })
  }
  showAddModal.value = false
}

// ─── Inline rename ────────────────────────────────────────────────────────────

const editingId    = ref<string | null>(null)
const editingTitle = ref('')

function startRename(id: string, title: string) {
  editingId.value    = id
  editingTitle.value = title
  nextTick(() => (document.getElementById(`tab-input-${id}`) as HTMLInputElement)?.select())
}

function commitRename(id: string) {
  if (editingTitle.value.trim()) {
    studio.updatePage(id, { title: editingTitle.value.trim() })
  }
  editingId.value = null
}

// ─── Remove page ─────────────────────────────────────────────────────────────

function confirmRemove(id: string, title: string) {
  if (window.confirm(`Supprimer la page « ${title} » et tous ses blocs ?`)) {
    studio.removePage(id)
  }
}

const canRemove = computed(() => studio.pages.length > 1)
</script>

<template>
  <div class="inline-flex items-center gap-0.5 px-1 py-1 bg-white rounded-xl border border-slate-200 shadow-md">
    <!-- Page tabs -->
    <div
      v-for="page in studio.pages"
      :key="page.id"
      class="group relative flex items-center"
    >
      <!-- Inline rename input -->
      <input
        v-if="editingId === page.id"
        :id="`tab-input-${page.id}`"
        v-model="editingTitle"
        class="text-xs font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)] outline-none px-2.5 py-1 rounded-lg min-w-[80px] max-w-[160px]"
        @blur="commitRename(page.id)"
        @keydown.enter="commitRename(page.id)"
        @keydown.escape="editingId = null"
      />
      <button
        v-else
        type="button"
        class="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
        :class="
          studio.currentPageId === page.id
            ? 'bg-[var(--color-primary)] text-white shadow-sm'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
        "
        @click="studio.switchPage(page.id)"
        @dblclick.prevent="startRename(page.id, page.title)"
      >
        {{ page.title }}
        <span
          v-if="page.isTemplate"
          class="text-[9px] font-bold uppercase tracking-wide px-1 py-0.5 rounded"
          :class="studio.currentPageId === page.id ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-600'"
        >
          tpl
        </span>
      </button>

      <!-- Remove button -->
      <button
        v-if="canRemove && studio.currentPageId !== page.id"
        type="button"
        class="absolute -top-1 -right-1 hidden group-hover:flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-300 hover:bg-red-100 hover:text-red-500 text-slate-600 text-[9px] z-10 transition-colors"
        title="Supprimer la page"
        @click.stop="confirmRemove(page.id, page.title)"
      >
        ×
      </button>
    </div>

    <!-- Divider -->
    <div class="w-px h-4 bg-slate-200 mx-0.5" />

    <!-- Add page button -->
    <button
      type="button"
      class="flex items-center justify-center w-6 h-6 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      title="Ajouter une page"
      @click="openAddModal"
    >
      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </button>

    <!-- Add page modal -->
    <Teleport to="body">
      <div
        v-if="showAddModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
        @mousedown.self="showAddModal = false"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
          <h3 class="text-base font-bold text-slate-900">Nouvelle page</h3>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-600">Titre <span class="text-red-500">*</span></label>
            <input
              id="page-title-input"
              v-model="newTitle"
              type="text"
              placeholder="Ex: Vue nationale"
              class="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]"
              @input="onTitleInput"
              @keydown.enter="confirmAdd"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-600">Slug (URL)</label>
            <input
              v-model="newSlug"
              type="text"
              placeholder="vue-nationale"
              class="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] font-mono"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-600">Description</label>
            <input
              v-model="newDesc"
              type="text"
              placeholder="Description affichée dans la liste des pages"
              class="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]"
            />
          </div>

          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input v-model="isTemplate" type="checkbox" class="rounded" />
            <span class="text-sm text-slate-700 font-medium">Page template (drill-down)</span>
          </label>

          <div v-if="isTemplate" class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-600">Nom du paramètre</label>
            <input
              v-model="paramName"
              type="text"
              placeholder="Ex: ville"
              class="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] font-mono"
            />
            <p class="text-xs text-slate-400 mt-0.5">Utilisez <code class="bg-slate-100 px-1 rounded">{{ '{' + '{' + (paramName || 'ville') + '}' + '}' }}</code> dans les filtres des blocs</p>
          </div>

          <div class="flex gap-2 justify-end mt-1">
            <button
              type="button"
              class="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              @click="showAddModal = false"
            >
              Annuler
            </button>
            <button
              type="button"
              :disabled="!newTitle.trim()"
              class="px-4 py-2 text-sm font-semibold bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              @click="confirmAdd"
            >
              Créer la page
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
