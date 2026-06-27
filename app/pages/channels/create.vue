<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: ['auth'], ssr: false, title: 'Créer une chaîne', robots: 'noindex,nofollow' })
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import { createChannel, getChannelCategories, type ChannelCategory, type ChannelCategoryItem } from '@/api/channels'
import { checkHandleAvailability } from '@/api/channels-validation'
import { getErrorMessage } from '@/lib/http-errors'

const router = useRouter()

const availableCategories = ref<ChannelCategoryItem[]>([])

onMounted(async () => {
  try {
    availableCategories.value = await getChannelCategories()
  } catch {}
})

const formData = ref({
  name: '',
  handle: '',
  description: '',
  categories: [] as ChannelCategory[],
  logo: null as File | null,
  banner: null as File | null,
  primaryColor: '#3b82f6',
  accentColor: '#10b981',
})

const agreements = ref({
  rgpd: false,
  publicVisibility: false,
  termsOfService: false,
})

const isSubmitting = ref(false)
const submitError = ref('')
const isCheckingHandle = ref(false)
const handleError = ref('')
const handleAvailable = ref<boolean | null>(null)

const categoryOptions = computed(() =>
  availableCategories.value.map((c: ChannelCategoryItem) => ({ value: c.slug, label: c.label }))
)

const handleLogoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    formData.value.logo = target.files[0]
  }
}

const handleBannerUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    formData.value.banner = target.files[0]
  }
}

let handleCheckTimeout: ReturnType<typeof setTimeout> | null = null

const checkHandle = async () => {
  const handle = formData.value.handle.trim()

  if (!handle) {
    handleError.value = ''
    handleAvailable.value = null
    return
  }

  if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
    handleError.value = 'L\'identifiant ne peut contenir que des lettres, chiffres et underscores'
    handleAvailable.value = false
    return
  }

  if (handle.length < 3) {
    handleError.value = 'L\'identifiant doit contenir au moins 3 caractères'
    handleAvailable.value = false
    return
  }

  if (handle.length > 50) {
    handleError.value = 'L\'identifiant ne doit pas dépasser 50 caractères'
    handleAvailable.value = false
    return
  }

  isCheckingHandle.value = true
  handleError.value = ''

  try {
    const available = await checkHandleAvailability(handle)
    handleAvailable.value = available

    if (!available) {
      handleError.value = 'Cet identifiant est déjà utilisé'
    }
  } catch (error) {
    handleError.value = 'Impossible de vérifier la disponibilité'
    handleAvailable.value = null
  } finally {
    isCheckingHandle.value = false
  }
}

const onHandleInput = () => {
  handleAvailable.value = null
  handleError.value = ''

  if (handleCheckTimeout) {
    clearTimeout(handleCheckTimeout)
  }

  handleCheckTimeout = setTimeout(() => {
    checkHandle()
  }, 500)
}

const handleSubmit = async () => {
  if (!formData.value.name || !formData.value.handle || !formData.value.description || formData.value.categories.length === 0) {
    submitError.value = 'Veuillez remplir tous les champs obligatoires'
    return
  }

  if (handleAvailable.value === false) {
    submitError.value = 'L\'identifiant choisi n\'est pas disponible'
    return
  }

  if (!agreements.value.rgpd || !agreements.value.publicVisibility || !agreements.value.termsOfService) {
    submitError.value = 'Veuillez accepter toutes les conditions obligatoires'
    return
  }

  isSubmitting.value = true
  submitError.value = ''

  try {
    const channel = await createChannel({
      name: formData.value.name,
      handle: formData.value.handle,
      description: formData.value.description,
      categories: formData.value.categories,
      logo: formData.value.logo || undefined,
      banner: formData.value.banner || undefined,
      custom_color_primary: formData.value.primaryColor,
      custom_color_secondary: formData.value.accentColor,
    })

    router.push('/mes-chaines')
  } catch (error) {
    submitError.value = getErrorMessage(error, 'Impossible de créer la chaîne pour le moment.')
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  router.push('/mes-chaines')
}
</script>

<template>
  <main class="pb-24 pt-4">
    <section class="section">
      <div class="container">
        <div class="mx-auto max-w-4xl">
          <div class="flex flex-col gap-4">
            <p class="eyebrow text-primary">Créateur</p>
            <div>
              <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                Créer une chaîne
              </h1>
              <p class="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                Configurez votre présence éditoriale en quelques étapes simples.
              </p>
            </div>
          </div>

          <form class="mt-12 flex flex-col gap-8" @submit.prevent="handleSubmit">
            <div v-if="submitError" class="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
              <p class="text-sm font-semibold text-rose-700">{{ submitError }}</p>
            </div>

            <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)] sm:p-8">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Informations de base</p>
              <h2 class="mt-2 text-2xl font-semibold text-slate-950">Identité de votre chaîne</h2>

              <div class="mt-6 flex flex-col gap-6">
                <label class="flex flex-col gap-2">
                  <span class="text-sm font-semibold text-slate-700">
                    Nom de la chaîne <span class="text-rose-500">*</span>
                  </span>
                  <input
                    v-model="formData.name"
                    type="text"
                    required
                    class="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Ma Chaîne Éditoriale"
                  />
                  <span class="text-xs text-slate-500">Le nom public de votre chaîne</span>
                </label>

                <label class="flex flex-col gap-2">
                  <span class="text-sm font-semibold text-slate-700">
                    Identifiant <span class="text-rose-500">*</span>
                  </span>
                  <div class="relative">
                    <div class="flex items-center gap-2 rounded-[1.25rem] border bg-white px-4 py-3 transition focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20"
                      :class="handleError ? 'border-rose-300' : handleAvailable === true ? 'border-emerald-300' : 'border-slate-200'">
                      <span class="text-sm font-semibold text-slate-500">@</span>
                      <input
                        v-model="formData.handle"
                        type="text"
                        required
                        pattern="[a-zA-Z0-9_]+"
                        maxlength="50"
                        class="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        placeholder="ma_chaine"
                        @input="onHandleInput"
                      />
                      <svg v-if="isCheckingHandle" class="h-4 w-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <svg v-else-if="handleAvailable === true" class="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <svg v-else-if="handleAvailable === false" class="h-4 w-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <span v-if="handleError" class="text-xs text-rose-500">{{ handleError }}</span>
                  <span v-else-if="handleAvailable === true" class="text-xs text-emerald-600">Cet identifiant est disponible</span>
                  <span v-else class="text-xs text-slate-500">Votre identifiant unique (lettres, chiffres et underscores uniquement)</span>
                </label>

                <label class="flex flex-col gap-2">
                  <span class="text-sm font-semibold text-slate-700">
                    Description <span class="text-rose-500">*</span>
                  </span>
                  <textarea
                    v-model="formData.description"
                    required
                    rows="4"
                    class="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Décrivez votre ligne éditoriale, vos thématiques et ce qui rend votre chaîne unique..."
                  ></textarea>
                  <span class="text-xs text-slate-500">Présentez votre chaîne à vos futurs abonnés</span>
                </label>

                <label class="flex flex-col gap-2">
                  <span class="text-sm font-semibold text-slate-700">
                    Catégories <span class="text-rose-500">*</span>
                  </span>
                  <AppSelect
                    v-model="formData.categories"
                    :options="categoryOptions"
                    multiple
                    searchable
                    search-placeholder="Rechercher une catégorie..."
                    placeholder="Sélectionnez une ou plusieurs catégories"
                  />
                  <span class="text-xs text-slate-500">Aidez les utilisateurs à découvrir votre chaîne</span>
                </label>
              </div>
            </div>

            <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)] sm:p-8">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Identité visuelle</p>
              <h2 class="mt-2 text-2xl font-semibold text-slate-950">Personnalisez votre chaîne</h2>

              <div class="mt-6 flex flex-col gap-6">
                <div class="flex flex-col gap-2">
                  <span class="text-sm font-semibold text-slate-700">Logo de la chaîne</span>
                  <div class="flex items-start gap-4">
                    <div class="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
                      <svg class="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div class="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        id="logo-upload"
                        @change="handleLogoUpload"
                      />
                      <label
                        for="logo-upload"
                        class="inline-flex cursor-pointer items-center gap-2 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Télécharger un logo
                      </label>
                      <p class="mt-2 text-xs text-slate-500">Format carré recommandé (500x500px minimum)</p>
                      <p v-if="formData.logo" class="mt-1 text-xs font-semibold text-primary">
                        {{ formData.logo.name }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col gap-2">
                  <span class="text-sm font-semibold text-slate-700">Bannière de la chaîne</span>
                  <div class="flex flex-col gap-4">
                    <div class="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
                      <svg class="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        id="banner-upload"
                        @change="handleBannerUpload"
                      />
                      <label
                        for="banner-upload"
                        class="inline-flex cursor-pointer items-center gap-2 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Télécharger une bannière
                      </label>
                      <p class="mt-2 text-xs text-slate-500">Format large recommandé (1920x400px minimum)</p>
                      <p v-if="formData.banner" class="mt-1 text-xs font-semibold text-primary">
                        {{ formData.banner.name }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="grid gap-6 sm:grid-cols-2">
                  <label class="flex flex-col gap-2">
                    <span class="text-sm font-semibold text-slate-700">Couleur principale</span>
                    <div class="flex items-center gap-3">
                      <input
                        v-model="formData.primaryColor"
                        type="color"
                        class="h-12 w-12 cursor-pointer rounded-xl border border-slate-200"
                      />
                      <input
                        v-model="formData.primaryColor"
                        type="text"
                        class="flex-1 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </label>

                  <label class="flex flex-col gap-2">
                    <span class="text-sm font-semibold text-slate-700">Couleur d'accent</span>
                    <div class="flex items-center gap-3">
                      <input
                        v-model="formData.accentColor"
                        type="color"
                        class="h-12 w-12 cursor-pointer rounded-xl border border-slate-200"
                      />
                      <input
                        v-model="formData.accentColor"
                        type="text"
                        class="flex-1 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)] sm:p-8">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Conditions</p>
              <h2 class="mt-2 text-2xl font-semibold text-slate-950">Acceptation des conditions</h2>

              <div class="mt-6 flex flex-col gap-4">
                <AppCheckbox
                  v-model="agreements.rgpd"
                  required
                  label="J'accepte la politique de confidentialité et le traitement de mes données personnelles"
                  description="Vos données seront traitées conformément au RGPD. Vous pouvez consulter notre politique de confidentialité pour plus d'informations."
                />

                <AppCheckbox
                  v-model="agreements.publicVisibility"
                  required
                  label="J'accepte que ma chaîne soit rendue publique et visible de tous"
                  description="Votre chaîne sera accessible publiquement sur Statsio. Les utilisateurs pourront s'abonner et consulter vos contenus."
                />

                <AppCheckbox
                  v-model="agreements.termsOfService"
                  required
                  label="J'accepte les conditions générales d'utilisation de Statsio"
                  description="En créant une chaîne, vous acceptez de respecter nos règles de publication et notre charte éditoriale."
                />
              </div>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <AppButton type="button" variant="outline" size="lg" :disabled="isSubmitting" @click="handleCancel">
                Annuler
              </AppButton>
              <AppButton type="submit" variant="primary" size="lg" :disabled="isSubmitting">
                {{ isSubmitting ? 'Création en cours...' : 'Créer ma chaîne' }}
              </AppButton>
            </div>
          </form>
        </div>
      </div>
    </section>
  </main>
</template>
