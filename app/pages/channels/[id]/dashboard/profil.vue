<script setup lang="ts">
definePageMeta({ layout: 'channel-dashboard', middleware: ['auth'], ssr: false, title: 'Profil de la chaîne', robots: 'noindex,nofollow' })
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import StepChannelCategories from '@/components/channels/steps/StepChannelCategories.vue'
import { updateChannelProfile, updateChannelMedia, type ChannelCategory } from '@/api/channels'
import { getErrorMessage } from '@/lib/http-errors'
import { useChannelDashboard } from '@/composables/useChannelDashboard'

const route = useRoute()
const channelId = computed(() => Number(route.params.id))
const { channel, isLoading, loadError, ensureLoaded, reload } = useChannelDashboard()

const profileForm = ref({ name: '', handle: '', description: '', categories: [] as ChannelCategory[] })
const profileSaving = ref(false)
const profileSuccess = ref(false)
const profileError = ref('')

const logoFile = ref<File | null>(null)
const logoPreview = ref<string | null>(null)
const bannerFile = ref<File | null>(null)
const bannerPreview = ref<string | null>(null)
const mediaSaving = ref(false)
const mediaSuccess = ref(false)

const inputClass = 'rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20'

const initForm = () => {
  if (!channel.value) return
  profileForm.value = {
    name: channel.value.profile.name,
    handle: channel.value.profile.handle,
    description: channel.value.profile.description ?? '',
    categories: [...(channel.value.profile.categories ?? [])],
  }
}

onMounted(async () => {
  await ensureLoaded(channelId.value)
  initForm()
})

watch(channel, initForm)

const saveProfile = async () => {
  if (!channel.value) return
  profileSaving.value = true
  profileError.value = ''
  profileSuccess.value = false
  try {
    await updateChannelProfile(channelId.value, {
      name: profileForm.value.name,
      handle: profileForm.value.handle,
      description: profileForm.value.description,
      categories: profileForm.value.categories,
    })
    await reload()
    profileSuccess.value = true
    setTimeout(() => profileSuccess.value = false, 3000)
  } catch (e) {
    profileError.value = getErrorMessage(e, 'Erreur lors de la sauvegarde.')
  } finally {
    profileSaving.value = false
  }
}

const onLogoChange = (e: Event) => {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  logoFile.value = f
  logoPreview.value = URL.createObjectURL(f)
}

const onBannerChange = (e: Event) => {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  bannerFile.value = f
  bannerPreview.value = URL.createObjectURL(f)
}

const saveMedia = async () => {
  if (!logoFile.value && !bannerFile.value) return
  mediaSaving.value = true
  mediaSuccess.value = false
  try {
    await updateChannelMedia(channelId.value, {
      ...(logoFile.value ? { logo: logoFile.value } : {}),
      ...(bannerFile.value ? { banner: bannerFile.value } : {}),
    })
    await reload()
    logoFile.value = null
    bannerFile.value = null
    mediaSuccess.value = true
    setTimeout(() => mediaSuccess.value = false, 3000)
  } catch {}
  finally { mediaSaving.value = false }
}
</script>

<template>
  <div class="mx-auto flex max-w-4xl flex-col gap-6">

    <template v-if="isLoading">
      <div class="h-10 w-64 animate-pulse rounded-2xl bg-slate-200" />
      <div class="h-96 animate-pulse rounded-[2rem] bg-slate-100" />
    </template>

    <p v-else-if="loadError" class="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
      {{ loadError }}
    </p>

    <template v-else-if="channel">
      <div>
        <p class="eyebrow text-primary">Profil</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Profil de la chaîne</h1>
        <p class="mt-2 text-slate-500">L'identité publique de votre chaîne : informations, catégories et visuels.</p>
      </div>

      <!-- Infos texte -->
      <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Informations</p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-950">Informations de la chaîne</h2>
        <form class="mt-6 flex flex-col gap-4" @submit.prevent="saveProfile">
          <label class="flex flex-col gap-2">
            <span class="text-sm font-semibold text-slate-700">Nom de la chaîne</span>
            <input v-model="profileForm.name" type="text" :class="inputClass" placeholder="Nom de la chaîne" required />
          </label>
          <label class="flex flex-col gap-2">
            <span class="text-sm font-semibold text-slate-700">Identifiant (@handle)</span>
            <input v-model="profileForm.handle" type="text" :class="inputClass" placeholder="mon_handle" required />
          </label>
          <label class="flex flex-col gap-2">
            <span class="text-sm font-semibold text-slate-700">Description</span>
            <textarea v-model="profileForm.description" rows="4" :class="inputClass + ' resize-none'" placeholder="Décrivez votre chaîne..." />
          </label>
          <div class="flex flex-col gap-2">
            <span class="text-sm font-semibold text-slate-700">Catégories</span>
            <StepChannelCategories v-model="profileForm.categories" />
          </div>
          <p v-if="profileError" class="text-sm text-rose-600">{{ profileError }}</p>
          <div class="mt-2 flex items-center gap-3">
            <AppButton type="submit" variant="primary" size="md" :disabled="profileSaving">
              {{ profileSaving ? 'Enregistrement...' : 'Enregistrer' }}
            </AppButton>
            <span v-if="profileSuccess" class="text-sm font-semibold text-emerald-600">✓ Sauvegardé</span>
          </div>
        </form>
      </div>

      <!-- Logo & bannière -->
      <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Visuels</p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-950">Logo et bannière</h2>
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <label class="group flex cursor-pointer flex-col items-center gap-3 rounded-[1.5rem] border-2 border-dashed border-slate-200 p-6 text-center transition hover:border-primary/40">
            <input type="file" accept="image/*" class="sr-only" @change="onLogoChange" />
            <div class="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
              <img v-if="logoPreview || channel.profile.logo_url" :src="logoPreview ?? channel.profile.logo_url ?? ''" alt="" class="h-full w-full object-cover" />
              <div v-else class="flex h-full w-full items-center justify-center text-slate-300">
                <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-700">Logo</p>
              <p class="mt-0.5 text-xs text-slate-400">PNG, JPG — max 5 Mo</p>
            </div>
          </label>
          <label class="group flex cursor-pointer flex-col items-center gap-3 rounded-[1.5rem] border-2 border-dashed border-slate-200 p-6 text-center transition hover:border-primary/40">
            <input type="file" accept="image/*" class="sr-only" @change="onBannerChange" />
            <div class="h-16 w-full overflow-hidden rounded-xl bg-slate-100">
              <img v-if="bannerPreview || channel.profile.banner_url" :src="bannerPreview ?? channel.profile.banner_url ?? ''" alt="" class="h-full w-full object-cover" />
              <div v-else class="flex h-full w-full items-center justify-center text-slate-300">
                <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-700">Bannière</p>
              <p class="mt-0.5 text-xs text-slate-400">PNG, JPG — max 10 Mo</p>
            </div>
          </label>
        </div>
        <div class="mt-4 flex items-center gap-3">
          <AppButton variant="primary" size="md" :disabled="mediaSaving || (!logoFile && !bannerFile)" @click="saveMedia">
            {{ mediaSaving ? 'Upload...' : 'Enregistrer les visuels' }}
          </AppButton>
          <span v-if="mediaSuccess" class="text-sm font-semibold text-emerald-600">✓ Sauvegardé</span>
        </div>
      </div>
    </template>

  </div>
</template>
