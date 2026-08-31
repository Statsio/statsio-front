<script setup lang="ts">
import { computed, provide, reactive, ref, resolveComponent, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchPublicStatsDataBlock, type ResolvedEmbeddedBlock } from '@/api/studio'
import { primaryFreshness } from '@/lib/statsdata-freshness'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { STUDIO_EMBED_CONTEXT } from '@/composables/studioEmbedContext'
import { BLOCK_META } from '@/types/studio'
import type { StudioBlock } from '@/types/studio'
import { getErrorMessage } from '@/lib/http-errors'

/**
 * Bloc « Statsdata lié » (`sd-embed`) : réutilise un bloc (graphique / KPI /
 * tableau / recherche) d'un Statsdata publié — même s'il appartient à quelqu'un
 * d'autre. Les données du bloc interne sont chargées depuis le document source
 * via le contexte `STUDIO_EMBED_CONTEXT`.
 */
const props = defineProps<{ block: StudioBlock; readonly?: boolean; scope?: Record<string, string> }>()

// Résolu via l'auto-import Nuxt pour casser le cycle SdEmbedBlock → BlockRenderer → SdEmbedBlock.
const BlockRenderer = resolveComponent('BlockRenderer')

const basePath = useContentBasePath()

const resolved = ref<ResolvedEmbeddedBlock | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const sourceSlug = computed(() => props.block.config.sourceSlug ?? '')
const sourceBlockId = computed(() => props.block.config.sourceBlockId ?? '')
const configured = computed(() => Boolean(sourceSlug.value && sourceBlockId.value))

const freshness = computed(() => primaryFreshness(resolved.value?.datasets ?? []))
const docTitle = computed(() => resolved.value?.doc?.title ?? props.block.config.sourceDocTitle ?? 'Statsdata')
const sourceHref = computed(() => `${basePath.value}/statsdata/${sourceSlug.value}`)
const showLink = computed(() => props.block.config.showSourceLink !== false)

/** Le Statsdata source n'est pas publié → visible seulement par son éditeur, pas par les lecteurs. */
const sourceUnpublished = computed(
  () => !!resolved.value && resolved.value.doc?.status !== undefined && resolved.value.doc.status !== 'published',
)
/** Le bloc source n'a pas de dataset lié (ex. bloc recherche non configuré). */
const hasData = computed(() => {
  const b = resolved.value?.block
  return !!b && (b.type === 'search' || !!b.datasetId)
})

const innerBlock = computed(() => resolved.value?.block ?? null)

/** Jetons `{{param}}` du bloc réutilisé : défauts de la page source + override auteur. */
const embedParams = computed<Record<string, string>>(() => {
  const out: Record<string, string> = {}
  for (const p of resolved.value?.params ?? []) {
    if (p.name && p.defaultValue != null && p.defaultValue !== '') out[p.name] = p.defaultValue
  }
  return { ...out, ...(props.block.config.sourceParams ?? {}) }
})

/** Scope transmis au bloc interne = params de la source + scope de boucle éventuel. */
const innerScope = computed(() => ({ ...embedParams.value, ...props.scope }))

provide(
  STUDIO_EMBED_CONTEXT,
  reactive({
    docSlug: computed(() => sourceSlug.value),
    pages: computed(() => resolved.value?.pages ?? []),
    params: embedParams,
  }),
)

async function load() {
  if (!configured.value) {
    resolved.value = null
    return
  }
  loading.value = true
  error.value = null
  try {
    resolved.value = await fetchPublicStatsDataBlock(sourceSlug.value, sourceBlockId.value)
  } catch (e) {
    resolved.value = null
    error.value = getErrorMessage(e, 'Ce bloc Statsdata n’est plus disponible.')
  } finally {
    loading.value = false
  }
}

watch([sourceSlug, sourceBlockId], load, { immediate: true })
</script>

<template>
  <!-- Non configuré (éditeur) -->
  <div
    v-if="!configured"
    class="flex flex-col items-center gap-1 rounded-2xl border-[1.5px] border-dashed border-[var(--studio-line-strong)] bg-[var(--studio-accent-wash)] px-5 py-8 text-center"
  >
    <span class="flex h-9 w-9 items-center justify-center rounded-[10px]" :class="BLOCK_META['sd-embed'].tint">
      <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
        <path stroke-linecap="round" stroke-linejoin="round" :d="BLOCK_META['sd-embed'].iconPath" />
      </svg>
    </span>
    <p class="mt-1 text-[13px] font-bold text-[var(--studio-ink)]">Bloc Statsdata</p>
    <p class="text-[12px] text-[var(--studio-faint)]">Choisissez un Statsdata puis un de ses blocs dans le panneau de droite.</p>
  </div>

  <!-- Configuré : carte « STATSDATA LIÉ » -->
  <div
    v-else
    class="overflow-hidden rounded-2xl border-[1.5px] border-[color:rgba(139,92,246,0.22)] bg-[var(--studio-accent-wash)]"
  >
    <div class="flex flex-wrap items-center gap-2 px-5 pt-4">
      <span class="mono rounded-[5px] bg-[var(--studio-tag)] px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[var(--studio-tag-ink)]">
        Statsdata lié
      </span>
      <span v-if="freshness" class="mono text-[10px] text-[var(--studio-faint)]">
        {{ freshness.tone === 'live' ? 'Données en direct' : freshness.text }}
      </span>
    </div>

    <div class="px-5 pb-3 pt-3">
      <p class="text-[15px] font-extrabold tracking-[-0.01em] text-[var(--studio-ink)]">{{ docTitle }}</p>
    </div>

    <div
      v-if="sourceUnpublished"
      class="mx-5 mb-3 rounded-[10px] border border-amber-300 bg-amber-50 px-3 py-2 text-[11.5px] font-medium text-amber-800"
    >
      Ce Statsdata n’est pas encore publié : les lecteurs de l’article ne verront pas ces données tant qu’il reste en brouillon.
    </div>
    <div
      v-else-if="resolved && !hasData"
      class="mx-5 mb-3 rounded-[10px] border border-[var(--studio-line)] bg-white/60 px-3 py-2 text-[11.5px] text-[var(--studio-muted)]"
    >
      Ce bloc source n’est relié à aucune donnée.
    </div>

    <div class="px-5 pb-4">
      <div v-if="loading" class="py-8 text-center text-[12px] text-[var(--studio-faint)]">Chargement…</div>
      <div v-else-if="error" class="py-6 text-center text-[12px] text-[var(--studio-muted)]">{{ error }}</div>
      <component
        :is="BlockRenderer"
        v-else-if="innerBlock"
        :block="innerBlock"
        :readonly="true"
        :scope="innerScope"
      />
    </div>

    <RouterLink
      v-if="showLink"
      :to="sourceHref"
      class="block border-t border-[color:rgba(139,92,246,0.15)] px-5 py-3 text-[12.5px] font-bold text-[var(--color-primary)] hover:bg-white/40"
    >
      Ouvrir le Statsdata complet →
    </RouterLink>
  </div>
</template>
