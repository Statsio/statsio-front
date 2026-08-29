<script setup lang="ts">
import { ref } from 'vue'
import { useModalA11y } from '@/composables/useModalA11y'
import { useStudioVariables } from '@/composables/useStudioVariables'

const props = withDefaults(
  defineProps<{
    /** Page whose variables are offered. Defaults to the current Studio page. */
    pageId?: string
    /** Block being edited — used to surface enclosing loop variables. Defaults to the selected block. */
    blockId?: string
    /** Human context shown in the header, e.g. "Titre · contenu". */
    context?: string
  }>(),
  { context: '' },
)

const emit = defineEmits<{ close: []; pick: [token: string] }>()

const panel = ref<HTMLElement | null>(null)
useModalA11y(panel, () => emit('close'))

const search = ref('')
const { filteredGroups, isEmpty } = useStudioVariables(() => props.pageId, () => props.blockId)

// Mode « valeur calculée » : arme une fonction d'agrégat, puis le clic sur une
// colonne d'un dataset insère `{{ FN(colonne@datasetId) }}` au lieu de `{{colonne}}`.
const AGG_FNS = ['AVG', 'SUM', 'MIN', 'MAX', 'COUNT'] as const
const activeFn = ref<(typeof AGG_FNS)[number] | null>(null)

function datasetIdOf(groupKey: string): string | null {
  return groupKey.startsWith('ds:') ? groupKey.slice(3) : null
}

const OPEN = '{{'
const CLOSE = '}}'

function tokenFor(name: string, groupKey?: string): string {
  const dsId = groupKey ? datasetIdOf(groupKey) : null
  if (activeFn.value && dsId) {
    const col = /\s/.test(name) ? `"${name}"` : name
    return `${OPEN} ${activeFn.value}(${col}@${dsId}) ${CLOSE}`
  }
  return `${OPEN}${name}${CLOSE}`
}

/** Aperçu court de ce qui sera inséré. */
function preview(name: string, groupKey: string): string {
  if (activeFn.value && groupKey.startsWith('ds:')) return `${OPEN} ${activeFn.value}(${name}@…) ${CLOSE}`
  return `${OPEN}${name}${CLOSE}`
}

function pick(name: string, groupKey?: string) {
  emit('pick', tokenFor(name, groupKey))
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[190] flex items-center justify-center bg-[rgba(18,18,26,0.5)] p-10 backdrop-blur-[3px]"
      @click.self="emit('close')"
    >
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        class="flex h-[620px] max-h-full w-[560px] max-w-full flex-col overflow-hidden rounded-[20px] bg-white font-sans shadow-[var(--studio-shadow-modal)]"
      >
        <div class="flex shrink-0 items-start justify-between gap-3.5 border-b border-[var(--studio-line)] px-[26px] pb-4 pt-[22px]">
          <div class="min-w-0">
            <div class="flex items-center gap-2.5">
              <span class="studio-tag text-[13px]">{ }</span>
              <span class="text-[18px] font-extrabold text-[var(--studio-ink)]">Insérer une variable</span>
            </div>
            <div class="mt-1.5 text-[12.5px] leading-[1.5] text-[var(--studio-muted)] [text-wrap:pretty]">
              La valeur est calculée à la publication, pour chaque lecteur.<template v-if="context"> Cible : {{ context }}</template>
            </div>
          </div>
          <button
            type="button"
            class="shrink-0 text-[16px] leading-none text-[var(--studio-faint)] hover:text-[var(--studio-ink)]"
            aria-label="Fermer"
            @click="emit('close')"
          >✕</button>
        </div>

        <div class="shrink-0 px-[26px] pb-2.5 pt-3.5">
          <div class="flex items-center gap-[9px] rounded-full border-[1.5px] border-[var(--studio-line-strong)] px-[15px] py-2.5 focus-within:border-[var(--color-primary)]">
            <span class="h-3 w-3 shrink-0 rounded-full border-[1.6px] border-[color:color-mix(in_srgb,var(--studio-ink)_35%,transparent)]" />
            <input
              v-model="search"
              type="search"
              placeholder="Rechercher une variable…"
              class="min-w-0 flex-1 bg-transparent text-[13.5px] text-[var(--studio-ink)] placeholder:text-[var(--studio-faint)] focus:outline-none"
            />
          </div>
          <div class="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span class="mr-1 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--studio-faint)]">Valeur calculée</span>
            <button
              v-for="fn in AGG_FNS"
              :key="fn"
              type="button"
              class="rounded-md border-[1.5px] px-2 py-0.5 font-mono text-[10.5px] font-semibold transition-colors"
              :class="activeFn === fn
                ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--color-primary)]'
                : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)] hover:border-[var(--color-primary)]'"
              @click="activeFn = activeFn === fn ? null : fn"
            >{{ fn }}</button>
            <span v-if="activeFn" class="text-[11px] text-[var(--studio-faint)]">→ clique une colonne d'un dataset</span>
          </div>
        </div>

        <div class="flex min-h-0 flex-1 flex-col gap-[18px] overflow-auto px-[26px] pb-6 pt-1.5">
          <div v-for="group in filteredGroups(search)" :key="group.key">
            <div class="mb-2.5 flex items-center gap-2.5">
              <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-[9.5px] font-semibold"
                :style="{ background: group.iconBg, color: group.iconFg }"
              >{{ group.iconText }}</span>
              <span class="min-w-0">
                <span class="block truncate text-[13px] font-bold text-[var(--studio-ink)]">{{ group.name }}</span>
                <span class="mt-px block font-mono text-[10px] text-[var(--studio-faint)]">{{ group.meta }}</span>
              </span>
            </div>
            <div class="flex flex-col gap-1.5">
              <button
                v-for="item in group.items"
                :key="item.name"
                type="button"
                class="flex items-center justify-between gap-3 rounded-[11px] border-[1.5px] border-[var(--studio-line)] bg-white px-[13px] py-2.5 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--studio-accent-wash)]"
                @click="pick(item.name, group.key)"
              >
                <span class="truncate font-mono text-[12px] font-semibold text-[var(--studio-tag-ink)]">{{ preview(item.name, group.key) }}</span>
                <span class="shrink-0 whitespace-nowrap text-[11.5px] text-[var(--studio-faint)]">{{ item.hint }}</span>
              </button>
            </div>
          </div>

          <p v-if="isEmpty" class="text-[13px] leading-[1.55] text-[var(--studio-faint)]">
            Aucune variable disponible : ajoutez un bloc Paramètre ou Recherche sur la page.
          </p>
          <p v-else-if="filteredGroups(search).length === 0" class="text-[13px] text-[var(--studio-faint)]">
            Aucune variable ne correspond à «&nbsp;{{ search }}&nbsp;».
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
