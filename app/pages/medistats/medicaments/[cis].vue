<script setup lang="ts">
definePageMeta({ layout: 'default' })
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchMedicamentDetail, fetchMedicamentGeneriques } from '@/api/medicaments'
import MedicamentsDetail from '@/components/medicaments/MedicamentsDetail.vue'
import type { GenericGroup, Medicament } from '@/types/medicaments'
import { getHttpErrorStatus } from '@/lib/http-errors'

const route = useRoute()

const medicament = ref<Medicament | null>(null)
const isLoading = ref(true)

const generiques = ref<GenericGroup[]>([])
const isLoadingGeneriques = ref(false)

const cis = computed(() => Number(route.params.cis))

usePageSeo({
  title: computed(() =>
    medicament.value ? `${medicament.value.elementPharmaceutique} — MédiStats` : 'Médicament — MédiStats',
  ),
  description: computed(() =>
    medicament.value
      ? `Fiche médicament ${medicament.value.elementPharmaceutique} (${medicament.value.formePharmaceutique}) : composition, présentations et conditions de prescription.`
      : undefined,
  ),
})

async function loadGeneriques(m: Medicament) {
  const dci = m.composition[0]?.denominationSubstance
  if (!dci) {
    generiques.value = []
    return
  }

  isLoadingGeneriques.value = true
  try {
    const groups = await fetchMedicamentGeneriques(dci)
    generiques.value = groups
      .map((group) => ({
        ...group,
        medicaments: group.medicaments.filter((med) => med.cis !== m.cis),
      }))
      .filter((group) => group.medicaments.length > 0)
  } catch {
    generiques.value = []
  } finally {
    isLoadingGeneriques.value = false
  }
}

// Chargé côté serveur (SSR) : titre, description et fiche dans le HTML.
// La clé suit le paramètre d'URL : changer de fiche relance le chargement.
const { data: loaded, status: loadStatus, error: loadError } = await useAsyncData(
  () => `medistats-medicament-${cis.value}`,
  async () => {
    try {
      return await fetchMedicamentDetail(cis.value)
    } catch (e) {
      throw createError({ statusCode: getHttpErrorStatus(e, 404), statusMessage: 'Ce médicament est introuvable.' })
    }
  },
)
function failIfMissing() {
  if (!loadError.value) return
  throw createError({ statusCode: loadError.value.statusCode ?? 404, statusMessage: 'Ce médicament est introuvable.', fatal: true })
}
failIfMissing()
watch(loadError, (e) => {
  if (e) showError(createError({ statusCode: e.statusCode ?? 404, statusMessage: 'Ce médicament est introuvable.', fatal: true }))
})
watch([loaded, loadStatus], ([v, st]) => {
  medicament.value = v ?? null
  isLoading.value = st === 'pending'
}, { immediate: true })

// Génériques : complément non indispensable au référencement, chargé dans le navigateur.
watch(medicament, (m) => {
  generiques.value = []
  if (m && import.meta.client) void loadGeneriques(m)
}, { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 pb-24 pt-10 md:px-8 md:pt-12">
    <p v-if="isLoading" class="py-16 text-center text-[14px] text-slate-400">Chargement…</p>
    <MedicamentsDetail
      v-else-if="medicament"
      :medicament="medicament"
      :generiques="generiques"
      :is-loading-generiques="isLoadingGeneriques"
    />
  </div>
</template>
