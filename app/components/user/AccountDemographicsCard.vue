<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import AppButton from '@/components/ui/AppButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useAppNotifications } from '@/composables/useAppNotifications'
import { updateProfile, fetchProfileReferenceData, type ProfileReferenceData } from '@/api/statsio-user'
import { profileLabel } from '@/lib/profile-labels'
import { lookupCommunesByPostalCode, type CommuneResult } from '@/lib/geo-lookup'
import type { AuthUser } from '@/types/auth'

const authStore = useAuthStore()
const notifications = useAppNotifications()

const referenceData = ref<ProfileReferenceData | null>(null)
onMounted(async () => {
  try {
    referenceData.value = await fetchProfileReferenceData()
  } catch {
    referenceData.value = null
  }
})

const form = reactive({
  gender_id: null as number | null,
  age_range_id: null as number | null,
  socio_professional_category_id: null as number | null,
  marital_status_id: null as number | null,
  region: '',
  city: '',
  zip_code: '',
})
const isSaving = ref(false)

// Ville/région sont déduites du code postal (geo.api.gouv.fr) — verrouillées tant qu'aucune
// commune n'a été retenue, pour éviter une incohérence code postal / ville / région.
const communeSelected = ref(false)

watch(
  () => authStore.user?.profile,
  (profile) => {
    if (!profile) return
    form.gender_id = profile.gender_id ?? null
    form.age_range_id = profile.age_range_id ?? null
    form.socio_professional_category_id = profile.socio_professional_category_id ?? null
    form.marital_status_id = profile.marital_status_id ?? null
    form.region = profile.region ?? ''
    form.city = profile.city ?? ''
    form.zip_code = profile.zip_code ?? ''
    communeSelected.value = Boolean(profile.city && profile.region)
  },
  { immediate: true },
)

const communeResults = ref<CommuneResult[]>([])
const communeLookupLoading = ref(false)
const communeNoResults = ref(false)

function selectCommune(commune: CommuneResult) {
  form.city = commune.nom
  form.region = commune.region?.nom ?? ''
  communeSelected.value = true
  communeResults.value = []
  communeNoResults.value = false
}

const runCommuneLookup = useDebounceFn(async () => {
  const code = form.zip_code.trim()
  if (!/^\d{5}$/.test(code)) {
    communeResults.value = []
    return
  }
  communeLookupLoading.value = true
  try {
    const results = await lookupCommunesByPostalCode(code)
    if (results.length === 1) selectCommune(results[0]!)
    else if (results.length > 1) communeResults.value = results
    else {
      communeResults.value = []
      communeNoResults.value = true
    }
  } catch {
    communeResults.value = []
  } finally {
    communeLookupLoading.value = false
  }
}, 400)

function onZipCodeInput() {
  communeSelected.value = false
  communeNoResults.value = false
  communeResults.value = []
  form.city = ''
  form.region = ''
  runCommuneLookup()
}

const isProfileComplete = computed(() => authStore.user?.profile_complete ?? false)
const missingCount = computed(
  () =>
    [form.gender_id, form.age_range_id, form.socio_professional_category_id, form.marital_status_id, form.region].filter(
      (v) => !v,
    ).length,
)

async function handleSubmit() {
  isSaving.value = true
  try {
    const result = (await updateProfile({
      gender_id: form.gender_id || undefined,
      age_range_id: form.age_range_id || undefined,
      socio_professional_category_id: form.socio_professional_category_id || undefined,
      marital_status_id: form.marital_status_id || undefined,
      region: form.region || undefined,
      city: form.city || undefined,
      zip_code: form.zip_code || undefined,
    })) as { user: AuthUser }
    if (result?.user && authStore.user) Object.assign(authStore.user, result.user)
    notifications.success('Informations démographiques enregistrées.')
  } catch {
    notifications.error('Une erreur est survenue. Veuillez réessayer.')
  } finally {
    isSaving.value = false
  }
}

const selectClass =
  'rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20'
</script>

<template>
  <section id="demographics" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.05)] sm:p-7">
    <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
      <div class="text-xs font-bold uppercase tracking-[0.04em] text-slate-400">Informations démographiques</div>
      <span
        class="rounded-full px-2.5 py-1 text-[11px] font-bold"
        :class="isProfileComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
      >
        {{ isProfileComplete ? 'Profil complet' : `${missingCount} champ(s) manquant(s)` }}
      </span>
    </div>
    <p class="mb-5 text-[13px] leading-6 text-slate-500">
      Ces informations débloquent les statistiques détaillées des sondages (répartition des votants par âge, sexe,
      profession et région). Elles restent anonymisées dans les résultats agrégés.
    </p>

    <form class="grid grid-cols-1 gap-4 sm:grid-cols-2" @submit.prevent="handleSubmit">
      <label class="flex flex-col gap-2">
        <span class="text-sm font-semibold text-slate-700">Sexe</span>
        <select v-model="form.gender_id" :class="selectClass">
          <option :value="null">Non renseigné</option>
          <option v-for="opt in referenceData?.genders ?? []" :key="opt.id" :value="opt.id">
            {{ profileLabel(opt.key, opt.label) }}
          </option>
        </select>
      </label>

      <label class="flex flex-col gap-2">
        <span class="text-sm font-semibold text-slate-700">Tranche d'âge</span>
        <select v-model="form.age_range_id" :class="selectClass">
          <option :value="null">Non renseigné</option>
          <option v-for="opt in referenceData?.age_ranges ?? []" :key="opt.id" :value="opt.id">
            {{ profileLabel(opt.key, opt.label) }}
          </option>
        </select>
      </label>

      <label class="flex flex-col gap-2">
        <span class="text-sm font-semibold text-slate-700">Profession / CSP</span>
        <select v-model="form.socio_professional_category_id" :class="selectClass">
          <option :value="null">Non renseigné</option>
          <option v-for="opt in referenceData?.socio_professional_categories ?? []" :key="opt.id" :value="opt.id">
            {{ profileLabel(opt.key, opt.label) }}
          </option>
        </select>
      </label>

      <label class="flex flex-col gap-2">
        <span class="text-sm font-semibold text-slate-700">Situation matrimoniale</span>
        <select v-model="form.marital_status_id" :class="selectClass">
          <option :value="null">Non renseigné</option>
          <option v-for="opt in referenceData?.marital_statuses ?? []" :key="opt.id" :value="opt.id">
            {{ profileLabel(opt.key, opt.label) }}
          </option>
        </select>
      </label>

      <label class="relative flex flex-col gap-2">
        <span class="text-sm font-semibold text-slate-700">Code postal</span>
        <input
          v-model="form.zip_code"
          type="text"
          inputmode="numeric"
          maxlength="5"
          placeholder="ex. 75001"
          :class="selectClass"
          @input="onZipCodeInput"
        />
        <p v-if="communeLookupLoading" class="text-xs text-slate-400">Recherche…</p>
        <p v-else-if="communeNoResults" class="text-xs text-rose-500">Aucune ville trouvée pour ce code postal.</p>
        <div
          v-if="communeResults.length > 0"
          class="absolute left-0 right-0 top-full z-10 mt-1 flex max-h-56 flex-col gap-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
        >
          <button
            v-for="c in communeResults"
            :key="c.nom + (c.region?.code ?? '')"
            type="button"
            class="rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-primary/10"
            @click="selectCommune(c)"
          >
            {{ c.nom }} <span class="text-slate-400">· {{ c.region?.nom }}</span>
          </button>
        </div>
      </label>

      <label class="flex flex-col gap-2">
        <span class="text-sm font-semibold text-slate-700">Ville</span>
        <input
          v-model="form.city"
          type="text"
          :disabled="!communeSelected"
          placeholder="Renseignez d'abord le code postal"
          :class="[selectClass, 'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400']"
        />
      </label>

      <label class="flex flex-col gap-2">
        <span class="text-sm font-semibold text-slate-700">Région</span>
        <input
          v-model="form.region"
          type="text"
          :disabled="!communeSelected"
          placeholder="Renseignez d'abord le code postal"
          :class="[selectClass, 'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400']"
        />
      </label>

      <div class="flex items-center gap-3 sm:col-span-2">
        <AppButton type="submit" variant="primary" size="md" :disabled="isSaving">
          {{ isSaving ? 'Enregistrement…' : 'Enregistrer' }}
        </AppButton>
      </div>
    </form>
  </section>
</template>
