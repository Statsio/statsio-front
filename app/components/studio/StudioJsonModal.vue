<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import StudioModal from '@/components/studio/ui/StudioModal.vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { useStudioMetaStore } from '@/stores/studio-meta'
import { fetchMyMedia, type MediaItem } from '@/api/media'
import { fetchContentCategories } from '@/api/content-categories'
import type { ContentCategory } from '@/types/content-creation'
import type { SaveStatsDataDocumentPayload } from '@/api/studio'
import {
  buildStudioJsonPrompt,
  extractImportProperties,
  type PromptDataset,
  type StudioJsonProperties,
} from '@/lib/studio-json-prompt'

const emit = defineEmits<{ close: [] }>()

const studio = useStudioStore()
const datasets = useStudioDatasetsStore()
const meta = useStudioMetaStore()

const media = ref<MediaItem[]>([])
const categories = ref<ContentCategory[]>([])

/** Propriétés courantes du document (objet `properties` du JSON). */
const currentProperties = computed<StudioJsonProperties>(() => {
  const d = meta.doc
  const thumb = d?.thumbnail_url?.trim()
  const thumbId = thumb ? media.value.find((m) => m.url === thumb)?.id : undefined
  return {
    title: studio.content?.title,
    description: d?.description ?? null,
    ...(thumbId ? { thumbnailMediaId: thumbId } : {}),
    coverage: d?.coverage ?? null,
    ...(d?.sub_brand ? { subBrand: d.sub_brand } : {}),
    categories: d?.categories ?? studio.content?.categories ?? [],
    ...(studio.content?.type === 'statsdata' ? { cardBlockId: d?.card_block_id ?? null } : {}),
  }
})

function currentPayload() {
  const { pages, sections, blocks } = studio.getPayload()
  return { properties: currentProperties.value, pages, sections, blocks }
}

const currentJson = computed(() => JSON.stringify(currentPayload(), null, 2))

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
    currentPayload: currentPayload(),
    media: media.value,
    categories: categories.value,
  })
}

function copyPrompt() {
  copy(buildPrompt(), 'prompt')
}

// ─── Import ───────────────────────────────────────────────────────────────────
const importText = ref('')
const importError = ref('')
const importDone = ref(false)

/** Applique `properties` (hors titre, géré par `importPayload`) via le store `studio-meta`. */
async function applyProperties(props: StudioJsonProperties): Promise<boolean> {
  if (!meta.doc) return true
  const patch: SaveStatsDataDocumentPayload = {}
  if (props.description !== undefined) patch.description = props.description
  if (props.coverage !== undefined) patch.coverage = props.coverage
  if (props.subBrand !== undefined) patch.sub_brand = props.subBrand
  if (props.categories !== undefined) {
    // Seuls les slugs connus sont envoyés (une IA peut en inventer).
    const known = new Set(categories.value.map((c) => c.slug))
    patch.categories = known.size ? props.categories.filter((c) => known.has(c)) : props.categories
  }
  if (props.cardBlockId !== undefined && studio.content?.type === 'statsdata') {
    patch.card_block_id = props.cardBlockId && studio.blocks.some((b) => b.id === props.cardBlockId)
      ? props.cardBlockId
      : null
  }
  let ok = true
  if (Object.keys(patch).length) ok = (await meta.patch(patch)) !== false
  if (props.thumbnailMediaId !== undefined) {
    const id = props.thumbnailMediaId
    if (id === null || !media.value.length || media.value.some((m) => m.id === id)) {
      ok = (await meta.setThumbnail(id)) && ok
    }
  }
  return ok
}

async function applyImport() {
  importError.value = ''
  importDone.value = false
  let parsed: unknown
  try {
    parsed = JSON.parse(importText.value)
  } catch (e) {
    importError.value = `JSON invalide : ${e instanceof Error ? e.message : 'erreur de parsing'}`
    return
  }
  const props = extractImportProperties(parsed)
  const body = { ...(parsed as Record<string, unknown>), ...(props.title ? { title: props.title } : {}) }
  const res = studio.importPayload(body)
  if (!res.ok) {
    importError.value = res.error
    return
  }
  if (!(await applyProperties(props))) {
    importError.value = "Contenu remplacé, mais certaines propriétés (chapô, miniature, catégories…) n'ont pas pu être enregistrées."
    return
  }
  importDone.value = true
  importText.value = ''
  setTimeout(() => emit('close'), 700)
}

// ─── Schémas des datasets (pour enrichir le prompt) ───────────────────────────
const schemasLoading = ref(false)

onMounted(async () => {
  void fetchMyMedia(studio.content?.slug).then((m) => { media.value = m }).catch(() => {})
  void fetchContentCategories().then((c) => { categories.value = c }).catch(() => {})
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
          Le <b>prompt IA</b> décrit toute la structure du JSON — propriétés (titre, chapô, miniature, catégories…),
          pages, sections, et chaque bloc disponible avec tous ses paramètres (titres des graphiques compris) —
          ainsi que les sources de données avec leurs colonnes<span v-if="schemasLoading"> (chargement des schémas…)</span>.
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
          placeholder='{ "properties": { "title": "…", "description": "…" }, "pages": [...], "sections": [...], "blocks": [...] }'
          class="w-full resize-y rounded-[10px] border-[1.5px] border-[var(--studio-line-strong)] bg-white p-3 font-mono text-[11.5px] leading-[1.5] text-[var(--studio-ink)] focus:border-[var(--color-primary)] focus:outline-none"
        />
        <p v-if="importError" class="text-[11.5px] font-medium text-[var(--color-error)]">{{ importError }}</p>
        <p v-else-if="importDone" class="text-[11.5px] font-medium text-emerald-600">✓ Contenu remplacé — enregistrement en cours…</p>
        <p v-else class="text-[11.5px] leading-relaxed text-[var(--studio-faint)]">
          Remplace les pages, sections et blocs, et applique les propriétés fournies (titre, chapô, miniature, catégories…). Le corps est réversible avec Ctrl+Z ; les propriétés sont enregistrées immédiatement.
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
