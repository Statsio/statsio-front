<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { getBrandFromPath } from '@/data/brands'
import type { StudioDocumentKind } from '@/types/studio-document'

const emit = defineEmits<{
  'save-draft': []
  'delete-document': []
  preview: []
  'update:title': [value: string]
}>()

const props = withDefaults(
  defineProps<{
    title: string
    documentKind: StudioDocumentKind
    backTo: string
    backAriaLabel: string
    quitTo: string
    isDirty?: boolean
    mode?: 'create' | 'edit'
    /** Désactive les actions (ex. chargement document). */
    actionsDisabled?: boolean
    saving?: boolean
    deleting?: boolean
    showDeleteDocument?: boolean
    primaryActionLabel?: string
    canPreview?: boolean
  }>(),
  {
    isDirty: false,
    mode: 'create',
    actionsDisabled: false,
    saving: false,
    deleting: false,
    showDeleteDocument: false,
    primaryActionLabel: 'Publier plus tard',
    canPreview: true,
  },
)

const route = useRoute()
const currentBrand = computed(() => getBrandFromPath(route.path))
const isTvstatsBrand = computed(() => currentBrand.value.id === 'tvstats')

const backRingClass = computed(() =>
  isTvstatsBrand.value ? 'focus-visible:ring-tvstats-primary/35' : 'focus-visible:ring-primary/35',
)

const modeLabel = computed(() => {
  const doc =
    props.documentKind === 'article'
      ? props.mode === 'edit'
        ? 'Édition article'
        : 'Nouvel article'
      : props.mode === 'edit'
        ? 'Édition StatsData'
        : 'Nouvelle StatsData'
  return doc
})

const statusLabel = computed(() => {
  if (props.saving) return 'Enregistrement…'
  if (props.actionsDisabled) return 'Chargement…'
  return props.isDirty ? 'Modifications en attente' : 'Toutes les modifications sont enregistrées'
})

const primaryBusy = computed(() => props.saving || props.actionsDisabled)

const isEditingTitle = ref(false)
const editableTitle = ref(props.title)
const titleInputRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.title,
  (value) => {
    if (!isEditingTitle.value) {
      editableTitle.value = value
    }
  },
)

const openTitleEditor = async () => {
  if (props.actionsDisabled) return
  isEditingTitle.value = true
  editableTitle.value = props.title
  await nextTick()
  titleInputRef.value?.focus()
  titleInputRef.value?.select()
}

const saveTitle = () => {
  const nextTitle = editableTitle.value.trim()
  emit('update:title', nextTitle || props.title)
  isEditingTitle.value = false
}

const cancelTitleEdit = () => {
  editableTitle.value = props.title
  isEditingTitle.value = false
}
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl"
  >
    <div class="mx-auto flex min-h-[4.5rem] max-w-[1680px] items-center gap-6 px-4 py-2 sm:px-6 lg:px-8">
      <!-- Section Gauche : Logo & Navigation -->
      <div class="flex items-center gap-4">
        <RouterLink
          :to="backTo"
          class="group flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2"
          :class="backRingClass"
          :aria-label="backAriaLabel"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </RouterLink>

        <div class="h-8 w-px bg-slate-200/60" />

        <div class="flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/5 text-primary shadow-inner">
            <img src="@/assets/brand/statsio-studio.svg" alt="Statsio Studio" class="h-7 w-7" />
          </div>
          <div class="hidden flex-col sm:flex">
            <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
              {{ modeLabel }}
            </span>
            <span class="text-[11px] font-medium text-slate-400">
              Espace Studio
            </span>
          </div>
        </div>
      </div>

      <!-- Section Centre : Titre & Status -->
      <div class="flex min-w-0 flex-1 items-center justify-center">
        <div class="flex max-w-2xl flex-1 flex-col items-center">
          <div class="group relative flex items-center gap-2">
            <h1 
              v-if="!isEditingTitle" 
              class="cursor-pointer truncate text-center text-lg font-bold text-slate-900 transition-colors hover:text-primary sm:text-xl"
              @click="openTitleEditor"
            >
              {{ title }}
            </h1>
            <input
              v-else
              ref="titleInputRef"
              v-model="editableTitle"
              type="text"
              class="w-full min-w-[200px] border-b-2 border-primary bg-transparent py-0.5 text-center text-lg font-bold text-slate-900 outline-none sm:text-xl"
              placeholder="Sans titre"
              @keydown.enter.prevent="saveTitle"
              @keydown.esc.prevent="cancelTitleEdit"
              @blur="saveTitle"
            />
            <button
              v-if="!isEditingTitle"
              type="button"
              class="opacity-0 transition-opacity group-hover:opacity-100"
              @click="openTitleEditor"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4 text-slate-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 20h4.5L19 9.5 14.5 5 4 15.5V20Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
          
          <div class="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
            <span 
              class="h-1.5 w-1.5 rounded-full animate-pulse"
              :class="primaryBusy ? 'bg-slate-300' : isDirty ? 'bg-amber-500' : 'bg-emerald-500'"
            />
            <span :class="isDirty ? 'text-amber-600' : 'text-slate-400'">
              {{ statusLabel }}
            </span>
          </div>
        </div>
      </div>

      <!-- Section Droite : Actions -->
      <div class="flex items-center gap-3">
        <div class="hidden items-center -space-x-2 mr-2 lg:flex">
          <span
            v-for="member in ['CG', 'MN', 'AL']"
            :key="member"
            class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200"
          >
            {{ member }}
          </span>
          <button class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white text-slate-400 shadow-sm transition-transform hover:scale-105">
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="flex items-center gap-2 rounded-2xl bg-slate-50 p-1.5 ring-1 ring-slate-200/60">
          <AppButton 
            variant="ghost" 
            size="sm" 
            class="h-9 px-4 text-xs font-bold" 
            :disabled="primaryBusy || deleting || !canPreview"
            @click="emit('preview')"
          >
            Aperçu
          </AppButton>
          <AppButton
            variant="primary"
            size="sm"
            class="h-9 px-5 text-xs font-bold shadow-md shadow-primary/20"
            :disabled="primaryBusy || deleting"
            @click="emit('save-draft')"
          >
            {{ saving ? '...' : 'Publier' }}
          </AppButton>
        </div>
      </div>
    </div>
  </header>
</template>
