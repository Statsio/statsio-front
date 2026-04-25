<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppDropdownMenu from '@/components/layout/AppDropdownMenu.vue'
import AppDropdownMenuItem from '@/components/layout/AppDropdownMenuItem.vue'
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

const isMenuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const closeMenu = () => {
  isMenuOpen.value = false
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const onDocClick = (e: MouseEvent) => {
  const t = e.target
  if (!(t instanceof Node)) return closeMenu()
  if (!menuRef.value?.contains(t)) closeMenu()
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-[color:var(--color-primary)]/12 bg-white/80 backdrop-blur-xl"
  >
    <div class="mx-auto flex min-h-[4.5rem] max-w-[1680px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
      <div class="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
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

        <div class="min-w-0 flex-1">
          <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{{ modeLabel }}</p>
          <div class="mt-0.5 flex min-w-0 items-baseline gap-3">
            <div class="min-w-0 flex-1">
              <slot name="title">
                <h1 class="truncate text-lg font-semibold text-slate-950 sm:text-xl">{{ title }}</h1>
              </slot>
            </div>
            <span
              class="hidden shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] sm:inline-flex"
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

      <div class="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
        <div ref="menuRef" class="relative">
          <button
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Plus d’actions"
            aria-haspopup="menu"
            :aria-expanded="isMenuOpen"
            @click.stop="toggleMenu"
          >
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path
                d="M12 7.2a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Zm0 6.6a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Zm0 6.6a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z"
              />
            </svg>
          </button>

          <div v-if="isMenuOpen" class="relative">
            <AppDropdownMenu label="Actions Studio" align="right" width-class="min-w-[240px]">
                <AppDropdownMenuItem as="router-link" :to="quitTo">
                  <template #leading>
                    <svg viewBox="0 0 24 24" class="h-5 w-5 text-slate-400" fill="currentColor" aria-hidden="true">
                      <path
                        d="M10.09 15.59 11.5 17l6-6-6-6-1.41 1.41L13.67 11H3v2h10.67l-3.58 2.59ZM19 3h2v18h-2V3Z"
                      />
                    </svg>
                  </template>
                  Quitter
                </AppDropdownMenuItem>

                <AppDropdownMenuItem as="button" :disabled="primaryBusy || deleting" @click="closeMenu">
                  <template #leading>
                    <svg viewBox="0 0 24 24" class="h-5 w-5 text-slate-400" fill="currentColor" aria-hidden="true">
                      <path
                        d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
                      />
                    </svg>
                  </template>
                  Prévisualiser
                </AppDropdownMenuItem>

                <AppDropdownMenuItem
                  v-if="showDeleteDocument"
                  as="button"
                  danger
                  :disabled="primaryBusy || deleting"
                  @click="
                    closeMenu();
                    emit('delete-document')
                  "
                >
                  <template #leading>
                    <svg viewBox="0 0 24 24" class="h-5 w-5 text-rose-300" fill="currentColor" aria-hidden="true">
                      <path
                        d="M6 7h12l-1 14H7L6 7Zm3-3h6l1 2H8l1-2Zm-5 2h16v2H4V6Z"
                      />
                    </svg>
                  </template>
                  {{ deleting ? 'Suppression…' : 'Supprimer' }}
                </AppDropdownMenuItem>
            </AppDropdownMenu>
          </div>
        </div>

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
