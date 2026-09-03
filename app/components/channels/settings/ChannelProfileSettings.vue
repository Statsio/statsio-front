<script setup lang="ts">
import { ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import StepChannelCategories from '@/components/channels/steps/StepChannelCategories.vue'
import { updateChannelProfile, updateChannelMedia, type Channel, type ChannelCategory, type ChannelKind } from '@/api/channels'
import { useMediaLibrary } from '@/composables/useMediaLibrary'
import { getErrorMessage } from '@/lib/http-errors'
import { SUB_BRAND_OPTIONS, normalizeSubBrand, type SubBrand } from '@/types/sub-brand'

const KIND_OPTIONS: { value: ChannelKind; label: string }[] = [
  { value: 'redaction', label: 'Rédaction' },
  { value: 'institution', label: 'Institution' },
  { value: 'independant', label: 'Analyste indépendant' },
]

const props = defineProps<{ channelId: number; channel: Channel }>()
const emit = defineEmits<{ reload: [] }>()

const inputClass = 'rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20'

// --- Identité ---
const profileForm = ref({
  name: '',
  handle: '',
  kind: 'independant' as ChannelKind,
  sub_brand: 'statsio' as SubBrand,
  description: '',
  categories: [] as ChannelCategory[],
})
const profileSaving = ref(false)
const profileSuccess = ref(false)
const profileError = ref('')

const mediaLibrary = useMediaLibrary()
const logoMediaId = ref<number | null>(null)
const logoPreview = ref<string | null>(null)
const bannerMediaId = ref<number | null>(null)
const bannerPreview = ref<string | null>(null)
const mediaSaving = ref(false)
const mediaSuccess = ref(false)

// --- Couleurs ---
const colorPrimary = ref('#8b5cf6')
const colorSecondary = ref('#3b82f6')
const colorSaving = ref(false)
const colorSuccess = ref(false)

const initForm = () => {
  profileForm.value = {
    name: props.channel.profile.name,
    handle: props.channel.profile.handle,
    kind: props.channel.profile.kind ?? 'independant',
    sub_brand: normalizeSubBrand(props.channel.profile.sub_brand),
    description: props.channel.profile.description ?? '',
    categories: [...(props.channel.profile.categories ?? [])],
  }
  colorPrimary.value = props.channel.profile.custom_color_primary || '#8b5cf6'
  colorSecondary.value = props.channel.profile.custom_color_secondary || '#3b82f6'
}

initForm()
watch(() => props.channel, initForm)

const saveProfile = async () => {
  profileSaving.value = true
  profileError.value = ''
  profileSuccess.value = false
  try {
    await updateChannelProfile(props.channelId, {
      name: profileForm.value.name,
      handle: profileForm.value.handle,
      kind: profileForm.value.kind,
      sub_brand: profileForm.value.sub_brand,
      description: profileForm.value.description,
      categories: profileForm.value.categories,
    })
    emit('reload')
    profileSuccess.value = true
    setTimeout(() => profileSuccess.value = false, 3000)
  } catch (e) {
    profileError.value = getErrorMessage(e, 'Erreur lors de la sauvegarde.')
  } finally {
    profileSaving.value = false
  }
}

const pickLogo = () => {
  mediaLibrary.open({
    mode: 'pick',
    directory: 'channels/logos',
    onSelect: (media) => {
      logoMediaId.value = media.id
      logoPreview.value = media.url
    },
  })
}

const pickBanner = () => {
  mediaLibrary.open({
    mode: 'pick',
    directory: 'channels/banners',
    onSelect: (media) => {
      bannerMediaId.value = media.id
      bannerPreview.value = media.url
    },
  })
}

const saveMedia = async () => {
  if (logoMediaId.value == null && bannerMediaId.value == null) return
  mediaSaving.value = true
  mediaSuccess.value = false
  try {
    await updateChannelMedia(props.channelId, {
      logoMediaId: logoMediaId.value,
      bannerMediaId: bannerMediaId.value,
    })
    emit('reload')
    logoMediaId.value = null
    bannerMediaId.value = null
    mediaSuccess.value = true
    setTimeout(() => mediaSuccess.value = false, 3000)
  } catch {}
  finally { mediaSaving.value = false }
}

const saveColors = async () => {
  colorSaving.value = true
  colorSuccess.value = false
  try {
    await updateChannelProfile(props.channelId, {
      custom_color_primary: colorPrimary.value,
      custom_color_secondary: colorSecondary.value,
    })
    emit('reload')
    colorSuccess.value = true
    setTimeout(() => colorSuccess.value = false, 3000)
  } catch {}
  finally { colorSaving.value = false }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Identité -->
    <div class="card-xl p-6 sm:p-7">
      <p class="eyebrow text-primary">Identité</p>
      <form class="mt-5 flex flex-col gap-4" @submit.prevent="saveProfile">
        <label class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-700">Nom de la chaîne</span>
          <input v-model="profileForm.name" type="text" :class="inputClass" placeholder="Nom de la chaîne" required />
        </label>
        <label class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-700">Identifiant (@handle)</span>
          <input v-model="profileForm.handle" type="text" :class="inputClass" placeholder="mon_handle" required />
        </label>
        <label class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-700">Type de chaîne</span>
          <select v-model="profileForm.kind" :class="inputClass">
            <option v-for="opt in KIND_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </label>
        <label class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-700">Description</span>
          <textarea v-model="profileForm.description" rows="3" :class="inputClass + ' resize-none'" placeholder="Décrivez votre chaîne..." />
        </label>
        <label class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-700">Domaine</span>
          <select v-model="profileForm.sub_brand" :class="inputClass">
            <option v-for="opt in SUB_BRAND_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <span class="text-xs text-slate-400">Détermine sur quel site la chaîne apparaît et les catégories proposées.</span>
        </label>
        <div class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-700">Catégories</span>
          <StepChannelCategories v-model="profileForm.categories" :domain="profileForm.sub_brand" />
        </div>
        <p v-if="profileError" class="text-sm text-rose-600">{{ profileError }}</p>
        <div class="mt-1 flex items-center gap-3">
          <AppButton type="submit" variant="primary" size="md" :disabled="profileSaving">
            {{ profileSaving ? 'Enregistrement...' : 'Enregistrer' }}
          </AppButton>
          <span v-if="profileSuccess" class="text-sm font-semibold text-emerald-600">✓ Sauvegardé</span>
        </div>
      </form>
    </div>

    <!-- Logo & bannière -->
    <div class="card-xl p-6 sm:p-7">
      <p class="eyebrow text-primary">Visuels</p>
      <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          class="group flex cursor-pointer flex-col items-center gap-3 rounded-[1.5rem] border-2 border-dashed border-slate-200 p-6 text-center transition hover:border-primary/40"
          @click="pickLogo"
        >
          <div class="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
            <img v-if="logoPreview || channel.profile.logo_url" :src="logoPreview ?? channel.profile.logo_url ?? ''" alt="" class="h-full w-full object-cover" />
            <div v-else class="flex h-full w-full items-center justify-center text-slate-300">
              <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-700">Logo</p>
            <p class="mt-0.5 text-xs text-slate-400">Choisir depuis la bibliothèque de médias</p>
          </div>
        </button>
        <button
          type="button"
          class="group flex cursor-pointer flex-col items-center gap-3 rounded-[1.5rem] border-2 border-dashed border-slate-200 p-6 text-center transition hover:border-primary/40"
          @click="pickBanner"
        >
          <div class="h-16 w-full overflow-hidden rounded-xl bg-slate-100">
            <img v-if="bannerPreview || channel.profile.banner_url" :src="bannerPreview ?? channel.profile.banner_url ?? ''" alt="" class="h-full w-full object-cover" />
            <div v-else class="flex h-full w-full items-center justify-center text-slate-300">
              <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-700">Bannière</p>
            <p class="mt-0.5 text-xs text-slate-400">Choisir depuis la bibliothèque de médias</p>
          </div>
        </button>
      </div>
      <div class="mt-4 flex items-center gap-3">
        <AppButton variant="primary" size="md" :disabled="mediaSaving || (logoMediaId == null && bannerMediaId == null)" @click="saveMedia">
          {{ mediaSaving ? 'Enregistrement...' : 'Enregistrer les visuels' }}
        </AppButton>
        <span v-if="mediaSuccess" class="text-sm font-semibold text-emerald-600">✓ Sauvegardé</span>
      </div>
    </div>

    <!-- Couleurs -->
    <div class="card-xl p-6 sm:p-7">
      <p class="eyebrow text-primary">Apparence</p>
      <p class="mt-2 text-lg font-bold text-slate-950">Couleur de la chaîne</p>
      <div class="mt-4 h-16 w-full overflow-hidden rounded-2xl" :style="`background:linear-gradient(135deg,${colorPrimary}33,${colorSecondary}55)`" />
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <label class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-700">Couleur principale</span>
          <div class="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
            <input v-model="colorPrimary" type="color" class="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
            <span class="font-mono text-sm text-slate-600">{{ colorPrimary }}</span>
          </div>
        </label>
        <label class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-700">Couleur secondaire</span>
          <div class="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
            <input v-model="colorSecondary" type="color" class="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
            <span class="font-mono text-sm text-slate-600">{{ colorSecondary }}</span>
          </div>
        </label>
      </div>
      <div class="mt-4 flex items-center gap-3">
        <AppButton variant="primary" size="md" :disabled="colorSaving" @click="saveColors">
          {{ colorSaving ? 'Enregistrement...' : 'Enregistrer' }}
        </AppButton>
        <span v-if="colorSuccess" class="text-sm font-semibold text-emerald-600">✓ Sauvegardé</span>
      </div>
    </div>
  </div>
</template>
