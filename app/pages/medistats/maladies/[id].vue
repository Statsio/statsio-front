<script setup lang="ts">
definePageMeta({ layout: 'default' })
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchMaladieDetail } from '@/api/maladies'
import MaladiesDetail from '@/components/maladies/MaladiesDetail.vue'
import type { Maladie } from '@/types/maladies'
import { getHttpErrorStatus } from '@/lib/http-errors'

const route = useRoute()

const maladie = ref<Maladie | null>(null)
const isLoading = ref(true)

const id = computed(() => String(route.params.id))

usePageSeo({
  title: computed(() => (maladie.value ? `${maladie.value.name} — MédiStats` : 'Maladie — MédiStats')),
  description: computed(
    () =>
      maladie.value?.definition ??
      (maladie.value
        ? `Statistiques et données sur ${maladie.value.name} : prévalence, tendances et pays les plus touchés.`
        : undefined),
  ),
})

// Chargé côté serveur (SSR) : titre, description et fiche dans le HTML.
// La clé suit le paramètre d'URL : changer de fiche relance le chargement.
const { data: loaded, status: loadStatus, error: loadError } = await useAsyncData(
  () => `medistats-maladie-${id.value}`,
  async () => {
    try {
      return await fetchMaladieDetail(id.value)
    } catch (e) {
      throw createError({ statusCode: getHttpErrorStatus(e, 404), statusMessage: 'Cette maladie est introuvable.' })
    }
  },
)
function failIfMissing() {
  if (!loadError.value) return
  throw createError({ statusCode: loadError.value.statusCode ?? 404, statusMessage: 'Cette maladie est introuvable.', fatal: true })
}
failIfMissing()
watch(loadError, (e) => {
  if (e) showError(createError({ statusCode: e.statusCode ?? 404, statusMessage: 'Cette maladie est introuvable.', fatal: true }))
})
watch([loaded, loadStatus], ([v, st]) => {
  maladie.value = v ?? null
  isLoading.value = st === 'pending'
}, { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 pb-24 pt-10 md:px-8 md:pt-12">
    <p v-if="isLoading" class="py-16 text-center text-[14px] text-slate-400">Chargement…</p>
    <MaladiesDetail v-else-if="maladie" :maladie="maladie" />
  </div>
</template>
