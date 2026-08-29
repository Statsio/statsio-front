<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import StudioField from './StudioField.vue'
import { COLUMN_TYPE_BADGE, type StudioColumnGroup } from '@/lib/studio-columns'

const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    groups: StudioColumnGroup[]
    /** Colonne(s) sélectionnée(s), pour la mise en évidence. */
    selected?: string | readonly string[] | null
    /** Chip « aucune » en tête (mode simple). */
    noneLabel?: string
  }>(),
  { label: '', hint: '', selected: null, noneLabel: '' },
)

const emit = defineEmits<{ pick: [name: string]; none: [] }>()

const search = ref('')

const selectedSet = computed(() => {
  const s = props.selected
  if (s == null) return new Set<string>()
  return new Set(Array.isArray(s) ? s : [s])
})

const filteredGroups = computed<StudioColumnGroup[]>(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.groups
  return props.groups
    .map((g) => ({ ...g, columns: g.columns.filter((c) => c.name.toLowerCase().includes(q)) }))
    .filter((g) => g.columns.length)
})

// Groupes ouverts : par défaut ceux contenant une sélection, sinon le premier.
const openGroups = ref<Set<string>>(new Set())
watch(
  () => props.groups.map((g) => g.label).join('|'),
  () => {
    const next = new Set<string>()
    props.groups.forEach((g, i) => {
      if (i === 0 || g.columns.some((c) => selectedSet.value.has(c.name))) next.add(g.label)
    })
    openGroups.value = next
  },
  { immediate: true },
)

function isOpen(label: string) {
  return !!search.value.trim() || openGroups.value.has(label)
}
function toggleGroup(label: string) {
  const s = new Set(openGroups.value)
  s.has(label) ? s.delete(label) : s.add(label)
  openGroups.value = s
}

const totalColumns = computed(() => props.groups.reduce((n, g) => n + g.columns.length, 0))
</script>

<template>
  <StudioField :label="label" :hint="hint || (totalColumns ? `${totalColumns} colonnes` : '')">
    <div class="overflow-hidden rounded-xl border border-[var(--studio-line)] bg-white">
      <div v-if="totalColumns > 8" class="border-b border-[var(--studio-line)] p-2">
        <div class="flex items-center gap-2 rounded-lg bg-[var(--studio-note)] px-2.5 py-1.5">
          <span class="h-3 w-3 shrink-0 rounded-full border-[1.6px] border-[color:color-mix(in_srgb,var(--studio-ink)_35%,transparent)]" />
          <input
            v-model="search"
            type="search"
            placeholder="Rechercher une colonne…"
            class="min-w-0 flex-1 bg-transparent text-[12px] text-[var(--studio-ink)] placeholder:text-[var(--studio-faint)] focus:outline-none"
          />
        </div>
      </div>

      <div class="flex max-h-[280px] flex-col gap-0.5 overflow-y-auto p-1.5">
        <button
          v-if="noneLabel && !search"
          type="button"
          class="mb-0.5 self-start rounded-[16px] border-[1.5px] px-2.5 py-1.5 text-[11px] font-bold transition-colors"
          :class="!selectedSet.size
            ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--studio-tag-ink)]'
            : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)]'"
          @click="emit('none')"
        >{{ noneLabel }}</button>

        <div v-for="g in filteredGroups" :key="g.label">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-2 rounded-md px-1.5 py-1.5 transition-colors hover:bg-[var(--studio-note)]"
            @click="toggleGroup(g.label)"
          >
            <span class="truncate text-[10px] font-extrabold uppercase tracking-[0.06em] text-[var(--studio-faint)]">
              {{ g.label }} <span class="opacity-60">· {{ g.columns.length }}</span>
            </span>
            <svg
              class="h-3 w-3 shrink-0 text-[var(--studio-faint)] transition-transform"
              :class="isOpen(g.label) ? '' : '-rotate-90'"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          <div v-show="isOpen(g.label)" class="flex flex-wrap gap-1.5 px-1 pb-2 pt-0.5">
            <button
              v-for="c in g.columns"
              :key="c.name"
              type="button"
              class="flex items-center gap-1.5 rounded-[16px] border-[1.5px] px-2.5 py-1.5 transition-colors"
              :class="selectedSet.has(c.name)
                ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)]'
                : 'border-[var(--studio-line-strong)] hover:border-[var(--color-primary)]'"
              @click="emit('pick', c.name)"
            >
              <span
                class="font-mono text-[11px] font-semibold"
                :class="selectedSet.has(c.name) ? 'text-[var(--studio-tag-ink)]' : 'text-[var(--studio-muted)]'"
              >{{ c.name }}</span>
              <span v-if="c.type" class="text-[9.5px] text-[var(--studio-faint)]">{{ COLUMN_TYPE_BADGE[c.type] ?? '?' }}</span>
            </button>
          </div>
        </div>

        <p v-if="!filteredGroups.length" class="px-2 py-3 text-[12px] text-[var(--studio-faint)]">
          {{ search ? `Aucune colonne pour « ${search} ».` : 'Aucune colonne disponible.' }}
        </p>
      </div>
    </div>
  </StudioField>
</template>
