<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: ['auth'], ssr: false, title: 'Mon compte', robots: 'noindex,nofollow' })
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { useAuthStore } from '@/stores/auth'
import { updateProfile, anonymizeAccount } from '@/api/statsio-user'

const authStore = useAuthStore()
const router = useRouter()

type TabKey = 'apercu' | 'historique' | 'favoris' | 'abonnements' | 'parametres'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'apercu', label: 'Aperçu' },
  { key: 'historique', label: 'Historique' },
  { key: 'favoris', label: 'Favoris' },
  { key: 'abonnements', label: 'Chaînes suivies' },
  { key: 'parametres', label: 'Paramètres' },
]

const activeTab = ref<TabKey>('apercu')
const selectTab = (key: TabKey) => { activeTab.value = key }

const userInitials = computed(() => {
  const firstName = authStore.user?.profile?.first_name?.[0] ?? ''
  const lastName = authStore.user?.profile?.last_name?.[0] ?? ''
  return `${firstName}${lastName}`.trim() || authStore.user?.email?.[0]?.toUpperCase() || 'ST'
})

const firstNameOnly = computed(() => authStore.user?.profile?.first_name || authStore.displayName.split(' ')[0])

const handle = computed(() => {
  const local = authStore.user?.email?.split('@')[0] ?? ''
  return local ? `@${local}` : ''
})

const memberSince = computed(() => {
  const createdAt = authStore.user?.created_at
  if (!createdAt) return '—'
  const year = new Date(createdAt).getFullYear()
  return Number.isNaN(year) ? '—' : String(year)
})

/* ───────── Aperçu — activité (données de démonstration, en attendant l'API dédiée) ───────── */

const IN_PROGRESS = [
  { title: 'Délais d’attente aux urgences par région', channel: 'Medistats', kind: 'Dataset', thumbBg: '#f2ecfd', thumbFg: '#8b5cf6', pct: '62%' },
  { title: 'Urgences saturées : ce que disent les chiffres', channel: 'Medistats', kind: 'Article', thumbBg: '#eaf1fe', thumbFg: '#3b82f6', pct: '30%' },
]

const ACTIVE_CHANNELS = [
  { name: 'Éco&Vous', color: '#8b5cf6', initials: 'EV', note: '2 nouveaux contenus' },
  { name: 'Climat Data', color: '#3b82f6', initials: 'CD', note: 'Dataset mis à jour' },
  { name: 'TVStats', color: '#166534', initials: 'TV', note: '1 nouvel article' },
]

/* ───────── Historique (données de démonstration) ───────── */

const HISTORY_GROUPS = [
  {
    label: 'Aujourd’hui',
    items: [
      { title: 'Le pouvoir d’achat des ménages en 12 graphiques', channel: 'Éco&Vous', kind: 'Article', time: '10:42', thumbBg: '#eaf1fe', thumbFg: '#3b82f6' },
      { title: 'Sécheresse 2026 : nappes phréatiques en direct', channel: 'Climat Data', kind: 'Dataset', time: '09:15', thumbBg: '#f2ecfd', thumbFg: '#8b5cf6' },
    ],
  },
  {
    label: 'Cette semaine',
    items: [
      { title: 'Où vivent les 18-25 ans en France ?', channel: 'Territoires', kind: 'Article', time: 'Lundi', thumbBg: '#eaf1fe', thumbFg: '#3b82f6' },
      { title: 'Le télétravail doit-il rester la norme ?', channel: 'Statsio', kind: 'Sondage', time: 'Lundi', thumbBg: '#fdeef1', thumbFg: '#e11d48' },
      { title: 'Access et late : la programmation reprend', channel: 'TVStats', kind: 'Article', time: 'Dimanche', thumbBg: '#eaf1fe', thumbFg: '#3b82f6', siteName: 'TVStats', siteLogo: '/brand/tvstats/tvstats-logo.svg' },
    ],
  },
]

/* ───────── Favoris (données de démonstration) ───────── */

type Favorite = {
  id: string
  kind: string
  badgeColor: string
  title: string
  channel: string
  thumbBg: string
  thumbFg: string
  siteName?: string
  siteLogo?: string
}

const FAVORITES: Favorite[] = [
  { id: 'f1', kind: 'Article', badgeColor: '#3b82f6', title: 'Le pouvoir d’achat des ménages en 12 graphiques', channel: 'Éco&Vous', thumbBg: '#eaf1fe', thumbFg: '#3b82f6' },
  { id: 'f2', kind: 'Dataset', badgeColor: '#8b5cf6', title: 'Sécheresse 2026 : nappes phréatiques en direct', channel: 'Climat Data', thumbBg: '#f2ecfd', thumbFg: '#8b5cf6' },
  { id: 'f3', kind: 'Sondage', badgeColor: '#e11d48', title: 'Le télétravail doit-il rester la norme ?', channel: 'Statsio', thumbBg: '#fdeef1', thumbFg: '#e11d48' },
  { id: 'f4', kind: 'Article', badgeColor: '#3b82f6', title: 'Où vivent les 18-25 ans en France ?', channel: 'Territoires', thumbBg: '#eaf1fe', thumbFg: '#3b82f6' },
  { id: 'f5', kind: 'Dataset', badgeColor: '#8b5cf6', title: 'Délais d’attente aux urgences par région', channel: 'Medistats', thumbBg: '#f2ecfd', thumbFg: '#8b5cf6', siteName: 'Medistats', siteLogo: '/brand/medistats/medistats-logo.svg' },
  { id: 'f6', kind: 'Article', badgeColor: '#3b82f6', title: 'Access et late : la programmation reprend', channel: 'TVStats', thumbBg: '#eaf1fe', thumbFg: '#3b82f6', siteName: 'TVStats', siteLogo: '/brand/tvstats/tvstats-logo.svg' },
]

const favIds = ref(FAVORITES.map((f) => f.id))
const favorites = computed(() => FAVORITES.filter((f) => favIds.value.includes(f.id)))
const toggleFav = (id: string) => {
  favIds.value = favIds.value.includes(id) ? favIds.value.filter((x) => x !== id) : [...favIds.value, id]
}

/* ───────── Chaînes suivies (données de démonstration) ───────── */

type Subscription = { id: string; name: string; desc: string; followers: string; color: string; initials: string }

const SUBSCRIPTIONS: Subscription[] = [
  { id: 's1', name: 'Éco&Vous', desc: 'Économie & pouvoir d’achat', followers: '48.2k', color: '#8b5cf6', initials: 'EV' },
  { id: 's2', name: 'Climat Data', desc: 'Environnement & ressources', followers: '31.7k', color: '#3b82f6', initials: 'CD' },
  { id: 's3', name: 'Territoires', desc: 'Démographie & société', followers: '22.4k', color: '#e11d48', initials: 'TR' },
  { id: 's4', name: 'TVStats', desc: 'Audiences & programmes', followers: '19.9k', color: '#166534', initials: 'TV' },
]

const subs = reactive<Record<string, boolean>>({ s1: true, s2: true, s3: true, s4: true })
const subscriptions = computed(() => SUBSCRIPTIONS.map((s) => ({ ...s, on: subs[s.id] })))
const subCount = computed(() => Object.values(subs).filter(Boolean).length)
const toggleSub = (id: string) => { subs[id] = !subs[id] }

/* ───────── Paramètres ───────── */

const isEditingName = ref(false)
const profileForm = reactive({
  first_name: authStore.user?.profile?.first_name ?? '',
  last_name: authStore.user?.profile?.last_name ?? '',
})
const isSavingProfile = ref(false)
const profileError = ref<string | null>(null)

const startEditName = () => {
  profileForm.first_name = authStore.user?.profile?.first_name ?? ''
  profileForm.last_name = authStore.user?.profile?.last_name ?? ''
  profileError.value = null
  isEditingName.value = true
}

async function handleUpdateProfile() {
  isSavingProfile.value = true
  profileError.value = null
  try {
    const result = await updateProfile({
      first_name: profileForm.first_name || undefined,
      last_name: profileForm.last_name || undefined,
    }) as any
    if (result?.user && authStore.user) {
      authStore.user.profile = result.user.profile
    }
    isEditingName.value = false
  } catch {
    profileError.value = 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    isSavingProfile.value = false
  }
}

const notifs = reactive({
  articles: true,
  weekly: true,
  replies: false,
  offers: false,
})
const notifRows: { key: keyof typeof notifs; label: string; desc: string }[] = [
  { key: 'articles', label: 'Nouveaux articles', desc: 'Des chaînes que vous suivez' },
  { key: 'weekly', label: 'Résumé hebdomadaire', desc: 'Le meilleur de la semaine, chaque lundi' },
  { key: 'replies', label: 'Réponses aux commentaires', desc: 'Quand quelqu’un vous répond' },
  { key: 'offers', label: 'Offres et actualités Statsio', desc: 'Nouveautés produit, occasionnellement' },
]
const toggleNotif = (key: keyof typeof notifs) => { notifs[key] = !notifs[key] }

const isLoggingOut = computed(() => authStore.isLoggingOut)
async function handleLogout() {
  await authStore.logout()
  router.push('/')
}

const deleteConfirm = ref(false)
const isDeletingAccount = ref(false)
const deleteError = ref<string | null>(null)
const askDelete = () => { deleteConfirm.value = true; deleteError.value = null }
const cancelDelete = () => { deleteConfirm.value = false }
async function confirmDelete() {
  isDeletingAccount.value = true
  deleteError.value = null
  try {
    await anonymizeAccount()
    authStore.clearSession()
    router.push('/')
  } catch {
    deleteError.value = 'La suppression a échoué. Veuillez réessayer.'
  } finally {
    isDeletingAccount.value = false
    deleteConfirm.value = false
  }
}

const handleCreateContent = () => router.push('/contenus')
const handleCreateChannel = () => router.push('/mes-chaines?create=1')
</script>

<template>
  <main class="pb-24 pt-4">
    <section class="section pb-10">
      <div class="container flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-9">

        <!-- ===== SIDEBAR ===== -->
        <aside class="flex w-full flex-col gap-5 lg:sticky lg:top-28 lg:w-[288px] lg:flex-none">
          <div class="rounded-[1.75rem] border border-slate-200 bg-white p-6 text-center shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
            <div class="mx-auto flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent text-3xl font-bold text-white">
              <img
                v-if="authStore.user?.profile?.avatar"
                :src="authStore.user.profile.avatar"
                alt="Photo de profil"
                class="h-full w-full object-cover"
              />
              <span v-else>{{ userInitials }}</span>
            </div>
            <div class="mt-4 text-[19px] font-bold text-slate-950">{{ authStore.displayName }}</div>
            <div v-if="handle" class="mt-0.5 text-[13px] text-slate-400">{{ handle }}</div>

            <button
              type="button"
              class="mt-[18px] w-full rounded-[10px] border border-slate-200 bg-white py-2.5 text-[13.5px] font-bold text-slate-950 transition hover:bg-slate-50"
              @click="selectTab('parametres')"
            >
              Modifier le profil
            </button>

            <div class="mt-[22px] flex border-t border-slate-100 pt-5">
              <div class="flex-1">
                <div class="font-mono text-base font-semibold text-slate-950">{{ subCount }}</div>
                <div class="mt-0.5 text-[11px] text-slate-400">Abonnements</div>
              </div>
              <div class="flex-1">
                <div class="font-mono text-base font-semibold text-slate-950">{{ favorites.length }}</div>
                <div class="mt-0.5 text-[11px] text-slate-400">Favoris</div>
              </div>
              <div class="flex-1">
                <div class="font-mono text-base font-semibold text-slate-950">{{ memberSince }}</div>
                <div class="mt-0.5 text-[11px] text-slate-400">Membre depuis</div>
              </div>
            </div>
          </div>

          <nav class="flex flex-col gap-0.5 rounded-[1.75rem] border border-slate-200 bg-white p-2.5 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
            <button
              v-for="tab in TABS"
              :key="tab.key"
              type="button"
              class="flex items-center gap-[11px] rounded-xl px-3.5 py-3 text-left transition"
              :class="activeTab === tab.key ? 'bg-primary/10' : 'hover:bg-slate-50'"
              @click="selectTab(tab.key)"
            >
              <span
                class="h-2 w-2 shrink-0 rounded-full"
                :class="activeTab === tab.key ? 'bg-primary' : 'bg-slate-300'"
              />
              <span
                class="text-[14.5px] font-semibold"
                :class="activeTab === tab.key ? 'text-primary' : 'text-slate-700'"
              >
                {{ tab.label }}
              </span>
            </button>

            <div class="my-2 mx-1.5 h-px bg-slate-100" />

            <RouterLink to="/contenus" class="flex items-center gap-[11px] rounded-xl px-3.5 py-3 transition hover:bg-slate-50">
              <span class="h-2 w-2 shrink-0 rounded-full bg-slate-200" />
              <span class="text-[14.5px] font-semibold text-slate-700">Mes contenus</span>
            </RouterLink>
            <RouterLink to="/mes-chaines" class="flex items-center gap-[11px] rounded-xl px-3.5 py-3 transition hover:bg-slate-50">
              <span class="h-2 w-2 shrink-0 rounded-full bg-slate-200" />
              <span class="text-[14.5px] font-semibold text-slate-700">Mes chaînes</span>
            </RouterLink>

            <div class="my-2 mx-1.5 h-px bg-slate-100" />

            <button
              type="button"
              class="rounded-xl px-3.5 py-3 text-left transition hover:bg-rose-50 disabled:opacity-60"
              :disabled="isLoggingOut"
              @click="handleLogout"
            >
              <span class="text-sm font-semibold text-rose-600">{{ isLoggingOut ? 'Déconnexion…' : 'Se déconnecter' }}</span>
            </button>
          </nav>
        </aside>

        <!-- ===== CONTENT ===== -->
        <div class="min-w-0 flex-1">

          <!-- APERÇU -->
          <div v-if="activeTab === 'apercu'">
            <h1 class="m-0 text-[26px] font-bold text-slate-950">Bonjour, {{ firstNameOnly }}</h1>
            <p class="mb-7 mt-1.5 text-[14.5px] text-slate-500">Voici un aperçu de votre activité récente sur Statsio.</p>

            <div class="mb-8 flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-gradient-to-br from-primary to-accent p-7 sm:p-[26px_30px]">
              <div>
                <div class="text-[16.5px] font-bold text-white">Envie de partager vos propres données ?</div>
                <div class="mt-1 text-[13.5px] text-white/85">Publiez un article, un dataset, un sondage — en votre nom ou via une chaîne éditoriale.</div>
              </div>
              <div class="flex flex-none gap-2.5">
                <button type="button" class="rounded-[10px] bg-white px-5 py-[11px] text-[13.5px] font-bold text-slate-950" @click="handleCreateContent">
                  Créer un contenu
                </button>
                <button type="button" class="rounded-[10px] border-[1.5px] border-white/40 bg-white/15 px-5 py-[11px] text-[13.5px] font-bold text-white" @click="handleCreateChannel">
                  Créer une chaîne
                </button>
              </div>
            </div>

            <div class="mb-9 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
                <div class="font-mono text-[28px] font-semibold text-primary">14</div>
                <div class="mt-1.5 text-[13px] text-slate-500">Contenus consultés ce mois-ci</div>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
                <div class="font-mono text-[28px] font-semibold text-accent">3h12</div>
                <div class="mt-1.5 text-[13px] text-slate-500">Temps de lecture cumulé</div>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
                <div class="font-mono text-[28px] font-semibold text-emerald-500">5</div>
                <div class="mt-1.5 text-[13px] text-slate-500">Sondages complétés</div>
              </div>
            </div>

            <div class="mb-9">
              <div class="mb-4 flex items-baseline justify-between">
                <h3 class="m-0 text-[17px] font-bold text-slate-950">Reprendre où vous en étiez</h3>
                <button type="button" class="text-[13px] font-semibold text-primary" @click="selectTab('historique')">Tout l'historique →</button>
              </div>
              <div class="flex flex-col gap-4 sm:flex-row">
                <div
                  v-for="it in IN_PROGRESS"
                  :key="it.title"
                  class="flex flex-1 items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(20,20,30,0.06)]"
                >
                  <div
                    class="flex h-14 w-14 flex-none items-center justify-center rounded-[10px] font-mono text-[9px]"
                    :style="{ background: it.thumbBg, color: it.thumbFg }"
                  >
                    {{ it.kind }}
                  </div>
                  <div class="min-w-0">
                    <div class="truncate text-[13.5px] font-bold leading-tight text-slate-950">{{ it.title }}</div>
                    <div class="my-1 text-[11.5px] text-slate-400">{{ it.channel }}</div>
                    <div class="h-1 rounded-full bg-slate-100">
                      <div class="h-full rounded-full bg-primary" :style="{ width: it.pct }" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 class="mb-4 text-[17px] font-bold text-slate-950">Vos chaînes actives cette semaine</h3>
              <div class="flex flex-col gap-2.5">
                <div
                  v-for="ch in ACTIVE_CHANNELS"
                  :key="ch.name"
                  class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_3px_rgba(20,20,30,0.06)]"
                >
                  <div
                    class="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[10px] text-[13px] font-bold text-white"
                    :style="{ background: ch.color }"
                  >
                    {{ ch.initials }}
                  </div>
                  <div class="flex-1 text-[13.5px] font-semibold text-slate-950">{{ ch.name }}</div>
                  <div class="text-xs text-slate-400">{{ ch.note }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- HISTORIQUE -->
          <div v-else-if="activeTab === 'historique'">
            <div class="mb-6 flex items-baseline justify-between">
              <h1 class="m-0 text-2xl font-bold text-slate-950">Historique de visionnage</h1>
              <span class="text-[13px] font-semibold text-rose-600">Effacer l'historique</span>
            </div>
            <div v-for="grp in HISTORY_GROUPS" :key="grp.label" class="mb-7">
              <div class="mb-3 text-xs font-bold uppercase tracking-[0.04em] text-slate-400">{{ grp.label }}</div>
              <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
                <div
                  v-for="it in grp.items"
                  :key="it.title"
                  class="flex items-center gap-4 border-b border-slate-100 px-5 py-3.5 last:border-b-0"
                >
                  <div
                    class="flex h-14 w-14 flex-none items-center justify-center rounded-[10px] font-mono text-[9px]"
                    :style="{ background: it.thumbBg, color: it.thumbFg }"
                  >
                    {{ it.kind }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5">
                      <img v-if="it.siteLogo" :src="it.siteLogo" :alt="it.siteName" class="h-[13px] w-[13px] rounded-[3px]" />
                      <div class="text-sm font-bold text-slate-950">{{ it.title }}</div>
                    </div>
                    <div class="mt-1 text-xs text-slate-400">{{ it.channel }} · {{ it.kind }} · {{ it.time }}</div>
                  </div>
                  <span class="flex-none text-[13px] font-semibold text-primary">Revoir</span>
                </div>
              </div>
            </div>
          </div>

          <!-- FAVORIS -->
          <div v-else-if="activeTab === 'favoris'">
            <h1 class="m-0 text-2xl font-bold text-slate-950">Favoris</h1>
            <p class="mb-6 mt-1.5 text-[14.5px] text-slate-500">{{ favorites.length }} contenus enregistrés pour plus tard.</p>
            <div class="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
              <div v-for="f in favorites" :key="f.id" class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div
                  class="relative flex h-[120px] items-center justify-center font-mono text-[11px]"
                  :style="{ background: f.thumbBg, color: f.thumbFg }"
                >
                  {{ f.kind }}
                  <button
                    type="button"
                    title="Retirer des favoris"
                    class="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-rose-600"
                    @click="toggleFav(f.id)"
                  >
                    ♥
                  </button>
                </div>
                <div class="p-4">
                  <span class="text-[11px] font-bold uppercase tracking-[0.03em]" :style="{ color: f.badgeColor }">{{ f.kind }}</span>
                  <div class="my-1.5 text-[14.5px] font-bold leading-tight text-slate-950">{{ f.title }}</div>
                  <div v-if="f.siteLogo" class="mb-1.5 flex items-center gap-1.5">
                    <img :src="f.siteLogo" :alt="f.siteName" class="h-[13px] w-[13px] rounded-[3px]" />
                    <span class="text-[11.5px] font-bold text-slate-950">{{ f.siteName }}</span>
                  </div>
                  <div class="text-xs text-slate-400">{{ f.channel }}</div>
                </div>
              </div>
            </div>
            <div v-if="favorites.length === 0" class="py-16 text-center text-sm text-slate-400">
              Aucun favori pour le moment.
            </div>
          </div>

          <!-- CHAÎNES SUIVIES -->
          <div v-else-if="activeTab === 'abonnements'">
            <h1 class="m-0 text-2xl font-bold text-slate-950">Chaînes suivies</h1>
            <p class="mb-6 mt-1.5 text-[14.5px] text-slate-500">Vous suivez {{ subCount }} chaînes éditoriales.</p>
            <div class="flex flex-col gap-3">
              <div
                v-for="s in subscriptions"
                :key="s.id"
                class="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_1px_3px_rgba(20,20,30,0.06)]"
              >
                <div
                  class="flex h-12 w-12 flex-none items-center justify-center rounded-xl text-[15px] font-bold text-white"
                  :style="{ background: s.color }"
                >
                  {{ s.initials }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-[15px] font-bold text-slate-950">{{ s.name }}</div>
                  <div class="mt-0.5 text-[12.5px] text-slate-400">{{ s.desc }} · {{ s.followers }} abonnés</div>
                </div>
                <button
                  type="button"
                  class="flex-none rounded-full px-[18px] py-2.5 text-[13px] font-bold transition"
                  :class="s.on ? 'border-[1.5px] border-slate-200 bg-white text-slate-950' : 'border-[1.5px] border-slate-950 bg-slate-950 text-white'"
                  @click="toggleSub(s.id)"
                >
                  {{ s.on ? 'Abonné' : 'Se réabonner' }}
                </button>
              </div>
            </div>
          </div>

          <!-- PARAMÈTRES -->
          <div v-else-if="activeTab === 'parametres'">
            <h1 class="mb-7 text-2xl font-bold text-slate-950">Paramètres</h1>

            <div class="mb-[22px] rounded-2xl border border-slate-200 bg-white p-[26px_28px] shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
              <div class="mb-[18px] text-xs font-bold uppercase tracking-[0.04em] text-slate-400">Informations personnelles</div>

              <form v-if="isEditingName" class="flex flex-col gap-4" @submit.prevent="handleUpdateProfile">
                <label class="flex flex-col gap-2">
                  <span class="text-sm font-semibold text-slate-700">Prénom</span>
                  <input
                    v-model="profileForm.first_name"
                    type="text"
                    class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Votre prénom"
                  />
                </label>
                <label class="flex flex-col gap-2">
                  <span class="text-sm font-semibold text-slate-700">Nom</span>
                  <input
                    v-model="profileForm.last_name"
                    type="text"
                    class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Votre nom"
                  />
                </label>
                <p v-if="profileError" class="text-sm text-rose-600">{{ profileError }}</p>
                <div class="flex gap-3">
                  <AppButton type="submit" variant="primary" size="sm" :disabled="isSavingProfile">
                    {{ isSavingProfile ? 'Enregistrement…' : 'Enregistrer' }}
                  </AppButton>
                  <AppButton type="button" variant="secondary" size="sm" @click="isEditingName = false">
                    Annuler
                  </AppButton>
                </div>
              </form>

              <template v-else>
                <div class="flex items-center justify-between border-b border-slate-100 py-3.5">
                  <div>
                    <div class="mb-0.5 text-xs text-slate-400">Nom complet</div>
                    <div class="text-[14.5px] font-semibold text-slate-950">{{ authStore.displayName }}</div>
                  </div>
                  <button type="button" class="text-[13px] font-semibold text-primary" @click="startEditName">Modifier</button>
                </div>
                <div class="flex items-center justify-between border-b border-slate-100 py-3.5">
                  <div>
                    <div class="mb-0.5 text-xs text-slate-400">Adresse e-mail</div>
                    <div class="text-[14.5px] font-semibold text-slate-950">{{ authStore.user?.email }}</div>
                  </div>
                </div>
                <div class="flex items-center justify-between py-3.5">
                  <div>
                    <div class="mb-0.5 text-xs text-slate-400">Mot de passe</div>
                    <div class="text-[14.5px] font-semibold text-slate-950">••••••••••</div>
                  </div>
                  <RouterLink to="/forgot-password" class="text-[13px] font-semibold text-primary">Modifier</RouterLink>
                </div>
              </template>
            </div>

            <div class="mb-[22px] rounded-2xl border border-slate-200 bg-white p-[26px_28px] shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
              <div class="mb-[18px] text-xs font-bold uppercase tracking-[0.04em] text-slate-400">Notifications par e-mail</div>
              <div
                v-for="nr in notifRows"
                :key="nr.key"
                class="flex items-center justify-between border-b border-slate-100 py-3.5 last:border-b-0"
              >
                <div>
                  <div class="text-[14.5px] font-semibold text-slate-950">{{ nr.label }}</div>
                  <div class="mt-0.5 text-[12.5px] text-slate-500">{{ nr.desc }}</div>
                </div>
                <button
                  type="button"
                  class="relative h-[22px] w-[38px] flex-none rounded-full transition-colors"
                  :class="notifs[nr.key] ? 'bg-primary' : 'bg-slate-200'"
                  @click="toggleNotif(nr.key)"
                >
                  <span
                    class="absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-all"
                    :class="notifs[nr.key] ? 'left-[18px]' : 'left-0.5'"
                  />
                </button>
              </div>
            </div>

            <div class="mb-[22px] rounded-2xl border border-slate-200 bg-white p-[26px_28px] shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
              <div class="mb-4 text-xs font-bold uppercase tracking-[0.04em] text-slate-400">Compte</div>
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="text-[14.5px] text-slate-600">Vous êtes connecté(e) en tant que {{ authStore.displayName }}.</div>
                <button
                  type="button"
                  class="rounded-[10px] border border-slate-200 bg-white px-[22px] py-[11px] text-[13.5px] font-bold text-slate-950 transition hover:bg-slate-50 disabled:opacity-60"
                  :disabled="isLoggingOut"
                  @click="handleLogout"
                >
                  {{ isLoggingOut ? 'Déconnexion…' : 'Se déconnecter' }}
                </button>
              </div>
            </div>

            <div class="rounded-2xl border border-rose-200 bg-rose-50 p-[26px_28px]">
              <div class="mb-2.5 text-xs font-bold uppercase tracking-[0.04em] text-rose-600">Zone sensible</div>
              <p class="mb-4 max-w-lg text-[13.5px] leading-6 text-slate-600">
                La suppression de votre compte est définitive : historique, favoris et abonnements seront effacés et ne pourront pas être récupérés.
              </p>
              <p v-if="deleteError" class="mb-3 text-sm text-rose-600">{{ deleteError }}</p>
              <div v-if="deleteConfirm" class="flex flex-wrap items-center gap-3">
                <span class="text-[13.5px] font-bold text-rose-600">Confirmer la suppression définitive ?</span>
                <button
                  type="button"
                  class="rounded-[10px] bg-rose-600 px-[18px] py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
                  :disabled="isDeletingAccount"
                  @click="confirmDelete"
                >
                  {{ isDeletingAccount ? 'Suppression…' : 'Oui, supprimer' }}
                </button>
                <button
                  type="button"
                  class="rounded-[10px] border-[1.5px] border-slate-200 bg-white px-[18px] py-2.5 text-[13px] font-bold text-slate-950 disabled:opacity-60"
                  :disabled="isDeletingAccount"
                  @click="cancelDelete"
                >
                  Annuler
                </button>
              </div>
              <button
                v-else
                type="button"
                class="rounded-[10px] border-[1.5px] border-rose-600 bg-white px-5 py-2.5 text-[13.5px] font-bold text-rose-600"
                @click="askDelete"
              >
                Supprimer mon compte
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  </main>
</template>
