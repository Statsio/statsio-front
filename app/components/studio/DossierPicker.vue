<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  fetchDossiers,
  fetchDossierSuggestions,
  fetchContentDossiers,
} from '@/api/dossiers'
import type { Dossier } from '@/types/dossier'

const props = withDefaults(
  defineProps<{
    modelValue: number[]
    documentId: string
    /** Pré-sélectionne les dossiers déjà rattachés au contenu au montage. */
    seedFromCurrent?: boolean
  }>(),
  { seedFromCurrent: true },
)

const emit = defineEmits<{ 'update:modelValue': [number[]] }>()

const suggestions = ref<Dossier[]>([])
const allDossiers = ref<Dossier[]>([])
const known = ref<Map<number, Dossier>>(new Map())
const loading = ref(true)
const search = ref('')

function remember(list: Dossier[]) {
  for (const d of list) known.value.set(d.id, d)
}

onMounted(async () => {
  try {
    const [sugg, all, current] = await Promise.all([
      fetchDossierSuggestions(props.documentId).catch(() => [] as Dossier[]),
      fetchDossiers().catch(() => [] as Dossier[]),
      props.seedFromCurrent
        ? fetchContentDossiers(props.documentId).catch(() => [] as Dossier[])
        : Promise.resolve([] as Dossier[]),
    ])
    suggestions.value = sugg
    allDossiers.value = all
    remember(sugg)
    remember(all)
    remember(current)
    if (props.seedFromCurrent && current.length) {
      emit('update:modelValue', current.map((d) => d.id))
    }
  } finally {
    loading.value = false
  }
})

const selected = computed(() =>
  props.modelValue
    .map((id) => known.value.get(id))
    .filter((d): d is Dossier => d != null),
)

const searchResults = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return []
  return allDossiers.value
    .filter((d) => d.name.toLowerCase().includes(q) && !props.modelValue.includes(d.id))
    .slice(0, 8)
})

function toggle(dossier: Dossier) {
  remember([dossier])
  const current = [...props.modelValue]
  const idx = current.indexOf(dossier.id)
  if (idx >= 0) current.splice(idx, 1)
  else current.push(dossier.id)
  emit('update:modelValue', current)
}

function isSelected(id: number) {
  return props.modelValue.includes(id)
}
</script>

<template>
  <div class="space-y-3.5">
    <p class="text-[12.5px] leading-relaxed text-[var(--studio-muted,#6b7280)]">
      Rangez ce contenu dans un ou plusieurs dossiers éditoriaux (facultatif).
    </p>

    <div v-if="loading" class="text-[12px] text-[var(--studio-muted,#6b7280)]">Chargement des dossiers…</div>

    <template v-else>
      <!-- Suggestions -->
      <div v-if="suggestions.length" class="space-y-1.5">
        <span class="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--studio-faint,#9ca3af)]">
          Suggestions pour ce contenu
        </span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="d in suggestions"
            :key="`sugg-${d.id}`"
            type="button"
            class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition"
            :class="isSelected(d.id)
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:border-[var(--color-primary)]/40'"
            @click="toggle(d)"
          >
            <img v-if="d.imageUrl" :src="d.imageUrl" alt="" class="h-4 w-4 rounded-full object-cover" />
            {{ d.name }}
          </button>
        </div>
      </div>

      <!-- Recherche -->
      <div class="space-y-1.5">
        <input
          v-model="search"
          type="text"
          placeholder="Rechercher un dossier…"
          class="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[13px] outline-none focus:border-[var(--color-primary)]"
        />
        <div v-if="searchResults.length" class="flex flex-wrap gap-2">
          <button
            v-for="d in searchResults"
            :key="`search-${d.id}`"
            type="button"
            class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 transition hover:border-[var(--color-primary)]/40"
            @click="toggle(d); search = ''"
          >
            <img v-if="d.imageUrl" :src="d.imageUrl" alt="" class="h-4 w-4 rounded-full object-cover" />
            + {{ d.name }}
          </button>
        </div>
        <p v-else-if="search.trim()" class="text-[12px] text-[var(--studio-muted,#6b7280)]">
          Aucun dossier ne correspond.
        </p>
      </div>

      <!-- Sélection -->
      <div v-if="selected.length" class="space-y-1.5">
        <span class="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--studio-faint,#9ca3af)]">
          Dans ces dossiers
        </span>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="d in selected"
            :key="`sel-${d.id}`"
            class="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)]/10 px-3 py-1.5 text-[12.5px] font-semibold text-[var(--color-primary)]"
          >
            {{ d.name }}
            <button type="button" aria-label="Retirer" class="text-[13px] leading-none" @click="toggle(d)">✕</button>
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
