<script setup lang="ts">
import { ref } from 'vue'
import type { StudioPage } from '@/types/studio-document'

const props = defineProps<{
  pages: StudioPage[]
  currentPageId: string
}>()

const emit = defineEmits<{
  'update:currentPageId': [pageId: string]
  'add-page': []
  'remove-page': [pageId: string]
  'rename-page': [pageId: string, newName: string]
  'update-page-settings': [pageId: string, settings: Partial<StudioPage>]
}>()

const editingPageId = ref<string | null>(null)
const editingName = ref('')
const contextMenuPageId = ref<string | null>(null)
const contextMenuPosition = ref({ x: 0, y: 0 })

const startRename = (page: StudioPage) => {
  editingPageId.value = page.id
  editingName.value = page.name
}

const finishRename = (pageId: string) => {
  if (editingName.value.trim()) {
    emit('rename-page', pageId, editingName.value.trim())
  }
  editingPageId.value = null
}

const cancelRename = () => {
  editingPageId.value = null
}

const showContextMenu = (event: MouseEvent, pageId: string) => {
  event.preventDefault()
  contextMenuPageId.value = pageId
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
}

const closeContextMenu = () => {
  contextMenuPageId.value = null
}

const toggleVisibleInTabs = (pageId: string) => {
  const page = props.pages.find(p => p.id === pageId)
  if (page) {
    emit('update-page-settings', pageId, { visible_in_tabs: !(page.visible_in_tabs ?? true) })
  }
  closeContextMenu()
}

const setPageVisibility = (pageId: string, visibility: 'inherit' | 'public' | 'password' | 'private') => {
  emit('update-page-settings', pageId, { visibility })
  closeContextMenu()
}

const getPageVisibilityLabel = (page: StudioPage) => {
  const visibility = page.visibility || 'inherit'
  const labels = {
    inherit: 'Héritée',
    public: 'Public',
    password: 'Mot de passe',
    private: 'Privé'
  }
  return labels[visibility]
}
</script>

<template>
  <div class="flex items-center gap-1 border-b border-slate-200 bg-white px-4">
    <div class="flex flex-1 gap-1 overflow-x-auto">
      <button
        v-for="page in pages"
        :key="page.id"
        type="button"
        class="group relative flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors"
        :class="
          currentPageId === page.id
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
        "
        @click="emit('update:currentPageId', page.id)"
        @dblclick="startRename(page)"
        @contextmenu="showContextMenu($event, page.id)"
      >
        <input
          v-if="editingPageId === page.id"
          v-model="editingName"
          type="text"
          class="w-32 rounded border border-blue-500 px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          @blur="finishRename(page.id)"
          @keydown.enter="finishRename(page.id)"
          @keydown.esc="cancelRename"
          @click.stop
        />
        <span v-else class="flex items-center gap-1.5">
          {{ page.name }}
          <span v-if="page.visible_in_tabs === false" class="text-xs text-slate-400" title="Masqué dans les tabs">
            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </span>
          <span v-if="page.visibility && page.visibility !== 'inherit'" class="text-xs text-slate-400" :title="`Visibilité: ${getPageVisibilityLabel(page)}`">
            <svg v-if="page.visibility === 'private'" class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <svg v-else-if="page.visibility === 'password'" class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </span>
        </span>

        <button
          v-if="pages.length > 1 && editingPageId !== page.id"
          type="button"
          class="opacity-0 transition-opacity group-hover:opacity-100"
          :class="currentPageId === page.id ? 'text-blue-600 hover:text-blue-700' : 'text-slate-400 hover:text-slate-600'"
          @click.stop="emit('remove-page', page.id)"
          title="Supprimer la page"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </button>
    </div>

    <button
      type="button"
      class="flex items-center gap-1 rounded px-2 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      @click="emit('add-page')"
      title="Ajouter une page"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      <span>Nouvelle page</span>
    </button>

    <!-- Context Menu -->
    <teleport to="body">
      <div
        v-if="contextMenuPageId"
        class="fixed z-50 w-56 rounded-lg border border-slate-200 bg-white shadow-lg"
        :style="{ top: `${contextMenuPosition.y}px`, left: `${contextMenuPosition.x}px` }"
        @click.stop
      >
        <div class="p-1">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
            @click="toggleVisibleInTabs(contextMenuPageId)"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {{ pages.find(p => p.id === contextMenuPageId)?.visible_in_tabs === false ? 'Afficher dans les tabs' : 'Masquer des tabs' }}
          </button>

          <div class="my-1 border-t border-slate-200"></div>

          <div class="px-2 py-1 text-xs font-semibold text-slate-500">Visibilité</div>

          <button
            type="button"
            class="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
            @click="setPageVisibility(contextMenuPageId, 'inherit')"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Héritée du document
          </button>

          <button
            type="button"
            class="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
            @click="setPageVisibility(contextMenuPageId, 'public')"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Public
          </button>

          <button
            type="button"
            class="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
            @click="setPageVisibility(contextMenuPageId, 'password')"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Protégé par mot de passe
          </button>

          <button
            type="button"
            class="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
            @click="setPageVisibility(contextMenuPageId, 'private')"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Privé
          </button>
        </div>
      </div>
      <div
        v-if="contextMenuPageId"
        class="fixed inset-0 z-40"
        @click="closeContextMenu"
      ></div>
    </teleport>
  </div>
</template>
