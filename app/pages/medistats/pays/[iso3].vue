<script setup lang="ts">
definePageMeta({ layout: 'default' })
import { computed, onMounted, ref, watch } from 'vue'
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

async function load() {
  isLoading.value = true
  try {
    pays.value = await fetchPaysDetail(iso3.value)
  } catch (e) {
    showError(
      createError({
        statusCode: getHttpErrorStatus(e, 404),
        statusMessage: 'Ce pays est introuvable.',
        fatal: true,
      }),
    )
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
watch(iso3, load)
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 pb-24 pt-10 md:px-8 md:pt-12">
    <p v-if="isLoading" class="py-16 text-center text-[14px] text-slate-400">Chargement…</p>
    <PaysDetail v-else-if="pays" :pays="pays" />
  </div>
</template>
