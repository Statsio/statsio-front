<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import StudioModal from '@/components/studio/ui/StudioModal.vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { buildStudioJsonPrompt, type PromptDataset } from '@/lib/studio-json-prompt'

const emit = defineEmits<{ close: [] }>()

const studio = useStudioStore()
const datasets = useStudioDatasetsStore()

const currentJson = computed(() => JSON.stringify(studio.getPayload(), null, 2))

// ─── Copy helpers ─────────────────────────────────────────────────────────────
const copied = ref<'json' | 'prompt' | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | null = null

async function copy(text: string, key: 'json' | 'prompt') {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = key
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => { copied.value = null }, 2000)
  } catch {
    /* clipboard indisponible — l'utilisateur peut sélectionner le texte à la main */
  }
}

function copyJson() {
  copy(currentJson.value, 'json')
}

function buildPrompt(): string {
  const promptDatasets: PromptDataset[] = datasets.datasets.map((meta) => ({
    meta,
    columns: datasets.getSchema(meta.id)?.columns,
  }))
  return buildStudioJsonPrompt({
    content: { title: studio.content?.title, type: studio.content?.type ?? 'statsdata' },
    supportsPages: studio.supportsPages,
    datasets: promptDatasets,
    currentPayload: studio.getPayload(),
  })
}

function copyPrompt() {
  copy(buildPrompt(), 'prompt')
}

// ─── Import ───────────────────────────────────────────────────────────────────
const importText = ref('')
const importError = ref('')
const importDone = ref(false)

function applyImport() {
  importError.value = ''
  importDone.value = false
  let parsed: unknown
  try {
    parsed = JSON.parse(importText.value)
  } catch (e) {
    importError.value = `JSON invalide : ${e instanceof Error ? e.message : 'erreur de parsing'}`
    return
  }
  const res = studio.importPayload(parsed)
  if (!res.ok) {
    importError.value = res.error
    return
  }
  importDone.value = true
  importText.value = ''
  setTimeout(() => emit('close'), 700)
}

// ─── Schémas des datasets (pour enrichir le prompt) ───────────────────────────
const schemasLoading = ref(false)

onMounted(async () => {
  if (!datasets.datasets.length) await datasets.loadDatasets()
  const ready = datasets.datasets.filter((d) => d.status === 'ready' && !datasets.getSchema(d.id))
  if (!ready.length) return
  schemasLoading.value = true
  await Promise.all(ready.map((d) => datasets.loadSchema(d.id)))
  schemasLoading.value = false
})
</script>

<template>
  <StudioModal
    title="JSON du contenu"
    subtitle="Copie le JSON ou le prompt pour le donner à une IA, puis colle le JSON généré ci-dessous pour remplacer le contenu."
    :width="720"
    @close="emit('close')"
  >
    <div class="flex flex-col gap-6">
      <!-- Export -->
      <section class="flex flex-col gap-2.5">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-[13px] font-bold text-[var(--studio-ink)]">1 · Récupérer</h3>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-[9px] border-[1.5px] border-[var(--studio-line-strong)] px-3 py-2 text-[12px] font-bold text-[var(--studio-ink)] transition-colors hover:border-[var(--color-primary)]"
              @click="copyJson"
            >
              {{ copied === 'json' ? '✓ Copié' : 'Copier le JSON' }}
            </button>
            <button
              type="button"
              class="rounded-[9px] border-[1.5px] border-[var(--color-primary)] bg-[var(--studio-accent-wash)] px-3 py-2 text-[12px] font-bold text-[var(--color-primary)] transition-colors hover:brightness-95"
              @click="copyPrompt"
            >
              {{ copied === 'prompt' ? '✓ Copié' : 'Copier le prompt IA' }}
            </button>
          </div>
        </div>
        <p class="text-[11.5px] leading-relaxed text-[var(--studio-faint)]">
          Le <b>prompt IA</b> décrit la structure du JSON, les blocs disponibles pour ce type de contenu,
          et la liste des sources de données avec leurs colonnes<span v-if="schemasLoading"> (chargement des schémas…)</span>.
          Colle-le dans ChatGPT / Claude, décris ce que tu veux, et récupère le JSON.
        </p>
        <pre class="max-h-40 overflow-auto rounded-[10px] border border-[var(--studio-line)] bg-[var(--studio-wash)] p-3 text-[11px] leading-[1.5] text-[var(--studio-muted)]">{{ currentJson }}</pre>
      </section>

      <!-- Import -->
      <section class="flex flex-col gap-2.5">
        <h3 class="text-[13px] font-bold text-[var(--studio-ink)]">2 · Remplacer par un JSON</h3>
        <textarea
          v-model="importText"
          rows="9"
          spellcheck="false"
          placeholder='{ "title": "…", "pages": [...], "sections": [...], "blocks": [...] }'
          class="w-full resize-y rounded-[10px] border-[1.5px] border-[var(--studio-line-strong)] bg-white p-3 font-mono text-[11.5px] leading-[1.5] text-[var(--studio-ink)] focus:border-[var(--color-primary)] focus:outline-none"
        />
        <p v-if="importError" class="text-[11.5px] font-medium text-[var(--color-error)]">{{ importError }}</p>
        <p v-else-if="importDone" class="text-[11.5px] font-medium text-emerald-600">✓ Contenu remplacé — enregistrement en cours…</p>
        <p v-else class="text-[11.5px] leading-relaxed text-[var(--studio-faint)]">
          Remplace le titre, les sections et les blocs du document. Réversible avec Ctrl+Z. L'enregistrement est automatique.
        </p>
      </section>
    </div>

    <template #footer>
      <button type="button" class="text-[13px] font-bold text-[var(--studio-faint)]" @click="emit('close')">Fermer</button>
      <button
        type="button"
        class="studio-gradient rounded-[10px] px-[22px] py-3 text-[13.5px] font-bold text-white disabled:opacity-40"
        :disabled="!importText.trim()"
        @click="applyImport"
      >
        Remplacer le contenu
      </button>
    </template>
  </StudioModal>
</template>
