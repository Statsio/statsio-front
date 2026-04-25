<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import StatsDataDocumentPage from '@/components/statsdata/StatsDataDocumentPage.vue'
import { fetchStatsDataDocument } from '@/api/statsdata-documents'
import type { StatsDataDocumentDto } from '@/types/statsdata-document-api'

const route = useRoute()
const docId = computed(() => String(route.params.id ?? '').trim())

const isLoading = ref(true)
const loadError = ref<string | null>(null)
const document = ref<StatsDataDocumentDto | null>(null)

const studioEditTo = computed(() =>
  docId.value ? { name: 'studio-statsdata-edit', params: { id: docId.value } } : '/studio/statsdata/nouveau',
)
const settingsTo = computed(() =>
  docId.value ? { name: 'statsdata-settings', params: { id: docId.value } } : '/statsdata',
)

async function load() {
  if (!docId.value) {
    isLoading.value = false
    loadError.value = 'Prévisualisation indisponible.'
    document.value = null
    return
  }
  isLoading.value = true
  loadError.value = null
  document.value = null
  try {
    document.value = await fetchStatsDataDocument(docId.value)
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Erreur lors du chargement'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => void load())
watch(docId, () => void load())
</script>

<template>
  <main class="pb-24 pt-28">
    <section class="section pb-6">
      <div class="container">
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Prévisualisation</p>
            <p class="text-sm text-slate-600">Rendu public avec vos données actuelles.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <AppButton as="router-link" :to="settingsTo" variant="secondary" size="md">Éditer les propriétés</AppButton>
            <AppButton as="router-link" :to="studioEditTo" variant="primary" size="md">Retour au studio</AppButton>
          </div>
        </div>
      </div>
    </section>

    <section v-if="isLoading" class="section pt-0">
      <div class="container">
        <div class="rounded-[2rem] border border-slate-200 bg-white px-6 py-12 text-center shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
          <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Chargement</p>
          <h2 class="mt-3 text-2xl font-semibold text-slate-950">On prépare la prévisualisation.</h2>
        </div>
      </div>
    </section>

    <section v-else-if="loadError" class="section pt-0">
      <div class="container">
        <div class="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-12 text-center shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
          <p class="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">Erreur</p>
          <h2 class="mt-3 text-2xl font-semibold text-slate-950">Impossible de charger la prévisualisation.</h2>
          <p class="mx-auto mt-3 max-w-2xl text-sm leading-7 text-rose-900/80">{{ loadError }}</p>
        </div>
      </div>
    </section>

    <StatsDataDocumentPage v-else-if="document" :document="document" />
  </main>
</template>
