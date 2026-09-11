<script setup lang="ts">
import { computed, provide, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchPublicStatsDataBlock, type ResolvedEmbeddedBlock } from '@/api/studio'
import { STUDIO_EMBED_CONTEXT } from '@/composables/studioEmbedContext'
import { getErrorMessage } from '@/lib/http-errors'
import BlockCard from '@/components/studio/blocks/BlockCard.vue'
import BlockRenderer from '@/components/studio/blocks/BlockRenderer.vue'
import { IFRAME_EMBED_BLOCK_TYPES } from '@/types/studio'

/**
 * Iframe publique d'un bloc StatsData (graphique / tableau / KPI / carte).
 * Chargée via `/embed/statsdata/{slug}/blocks/{blockId}` — sans chrome de page.
 */
definePageMeta({ layout: 'embed' })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const blockId = computed(() => String(route.params.blockId ?? ''))

const resolved = ref<ResolvedEmbeddedBlock | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const embedParams = computed<Record<string, string>>(() => {
  const out: Record<string, string> = {}
  for (const p of resolved.value?.params ?? []) {
    if (p.name && p.defaultValue != null && p.defaultValue !== '') out[p.name] = p.defaultValue
  }
  // Query string → override des paramètres de page (ex. ?carburant=SP95).
  for (const [key, val] of Object.entries(route.query)) {
    if (typeof val === 'string' && val !== '') out[key] = val
  }
  return out
})

provide(
  STUDIO_EMBED_CONTEXT,
  reactive({
    docSlug: computed(() => slug.value),
    pages: computed(() => resolved.value?.pages ?? []),
    params: embedParams,
  }),
)

const block = computed(() => resolved.value?.block ?? null)
const shareUrl = computed(() => {
  const origin = import.meta.client ? window.location.origin : ''
  return `${origin}/statsdata/${slug.value}`
})

async function load() {
  if (!slug.value || !blockId.value) {
    resolved.value = null
    error.value = 'Bloc introuvable.'
    loading.value = false
    return
  }
  loading.value = true
  error.value = null
  try {
    const res = await fetchPublicStatsDataBlock(slug.value, blockId.value)
    if (!IFRAME_EMBED_BLOCK_TYPES.includes(res.block.type)) {
      resolved.value = null
      error.value = 'Ce type de bloc ne peut pas être intégré.'
      return
    }
    resolved.value = res
  } catch (e) {
    resolved.value = null
    error.value = getErrorMessage(e, 'Ce bloc n’est plus disponible.')
  } finally {
    loading.value = false
  }
}

watch([slug, blockId], load, { immediate: true })

usePageSeo({
  title: computed(() => resolved.value?.block.config.title || resolved.value?.doc.title || 'Bloc StatsData'),
  robots: 'noindex,follow',
})
</script>

<template>
  <div class="mx-auto flex max-w-[960px] flex-col gap-3">
    <div v-if="loading" class="py-16 text-center text-sm text-slate-400">Chargement…</div>
    <div v-else-if="error" class="py-16 text-center text-sm text-slate-500">{{ error }}</div>
    <template v-else-if="block">
      <BlockCard :block="block" :readonly="true">
        <BlockRenderer :block="block" :readonly="true" :scope="embedParams" />
      </BlockCard>
      <a
        :href="shareUrl"
        target="_blank"
        rel="noopener"
        class="block text-center text-[11px] font-semibold text-slate-400 hover:text-slate-600"
      >Réalisé avec Statsio →</a>
    </template>
  </div>
</template>
