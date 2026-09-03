<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import type { CardPreview, CatalogItem } from '@/types/catalog'
import { fetchStatsDataCardPreview } from '@/api/studio'
import CardPreviewMini from '@/components/content/CardPreviewMini.vue'

/**
 * Mini-graphe RÉEL d'une carte Statsdata : charge en lazy (au scroll) l'aperçu
 * calculé par le backend depuis le premier bloc graphique du document (ou celui
 * choisi par le créateur). Tant que rien n'est chargé, ou si le document n'a pas
 * de graphique exploitable, on n'affiche RIEN (pas de graphe factice).
 */
const props = defineProps<{ item: CatalogItem }>()

const rootRef = ref<HTMLElement | null>(null)
const state = ref<'idle' | 'loading' | 'ready' | 'fallback'>('idle')
const preview = shallowRef<CardPreview | null>(null)

async function load() {
  if (state.value !== 'idle') return
  state.value = 'loading'
  try {
    const data = await fetchStatsDataCardPreview(props.item.slug)
    if (data && !data.empty && data.series?.length && data.labels?.length) {
      preview.value = data
      state.value = 'ready'
    } else {
      state.value = 'fallback'
    }
  } catch {
    state.value = 'fallback'
  }
}

const { stop } = useIntersectionObserver(
  rootRef,
  (entries) => {
    if (entries[0]?.isIntersecting) {
      stop()
      load()
    }
  },
  { rootMargin: '200px' },
)
</script>

<template>
  <div ref="rootRef">
    <CardPreviewMini
      v-if="state === 'ready' && preview"
      class="my-4"
      :preview="preview"
      :categories="item.categories"
    />
  </div>
</template>
