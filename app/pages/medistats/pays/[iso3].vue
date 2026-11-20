<script setup lang="ts">
definePageMeta({ layout: 'default' })
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchPaysDetail } from '@/api/pays'
import PaysDetail from '@/components/pays/PaysDetail.vue'
import type { PaysDetail as PaysDetailType } from '@/types/pays'
import { getHttpErrorStatus } from '@/lib/http-errors'

const route = useRoute()

const pays = ref<PaysDetailType | null>(null)
const isLoading = ref(true)

const iso3 = computed(() => String(route.params.iso3).toUpperCase())

usePageSeo({
  title: computed(() => (pays.value ? `${pays.value.name} — MédiStats` : 'Pays — MédiStats')),
  description: computed(() =>
    pays.value
      ? `Indicateurs de santé publique pour ${pays.value.name} (${pays.value.region}) : espérance de vie, dépenses de santé, densité médicale et maladies principales.`
      : undefined,
  ),
})

// Chargé côté serveur (SSR) : titre, description et fiche dans le HTML.
// La clé suit le paramètre d'URL : changer de fiche relance le chargement.
const { data: loaded, status: loadStatus, error: loadError } = await useAsyncData(
  () => `medistats-pays-${iso3.value}`,
  async () => {
    try {
      return await fetchPaysDetail(iso3.value)
    } catch (e) {
      throw createError({ statusCode: getHttpErrorStatus(e, 404), statusMessage: 'Ce pays est introuvable.' })
    }
  },
)
function failIfMissing() {
  if (!loadError.value) return
  throw createError({ statusCode: loadError.value.statusCode ?? 404, statusMessage: 'Ce pays est introuvable.', fatal: true })
}
failIfMissing()
watch(loadError, (e) => {
  if (e) showError(createError({ statusCode: e.statusCode ?? 404, statusMessage: 'Ce pays est introuvable.', fatal: true }))
})
watch([loaded, loadStatus], ([v, st]) => {
  pays.value = v ?? null
  isLoading.value = st === 'pending'
}, { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 pb-24 pt-10 md:px-8 md:pt-12">
    <p v-if="isLoading" class="py-16 text-center text-[14px] text-slate-400">Chargement…</p>
    <PaysDetail v-else-if="pays" :pays="pays" />
  </div>
</template>
