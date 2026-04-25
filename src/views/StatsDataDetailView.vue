<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import StatsDataDocumentPage from '@/components/statsdata/StatsDataDocumentPage.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { fetchPublicStatsDataDocumentBySlug } from '@/api/statsdata-documents'
import type { StatsDataDocumentDto } from '@/types/statsdata-document-api'

const route = useRoute()

const slug = computed(() => String(route.params.slug ?? '').trim())

const isLoading = ref(true)
const loadError = ref<string | null>(null)
const document = ref<StatsDataDocumentDto | null>(null)

async function load() {
  const s = slug.value
  if (!s) {
    isLoading.value = false
    loadError.value = 'StatsData introuvable.'
    document.value = null
    return
  }
  isLoading.value = true
  loadError.value = null
  document.value = null
  try {
    document.value = await fetchPublicStatsDataDocumentBySlug(s)
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Erreur lors du chargement'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => void load())
watch(slug, () => void load())
</script>

<template>
  <div v-if="isLoading" class="section pb-24 pt-32">
    <div class="container">
      <div class="rounded-[2rem] border border-slate-200 bg-white px-6 py-12 text-center shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
        <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Chargement</p>
        <h3 class="mt-3 text-2xl font-semibold text-slate-950">On récupère la StatsData.</h3>
      </div>
    </div>
  </div>

  <div v-else-if="loadError" class="section pb-24 pt-32">
    <div class="container">
      <div class="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-12 text-center shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
        <p class="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">Erreur</p>
        <h3 class="mt-3 text-2xl font-semibold text-slate-950">Impossible de charger la StatsData.</h3>
        <p class="mx-auto mt-3 max-w-2xl text-sm leading-7 text-rose-900/80">{{ loadError }}</p>
        <div class="mt-6 flex flex-wrap justify-center gap-2">
          <AppButton variant="primary" size="md" type="button" @click="load">Réessayer</AppButton>
          <AppButton as="router-link" to="/statsdata" variant="secondary" size="md">Retour</AppButton>
        </div>
      </div>
    </div>
  </div>

  <StatsDataDocumentPage v-else-if="document" :document="document" />

  <div v-else class="section pb-24 pt-32">
    <div class="container">
      <div class="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
        <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Introuvable</p>
        <h3 class="mt-3 text-2xl font-semibold text-slate-950">Cette StatsData n’existe pas.</h3>
        <div class="mt-6">
          <AppButton as="router-link" to="/statsdata" variant="secondary" size="md">Retour</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
