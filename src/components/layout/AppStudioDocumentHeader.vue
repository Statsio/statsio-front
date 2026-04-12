<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { getBrandFromPath } from '@/data/brands'
import type { StudioDocumentKind } from '@/types/studio-document'

const emit = defineEmits<{
  'save-draft': []
  'delete-document': []
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
  }>(),
  {
    isDirty: false,
    mode: 'create',
    actionsDisabled: false,
    saving: false,
    deleting: false,
    showDeleteDocument: false,
    primaryActionLabel: 'Publier plus tard',
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
  return props.isDirty ? 'Brouillon modifié' : 'Synchronisé'
})

const primaryBusy = computed(() => props.saving || props.actionsDisabled)
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
    <div class="mx-auto flex min-h-[4.5rem] max-w-[1680px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
      <div class="flex min-w-0 items-center gap-3 sm:gap-4">
        <RouterLink
          :to="backTo"
          class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2"
          :class="backRingClass"
          :aria-label="backAriaLabel"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M15 6L9 12L15 18"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </RouterLink>

        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{{ modeLabel }}</p>
          <div class="flex min-w-0 items-center gap-3">
            <div class="min-w-0 flex-1">
              <slot name="title">
                <h1 class="truncate text-lg font-semibold text-slate-950 sm:text-xl">{{ title }}</h1>
              </slot>
            </div>
            <span
              class="hidden rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] sm:inline-flex"
              :class="
                primaryBusy
                  ? 'bg-slate-200 text-slate-600'
                  : isDirty
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
              "
            >
              {{ statusLabel }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
        <AppButton as="router-link" :to="quitTo" variant="secondary" size="md">Quitter</AppButton>
        <AppButton variant="outline" size="md" :disabled="primaryBusy || deleting">Prévisualiser</AppButton>
        <AppButton
          v-if="showDeleteDocument"
          variant="outline"
          size="md"
          class="text-rose-700 hover:border-rose-200 hover:bg-rose-50"
          :disabled="primaryBusy || deleting"
          @click="emit('delete-document')"
        >
          {{ deleting ? 'Suppression…' : 'Supprimer' }}
        </AppButton>
        <AppButton
          variant="primary"
          size="md"
          :disabled="primaryBusy || deleting"
          @click="emit('save-draft')"
        >
          {{ saving ? 'Enregistrement…' : primaryActionLabel }}
        </AppButton>
      </div>
    </div>
  </header>
</template>
