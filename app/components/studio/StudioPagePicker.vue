<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import draggable from 'vuedraggable'
import { useStudioStore } from '@/stores/studio'
import StudioModal from '@/components/studio/ui/StudioModal.vue'
import VariablePickerModal from '@/components/studio/VariablePickerModal.vue'
import FieldText from '@/components/studio/fields/FieldText.vue'
import { slugify } from '@/lib/slug'
import type { StudioDocumentPage } from '@/types/studio'

const { compact } = defineProps<{ compact?: boolean }>()
const studio = useStudioStore()

function pageKind(page?: StudioDocumentPage | null) {
  return (page?.params?.length ?? 0) > 0
    ? { tag: 'PARM', cls: 'bg-[#f2ecfd] text-[#7c3aed]' }
    : { tag: 'PAGE', cls: 'bg-[#eaf1fe] text-[#2563eb]' }
}

const dropdownRef = ref<HTMLElement | null>(null)
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

/** Glisser-déposer dans la liste des pages : réécrit l'ordre complet dans le store. */
function onPagesChange(evt: { moved?: { oldIndex: number; newIndex: number } }) {
  if (!evt.moved) return
  const next = [...studio.pages]
  const [moved] = next.splice(evt.moved.oldIndex, 1)
  next.splice(evt.moved.newIndex, 0, moved!)
  studio.reorderPages(next.map((p) => p.id))
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
  const page = studio.addPage(newPageTitle.value.trim(), { seedSection: true })
  if (newPageSlug.value) studio.updatePage(page.id, { slug: newPageSlug.value })
  showAddModal.value = false
}

function onDocMousedown(e: MouseEvent) {
  if (showPageTokenModal.value) return
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    pagesOpen.value = false
    if (editingPageId.value) commitRename(editingPageId.value)
  }
}

onMounted(() => document.addEventListener('mousedown', onDocMousedown))
onUnmounted(() => document.removeEventListener('mousedown', onDocMousedown))
</script>

<template>
  <div ref="dropdownRef" class="relative" :class="!compact && 'ml-1'">
    <button
      class="flex max-w-[300px] items-center gap-[9px] rounded-full border-[1.5px] transition-colors"
      :class="[
        compact ? 'px-2.5 py-[6px]' : 'px-3 py-[7px]',
        pagesOpen
          ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)]'
          : 'border-[var(--studio-line-strong)] bg-white hover:border-[var(--color-primary)]',
      ]"
      @click="pagesOpen = !pagesOpen"
    >
      <span class="shrink-0 rounded-[5px] px-1.5 py-[3px] font-mono text-[9.5px] font-semibold" :class="pageKind(currentPage).cls">
        {{ pageKind(currentPage).tag }}
      </span>
      <span class="min-w-0 truncate text-[12.5px] font-bold text-[var(--studio-ink)]" :title="currentPage?.title ?? 'Page'">{{ currentPage?.title ?? 'Page' }}</span>
      <span class="shrink-0 text-[8px] text-[var(--studio-faint)]">▾</span>
    </button>

    <div
      v-if="pagesOpen"
      class="absolute left-0 top-11 z-[120] w-[min(352px,calc(100vw-24px))] rounded-[15px] border border-[var(--studio-line)] bg-white p-2 shadow-[var(--studio-shadow-pop)]"
    >
      <div class="px-2.5 pb-[7px] pt-2 text-[10px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">
        Pages de ce contenu
      </div>
      <draggable
        :model-value="studio.pages"
        item-key="id"
        tag="div"
        class="flex max-h-[290px] flex-col gap-0.5 overflow-auto"
        handle=".page-drag-handle"
        ghost-class="opacity-30"
        animation="150"
        @change="onPagesChange"
      >
        <template #item="{ element: page, index: pageIndex }">
        <div
          class="group grid grid-cols-[14px_34px_1fr_auto] items-center gap-2 rounded-[10px] px-2.5 py-[9px] transition-colors"
          :class="studio.currentPageId === page.id ? 'bg-[var(--studio-accent-wash)]' : 'hover:bg-[var(--studio-wash)]'"
        >
          <span
            class="page-drag-handle hidden shrink-0 cursor-grab items-center justify-center text-[var(--studio-faint)] hover:text-[var(--studio-ink)] active:cursor-grabbing group-hover:flex"
            title="Glisser pour réordonner"
          >
            <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
            </svg>
          </span>
          <span class="rounded-[5px] py-[3px] text-center font-mono text-[9px] font-semibold" :class="pageKind(page).cls">
            {{ pageKind(page).tag }}
          </span>
          <button
            v-if="editingPageId !== page.id"
            class="block w-full min-w-0 text-left"
            @click="studio.switchPage(page.id); pagesOpen = false"
          >
            <span class="line-clamp-2 break-words text-[12.5px] font-bold leading-snug text-[var(--studio-ink)]" :title="page.title">{{ page.title }}</span>
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
          <span class="flex items-center justify-end gap-0.5 text-[11px] text-[var(--color-primary)]">
            <span class="hidden items-center gap-0.5 group-hover:flex">
              <button
                class="text-[var(--studio-faint)] hover:text-[var(--studio-ink)] disabled:opacity-30 disabled:hover:text-[var(--studio-faint)]"
                title="Monter"
                :disabled="pageIndex === 0"
                @click.stop="studio.movePage(page.id, -1)"
              >▲</button>
              <button
                class="text-[var(--studio-faint)] hover:text-[var(--studio-ink)] disabled:opacity-30 disabled:hover:text-[var(--studio-faint)]"
                title="Descendre"
                :disabled="pageIndex === studio.pages.length - 1"
                @click.stop="studio.movePage(page.id, 1)"
              >▼</button>
              <button class="text-[var(--studio-faint)] hover:text-[var(--studio-ink)]" title="Renommer" @click.stop="startRename(page.id, page.title)">✎</button>
              <button v-if="canRemovePage" class="text-[var(--studio-faint)] hover:text-[var(--color-error)]" title="Supprimer" @click.stop="removePage(page.id, page.title)">✕</button>
            </span>
            <template v-if="studio.currentPageId === page.id && editingPageId !== page.id">
              <span class="group-hover:hidden">✓</span>
            </template>
          </span>
        </div>
        </template>
      </draggable>
      <button
        class="mt-1.5 w-full border-t border-[var(--studio-line)] p-[11px] text-center text-[12.5px] font-bold text-[var(--color-primary)]"
        @click="openAddModal"
      >
        + Nouvelle page
      </button>
    </div>
  </div>

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
