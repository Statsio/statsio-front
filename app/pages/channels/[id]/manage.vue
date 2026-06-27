<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: ['auth'], ssr: false })
import { computed, onMounted, ref, watch } from 'vue'
import { getErrorMessage } from '@/lib/http-errors'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import {
  getChannel, updateChannelProfile, updateChannelMedia, deleteChannel,
  getChannelMembers, getChannelSubscribers, getChannelCategories,
  type Channel, type ChannelMember, type ChannelSubscriber, type ChannelCategoryItem,
  type ChannelCategory,
} from '@/api/channels'

const route = useRoute()
const router = useRouter()
const channelId = Number(route.params.id)

// ── State ──────────────────────────────────────────────────────────────────
const channel = ref<Channel | null>(null)
const isLoading = ref(true)
const loadError = ref('')

type Section = 'dashboard' | 'profile' | 'privacy' | 'members' | 'subscribers' | 'settings'
const activeSection = ref<Section>('dashboard')

const sidebarItems: { id: Section; label: string }[] = [
  { id: 'dashboard',    label: 'Dashboard' },
  { id: 'profile',      label: 'Profil' },
  { id: 'privacy',      label: 'Confidentialité' },
  { id: 'members',      label: 'Membres & rôles' },
  { id: 'subscribers',  label: 'Abonnés' },
  { id: 'settings',     label: 'Paramètres' },
]

// ── Profil form ────────────────────────────────────────────────────────────
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

// ── Privacy form ───────────────────────────────────────────────────────────
const ageRestriction = ref(0)
const privacySaving = ref(false)
const privacySuccess = ref(false)

// ── Colors form ────────────────────────────────────────────────────────────
const colorPrimary = ref('#8b5cf6')
const colorSecondary = ref('#3b82f6')
const colorSaving = ref(false)
const colorSuccess = ref(false)

// ── Members ────────────────────────────────────────────────────────────────
const members = ref<ChannelMember[]>([])
const membersLoading = ref(false)

// ── Subscribers ────────────────────────────────────────────────────────────
const subscribers = ref<ChannelSubscriber[]>([])
const subscribersTotal = ref(0)
const subscribersPage = ref(1)
const subscribersLastPage = ref(1)
const subscribersLoading = ref(false)

// ── Categories ─────────────────────────────────────────────────────────────
const availableCategories = ref<ChannelCategoryItem[]>([])

// ── Delete ─────────────────────────────────────────────────────────────────
const deleteConfirm = ref('')
const deleteLoading = ref(false)

// ── Helpers ────────────────────────────────────────────────────────────────
const channelInitials = computed(() =>
  (channel.value?.profile?.name ?? '').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || 'CH'
)

const formatCount = (n: number | undefined) => {
  if (n === undefined || n === null) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

const statusLabel: Record<string, { label: string; classes: string }> = {
  active:    { label: 'Active',     classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  suspended: { label: 'Suspendue',  classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  banned:    { label: 'Bannie',     classes: 'bg-rose-50 text-rose-700 border-rose-200' },
  anonymized:{ label: 'Anonymisée', classes: 'bg-slate-100 text-slate-500 border-slate-200' },
}
const getStatus = (s: string) => statusLabel[s] ?? { label: s, classes: 'bg-slate-100 text-slate-500 border-slate-200' }

const roleLabel: Record<string, string> = {
  owner: 'Propriétaire', admin: 'Admin', moderator: 'Modérateur', subscriber: 'Abonné',
}

const categoryOptions = computed(() =>
  availableCategories.value.map((c: ChannelCategoryItem) => ({ value: c.slug, label: c.label }))
)

const getCategoryLabel = (slug: string) =>
  availableCategories.value.find((c: ChannelCategoryItem) => c.slug === slug)?.label ?? slug

const inputClass = 'rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20'

// ── Init ───────────────────────────────────────────────────────────────────
const initForms = (ch: Channel) => {
  profileForm.value = {
    name: ch.profile.name,
    handle: ch.profile.handle,
    description: ch.profile.description ?? '',
    categories: [...(ch.profile.categories ?? [])],
  }
  ageRestriction.value = ch.profile.age_restriction ?? 0
  colorPrimary.value = ch.profile.custom_color_primary ?? '#8b5cf6'
  colorSecondary.value = ch.profile.custom_color_secondary ?? '#3b82f6'
}

onMounted(async () => {
  try {
    const [data, cats] = await Promise.all([
      getChannel(channelId),
      getChannelCategories(),
    ])
    availableCategories.value = cats
    if (!data.profile) { loadError.value = 'Cette chaîne n\'a pas de profil configuré.'; return }
    channel.value = data
    initForms(data)
  } catch { loadError.value = 'Impossible de charger la chaîne.' }
  finally { isLoading.value = false }
})

// Charger membres/abonnés à la demande
watch(activeSection, async (section: Section) => {
  if (section === 'members' && members.value.length === 0) {
    membersLoading.value = true
    try { members.value = await getChannelMembers(channelId) } catch {}
    finally { membersLoading.value = false }
  }
  if (section === 'subscribers' && subscribers.value.length === 0) {
    await loadSubscribers(1)
  }
})

const loadSubscribers = async (page: number) => {
  subscribersLoading.value = true
  try {
    const res = await getChannelSubscribers(channelId, page)
    subscribers.value = res.data
    subscribersTotal.value = res.total
    subscribersLastPage.value = res.last_page
    subscribersPage.value = page
  } catch {}
  finally { subscribersLoading.value = false }
}

// ── Actions ────────────────────────────────────────────────────────────────
const reload = async () => {
  const data = await getChannel(channelId)
  channel.value = data
  initForms(data)
}

const saveProfile = async () => {
  if (!channel.value) return
  profileSaving.value = true; profileError.value = ''; profileSuccess.value = false
  try {
    await updateChannelProfile(channelId, {
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
  } finally { profileSaving.value = false }
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
  mediaSaving.value = true; mediaSuccess.value = false
  try {
    await updateChannelMedia(channelId, {
      ...(logoFile.value ? { logo: logoFile.value } : {}),
      ...(bannerFile.value ? { banner: bannerFile.value } : {}),
    })
    await reload()
    mediaSuccess.value = true
    setTimeout(() => mediaSuccess.value = false, 3000)
  } catch {}
  finally { mediaSaving.value = false }
}

const savePrivacy = async () => {
  if (!channel.value) return
  privacySaving.value = true; privacySuccess.value = false
  try {
    await updateChannelProfile(channelId, { age_restriction: Number(ageRestriction.value) })
    await reload()
    privacySuccess.value = true
    setTimeout(() => privacySuccess.value = false, 3000)
  } catch {}
  finally { privacySaving.value = false }
}

const saveColors = async () => {
  if (!channel.value) return
  colorSaving.value = true; colorSuccess.value = false
  try {
    await updateChannelProfile(channelId, {
      custom_color_primary: colorPrimary.value,
      custom_color_secondary: colorSecondary.value,
    })
    await reload()
    colorSuccess.value = true
    setTimeout(() => colorSuccess.value = false, 3000)
  } catch {}
  finally { colorSaving.value = false }
}

const handleDelete = async () => {
  if (deleteConfirm.value !== channel.value?.profile.name) return
  deleteLoading.value = true
  try {
    await deleteChannel(channelId)
    router.push('/mes-chaines')
  } catch {}
  finally { deleteLoading.value = false }
}
</script>

<template>
  <main class="pb-24 pt-4">
    <section class="section pb-10">
      <div class="container flex flex-col gap-8">

        <!-- Skeleton -->
        <template v-if="isLoading">
          <div class="space-y-3">
            <div class="h-3 w-20 animate-pulse rounded-full bg-slate-200" />
            <div class="h-10 w-64 animate-pulse rounded-2xl bg-slate-200" />
          </div>
          <div class="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div class="flex flex-col gap-4">
              <div class="h-48 animate-pulse rounded-[2rem] bg-slate-200" />
              <div class="h-64 animate-pulse rounded-[2rem] bg-slate-100" />
            </div>
            <div class="h-96 animate-pulse rounded-[2rem] bg-slate-100" />
          </div>
        </template>

        <!-- Erreur -->
        <template v-else-if="loadError">
          <div class="mx-auto max-w-lg text-center">
            <p class="text-sm text-rose-600">{{ loadError }}</p>
            <AppButton variant="secondary" size="md" class="mt-4" as="router-link" to="/mes-chaines">Retour</AppButton>
          </div>
        </template>

        <!-- Contenu -->
        <template v-else-if="channel">

          <!-- Breadcrumb + titre -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <button type="button" class="eyebrow text-slate-400 hover:text-primary transition" @click="router.push('/mes-chaines')">Mes chaînes</button>
              <span class="text-slate-300">/</span>
              <p class="eyebrow text-primary">Gestion</p>
            </div>
            <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">{{ channel.profile.name }}</h1>
                <p class="mt-2 text-lg text-slate-500">@{{ channel.profile.handle }}</p>
              </div>
              <AppButton variant="outline" size="sm" as="router-link" :to="`/chaines/@${channel.profile.handle}`">Voir la chaîne publique</AppButton>
            </div>
          </div>

          <!-- Layout 2 colonnes -->
          <div class="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">

            <!-- ── Sidebar ── -->
            <aside class="flex flex-col gap-4">
              <!-- Card chaîne -->
              <div class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                <div class="h-20 w-full" :style="channel.profile.custom_color_primary ? `background:linear-gradient(135deg,${channel.profile.custom_color_primary}33,${channel.profile.custom_color_secondary??channel.profile.custom_color_primary}55)` : 'background:linear-gradient(135deg,#f1f5f9,#e2e8f0)'">
                  <img v-if="channel.profile.banner_url" :src="channel.profile.banner_url" class="h-full w-full object-cover" />
                </div>
                <div class="px-6 pb-6">
                  <div class="-mt-8 mb-3">
                    <img v-if="channel.profile.logo_url" :src="channel.profile.logo_url" class="h-16 w-16 rounded-2xl object-cover ring-4 ring-white" />
                    <div v-else class="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white ring-4 ring-white" :style="channel.profile.custom_color_primary?`background:${channel.profile.custom_color_primary}`:'background:var(--color-primary)'">{{ channelInitials }}</div>
                  </div>
                  <p class="text-base font-semibold text-slate-950">{{ channel.profile.name }}</p>
                  <p class="text-sm text-slate-500">@{{ channel.profile.handle }}</p>
                  <div class="mt-3 flex flex-wrap items-center gap-2">
                    <span class="rounded-full border px-2.5 py-0.5 text-xs font-semibold" :class="getStatus(channel.status).classes">{{ getStatus(channel.status).label }}</span>
                    <span v-if="channel.profile.is_featured" class="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">En vedette</span>
                  </div>
                  <div class="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div class="text-center">
                      <p class="text-lg font-bold text-slate-950">{{ formatCount(channel.profile.subscriber_count) }}</p>
                      <p class="text-xs text-slate-500">abonnés</p>
                    </div>
                    <div class="text-center">
                      <p class="text-lg font-bold text-slate-950">{{ formatCount(channel.profile.view_count) }}</p>
                      <p class="text-xs text-slate-500">vues</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Nav -->
              <nav class="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                <button v-for="item in sidebarItems" :key="item.id" type="button"
                  class="w-full rounded-[1.25rem] px-4 py-3 text-left text-sm font-semibold transition"
                  :class="activeSection === item.id ? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-50'"
                  @click="activeSection = item.id">
                  {{ item.label }}
                </button>
              </nav>
            </aside>

            <!-- ── Contenu principal ── -->
            <div class="flex flex-col gap-6">

              <!-- DASHBOARD -->
              <section v-if="activeSection === 'dashboard'" class="flex flex-col gap-6">
                <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Vue d'ensemble</p>
                  <h2 class="mt-2 text-2xl font-semibold text-slate-950">Statistiques</h2>
                  <div class="mt-6 grid gap-4 sm:grid-cols-3">
                    <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Abonnés</p>
                      <p class="mt-2 text-3xl font-bold text-slate-950">{{ formatCount(channel.profile.subscriber_count) }}</p>
                    </div>
                    <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Vues totales</p>
                      <p class="mt-2 text-3xl font-bold text-slate-950">{{ formatCount(channel.profile.view_count) }}</p>
                    </div>
                    <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Statut</p>
                      <p class="mt-3 text-base font-bold text-slate-950">{{ getStatus(channel.status).label }}</p>
                    </div>
                  </div>
                </div>
                <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Catégories</p>
                  <h2 class="mt-2 text-2xl font-semibold text-slate-950">Ligne éditoriale</h2>
                  <div class="mt-4 flex flex-wrap gap-2">
                    <span v-for="cat in channel.profile.categories" :key="cat" class="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{{ getCategoryLabel(cat) }}</span>
                    <span v-if="!channel.profile.categories?.length" class="text-sm text-slate-400">Aucune catégorie définie</span>
                  </div>
                </div>
              </section>

              <!-- PROFIL -->
              <section v-else-if="activeSection === 'profile'" class="flex flex-col gap-6">
                <!-- Infos texte -->
                <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Profil</p>
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
                      <AppSelect v-model="profileForm.categories" :options="categoryOptions" multiple placeholder="Choisir des catégories" />
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
                    <!-- Logo -->
                    <label class="group flex cursor-pointer flex-col items-center gap-3 rounded-[1.5rem] border-2 border-dashed border-slate-200 p-6 text-center transition hover:border-primary/40">
                      <input type="file" accept="image/*" class="sr-only" @change="onLogoChange" />
                      <div class="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
                        <img v-if="logoPreview || channel.profile.logo_url" :src="logoPreview ?? channel.profile.logo_url ?? ''" class="h-full w-full object-cover" />
                        <div v-else class="flex h-full w-full items-center justify-center text-slate-300">
                          <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      </div>
                      <div>
                        <p class="text-sm font-semibold text-slate-700">Logo</p>
                        <p class="mt-0.5 text-xs text-slate-400">PNG, JPG — max 5 Mo</p>
                      </div>
                    </label>
                    <!-- Bannière -->
                    <label class="group flex cursor-pointer flex-col items-center gap-3 rounded-[1.5rem] border-2 border-dashed border-slate-200 p-6 text-center transition hover:border-primary/40">
                      <input type="file" accept="image/*" class="sr-only" @change="onBannerChange" />
                      <div class="h-16 w-full overflow-hidden rounded-xl bg-slate-100">
                        <img v-if="bannerPreview || channel.profile.banner_url" :src="bannerPreview ?? channel.profile.banner_url ?? ''" class="h-full w-full object-cover" />
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
              </section>

              <!-- CONFIDENTIALITE -->
              <section v-else-if="activeSection === 'privacy'" class="flex flex-col gap-6">
                <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Restriction d'âge</p>
                  <h2 class="mt-2 text-2xl font-semibold text-slate-950">Public cible</h2>
                  <div class="mt-4 flex flex-col gap-3">
                    <label v-for="opt in [{value:0,label:'Tout public'},{value:13,label:'13 ans et plus'},{value:16,label:'16 ans et plus'},{value:18,label:'18 ans et plus'}]" :key="opt.value"
                      class="flex cursor-pointer items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-primary/30"
                      :class="ageRestriction === opt.value ? 'border-primary/40 bg-primary/5' : ''">
                      <input type="radio" name="age_restriction" :value="opt.value" v-model="ageRestriction" class="accent-primary" />
                      <span class="text-sm font-semibold text-slate-700">{{ opt.label }}</span>
                    </label>
                  </div>
                  <div class="mt-4 flex items-center gap-3">
                    <AppButton variant="primary" size="md" :disabled="privacySaving" @click="savePrivacy">
                      {{ privacySaving ? 'Enregistrement...' : 'Enregistrer' }}
                    </AppButton>
                    <span v-if="privacySuccess" class="text-sm font-semibold text-emerald-600">✓ Sauvegardé</span>
                  </div>
                </div>
              </section>

              <!-- MEMBRES -->
              <section v-else-if="activeSection === 'members'" class="flex flex-col gap-6">
                <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Équipe</p>
                      <h2 class="mt-2 text-2xl font-semibold text-slate-950">Membres & rôles</h2>
                    </div>
                  </div>
                  <div v-if="membersLoading" class="mt-6 space-y-3">
                    <div v-for="i in 2" :key="i" class="h-16 animate-pulse rounded-[1.5rem] bg-slate-100" />
                  </div>
                  <div v-else class="mt-6 flex flex-col gap-3">
                    <div v-for="member in members" :key="member.id" class="flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                      <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                          {{ member.name.split(' ').map((w:string)=>w[0]).slice(0,2).join('').toUpperCase() || '?' }}
                        </div>
                        <div>
                          <p class="text-sm font-semibold text-slate-950">{{ member.name }}</p>
                          <p class="text-xs text-slate-500">{{ member.email }}</p>
                        </div>
                      </div>
                      <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{{ roleLabel[member.role] ?? member.role }}</span>
                    </div>
                    <p v-if="!members.length" class="text-sm text-slate-400">Aucun membre trouvé.</p>
                  </div>
                </div>
              </section>

              <!-- ABONNES -->
              <section v-else-if="activeSection === 'subscribers'" class="flex flex-col gap-6">
                <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Audience</p>
                  <h2 class="mt-2 text-2xl font-semibold text-slate-950">Abonnés <span class="text-slate-400">({{ subscribersTotal }})</span></h2>
                  <div v-if="subscribersLoading" class="mt-6 space-y-3">
                    <div v-for="i in 3" :key="i" class="h-14 animate-pulse rounded-[1.5rem] bg-slate-100" />
                  </div>
                  <div v-else class="mt-6 flex flex-col gap-3">
                    <div v-for="sub in subscribers" :key="sub.id" class="flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                      <div class="flex items-center gap-3">
                        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                          {{ sub.name.split(' ').map((w:string)=>w[0]).slice(0,2).join('').toUpperCase() || '?' }}
                        </div>
                        <div>
                          <p class="text-sm font-semibold text-slate-950">{{ sub.name }}</p>
                          <p class="text-xs text-slate-500">{{ sub.email }}</p>
                        </div>
                      </div>
                      <span class="text-xs text-slate-400">{{ new Date(sub.subscribed_at).toLocaleDateString('fr-FR') }}</span>
                    </div>
                    <p v-if="!subscribers.length" class="text-sm text-slate-400">Aucun abonné pour l'instant.</p>
                  </div>
                  <!-- Pagination -->
                  <div v-if="subscribersLastPage > 1" class="mt-4 flex items-center justify-between">
                    <AppButton variant="secondary" size="sm" :disabled="subscribersPage <= 1" @click="loadSubscribers(subscribersPage - 1)">Précédent</AppButton>
                    <span class="text-sm text-slate-500">Page {{ subscribersPage }} / {{ subscribersLastPage }}</span>
                    <AppButton variant="secondary" size="sm" :disabled="subscribersPage >= subscribersLastPage" @click="loadSubscribers(subscribersPage + 1)">Suivant</AppButton>
                  </div>
                </div>
              </section>

              <!-- PARAMETRES -->
              <section v-else-if="activeSection === 'settings'" class="flex flex-col gap-6">
                <!-- Couleurs -->
                <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Apparence</p>
                  <h2 class="mt-2 text-2xl font-semibold text-slate-950">Couleurs de la chaîne</h2>
                  <!-- Preview -->
                  <div class="mt-4 h-16 w-full overflow-hidden rounded-2xl" :style="`background:linear-gradient(135deg,${colorPrimary}33,${colorSecondary}55)`" />
                  <div class="mt-4 grid gap-4 sm:grid-cols-2">
                    <label class="flex flex-col gap-2">
                      <span class="text-sm font-semibold text-slate-700">Couleur principale</span>
                      <div class="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                        <input type="color" v-model="colorPrimary" class="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
                        <span class="font-mono text-sm text-slate-600">{{ colorPrimary }}</span>
                      </div>
                    </label>
                    <label class="flex flex-col gap-2">
                      <span class="text-sm font-semibold text-slate-700">Couleur secondaire</span>
                      <div class="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                        <input type="color" v-model="colorSecondary" class="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
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

                <!-- Zone dangereuse -->
                <div class="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">Zone dangereuse</p>
                  <h2 class="mt-2 text-2xl font-semibold text-slate-950">Supprimer la chaîne</h2>
                  <p class="mt-3 text-sm leading-7 text-slate-600">
                    Cette action est <strong>irréversible</strong>. Tous les contenus et abonnés seront perdus.<br />
                    Tapez <strong>{{ channel.profile.name }}</strong> pour confirmer.
                  </p>
                  <input v-model="deleteConfirm" type="text" :class="inputClass + ' mt-4 w-full border-rose-200'" :placeholder="channel.profile.name" />
                  <div class="mt-4">
                    <AppButton
                      variant="outline"
                      size="md"
                      class="border-rose-400 text-rose-700 hover:bg-rose-100"
                      :disabled="deleteConfirm !== channel.profile.name || deleteLoading"
                      @click="handleDelete"
                    >
                      {{ deleteLoading ? 'Suppression...' : 'Supprimer définitivement' }}
                    </AppButton>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </template>

      </div>
    </section>
  </main>
</template>
