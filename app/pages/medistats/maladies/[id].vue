<script setup lang="ts">
definePageMeta({ layout: 'default' })
import { computed, onMounted, ref, watch } from 'vue'
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

async function load() {
  isLoading.value = true
  try {
    maladie.value = await fetchMaladieDetail(id.value)
  } catch (e) {
    showError(
      createError({
        statusCode: getHttpErrorStatus(e, 404),
        statusMessage: 'Cette maladie est introuvable.',
        fatal: true,
      }),
    )
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
watch(id, load)
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 pb-24 pt-10 md:px-8 md:pt-12">
    <p v-if="isLoading" class="py-16 text-center text-[14px] text-slate-400">Chargement…</p>
    <MaladiesDetail v-else-if="maladie" :maladie="maladie" />
  </div>
</template>
