<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import UserDashboardCreatorSection from '@/components/dashboard/UserDashboardCreatorSection.vue'
import UserDashboardHistorySection from '@/components/dashboard/UserDashboardHistorySection.vue'
import UserDashboardLayout from '@/components/dashboard/UserDashboardLayout.vue'
import UserDashboardSidebarCompletion from '@/components/dashboard/UserDashboardSidebarCompletion.vue'
import UserDashboardSidebarNav from '@/components/dashboard/UserDashboardSidebarNav.vue'
import UserDashboardSidebarProfileCard from '@/components/dashboard/UserDashboardSidebarProfileCard.vue'
import UserDashboardSubscriptionsSection from '@/components/dashboard/UserDashboardSubscriptionsSection.vue'
import UserDashboardUsageCard from '@/components/dashboard/UserDashboardUsageCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { getErrorMessage } from '@/lib/http-errors'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const refreshError = ref('')
const isRefreshing = ref(false)
const creatorMode = ref<'profile' | 'channel'>('profile')
const activeTabId = ref('overview')

type SubscriptionAccent = 'emerald' | 'sky' | 'violet'
type HistoryTone = 'primary' | 'accent' | 'secondary'

const sidebarLinks = [
  { id: 'overview', label: 'Vue générale', value: '01' },
  { id: 'subscriptions', label: 'Abonnements', value: '02' },
  { id: 'history', label: 'Historique', value: '03' },
  { id: 'creator', label: 'Création', value: '04' },
]

const subscriptions = computed(() => [
  {
    name: 'Statsio Premium',
    status: 'Actif',
    detail: 'Accès illimité aux analyses avancées, aux exports et aux signaux enrichis.',
    accent: 'emerald',
  },
  {
    name: 'StatsData Pro',
    status: 'Essai',
    detail: 'Comparateurs, exports CSV et exploration avancée sur les jeux de données.',
    accent: 'sky',
  },
  {
    name: 'Chaînes Créateurs',
    status: 'Inactif',
    detail: 'Publiez vos contenus, mettez en avant votre profil public et pilotez votre audience.',
    accent: 'violet',
  },
] satisfies { name: string; status: string; detail: string; accent: SubscriptionAccent }[])

const historyItems = [
  {
    type: 'Article',
    title: 'Présidentielle 2027 : cartographie des indécis',
    context: 'Lu il y a 2 h',
    detail: 'Lecture reprise depuis le dernier scroll sauvegardé.',
    tone: 'primary',
  },
  {
    type: 'StatsData',
    title: 'Inflation par ville en France',
    context: 'Consulté ce matin',
    detail: '23 villes comparées et 4 filtres actifs sur la dernière session.',
    tone: 'accent',
  },
  {
    type: 'Sondage',
    title: 'Réforme des retraites : opinion consolidée',
    context: 'Vu hier',
    detail: 'Baromètre relu après la dernière mise à jour de vague.',
    tone: 'secondary',
  },
  {
    type: 'Article',
    title: 'Hôpitaux : l’impact des déserts médicaux',
    context: 'Vu cette semaine',
    detail: 'Ajouté à vos contenus suivis pour une relecture ultérieure.',
    tone: 'primary',
  },
] satisfies { type: string; title: string; context: string; detail: string; tone: HistoryTone }[]

const activityStats = [
  { label: 'Articles vus', value: '28' },
  { label: 'StatsData explorées', value: '11' },
  { label: 'Sondages suivis', value: '7' },
]

const creatorActions = computed(() => [
  {
    id: 'profile' as const,
    title: 'Activer le profil public',
    detail: 'Expose ton identité, tes publications et tes angles éditoriaux dans un espace public soigné.',
    cta: 'Activer mon profil',
  },
  {
    id: 'channel' as const,
    title: 'Commencer une chaîne',
    detail: 'Crée une présence éditoriale autonome avec branding, contenus et suivi d’audience.',
    cta: 'Créer une chaîne',
  },
])

const completionBlocks = computed(() => [
  { label: 'Identité', done: Boolean(authStore.user?.profile?.first_name && authStore.user?.profile?.last_name) },
  { label: 'Contact', done: Boolean(authStore.user?.email) },
  { label: 'Naissance', done: Boolean(authStore.user?.profile?.birthday) },
  { label: 'Création', done: false },
])

const profileCompletion = computed(() => {
  const completed = completionBlocks.value.filter((item) => item.done).length
  return Math.round((completed / completionBlocks.value.length) * 100)
})

const dashboardBadges = computed(() => [
  authStore.persistMode === 'local' ? 'Session conservée' : 'Session temporaire',
  authStore.tokenType ?? 'Token inconnu',
  authStore.isAuthenticated ? 'Compte connecté' : 'Session incomplète',
])

const userInitials = computed(() => {
  const firstName = authStore.user?.profile?.first_name?.[0] ?? ''
  const lastName = authStore.user?.profile?.last_name?.[0] ?? ''
  const initials = `${firstName}${lastName}`.trim()

  return initials || 'ST'
})

const handleRefresh = async () => {
  refreshError.value = ''
  isRefreshing.value = true

  try {
    await authStore.refreshUser()
  } catch (error) {
    refreshError.value = getErrorMessage(error, 'Impossible de recharger votre dashboard pour le moment.')
  } finally {
    isRefreshing.value = false
  }
}

onMounted(async () => {
  if (!authStore.user && authStore.hasSession) {
    await handleRefresh()
  }
})
</script>

<template>
  <main class="pb-24 pt-32">
      <section class="section pb-10">
        <div class="container flex flex-col gap-8">
          <div class="flex flex-col gap-4">
            <p class="eyebrow text-primary">User dashboard</p>
            <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div class="max-w-4xl">
                <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                  Un dashboard clair pour lire, suivre et commencer à créer.
                </h1>
                <p class="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                  Profil, abonnements, historique de lecture et premiers leviers créateurs réunis dans une seule vue
                  structurée.
                </p>
              </div>

              <AppButton :disabled="isRefreshing" variant="secondary" size="md" @click="handleRefresh">
                {{ isRefreshing ? 'Actualisation...' : 'Actualiser le dashboard' }}
              </AppButton>
            </div>
          </div>

          <UserDashboardLayout :error-message="refreshError">
            <template #sidebar>
              <UserDashboardSidebarProfileCard :initials="userInitials" :display-name="authStore.displayName"
                :email="authStore.user?.email" :user-id="authStore.user?.id"
                :birthday="authStore.user?.profile?.birthday ?? undefined" :badges="dashboardBadges" />
              <UserDashboardSidebarNav :items="sidebarLinks" :active-tab-id="activeTabId" @select="activeTabId = $event" />
              <UserDashboardSidebarCompletion :completion="profileCompletion" :items="completionBlocks" />
            </template>

            <section
              v-if="activeTabId === 'overview'"
              id="overview-panel"
              role="tabpanel"
              aria-labelledby="overview-tab"
              class="flex flex-col gap-6"
            >
              <UserDashboardCreatorSection :selected-mode="creatorMode" :actions="creatorActions"
                @select="creatorMode = $event" />

              <section class="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_0.95fr]">
                <UserDashboardSubscriptionsSection :subscriptions="subscriptions.slice(0, 2)" />
                <UserDashboardUsageCard :stats="activityStats" />
              </section>
            </section>

            <section
              v-else-if="activeTabId === 'subscriptions'"
              id="subscriptions-panel"
              role="tabpanel"
              aria-labelledby="subscriptions-tab"
              class="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_0.95fr]"
            >
              <UserDashboardSubscriptionsSection :subscriptions="subscriptions" />
              <UserDashboardUsageCard :stats="activityStats" />
            </section>

            <section
              v-else-if="activeTabId === 'history'"
              id="history-panel"
              role="tabpanel"
              aria-labelledby="history-tab"
            >
              <UserDashboardHistorySection :items="historyItems" />
            </section>

            <section
              v-else
              id="creator-panel"
              role="tabpanel"
              aria-labelledby="creator-tab"
              class="flex flex-col gap-6"
            >
              <UserDashboardCreatorSection :selected-mode="creatorMode" :actions="creatorActions"
                @select="creatorMode = $event" />

              <section class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Création</p>
                    <h2 class="mt-2 text-2xl font-semibold text-slate-950">Passe de lecteur à créateur</h2>
                  </div>
                  <p class="text-sm text-slate-500">
                    Choisissez un mode ci-dessus puis poursuivez votre configuration.
                  </p>
                </div>

                <div class="mt-6 grid gap-4 md:grid-cols-2">
                  <article class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <p class="text-sm font-semibold text-slate-950">Profil public</p>
                    <p class="mt-2 text-sm leading-6 text-slate-600">
                      Mettez en avant votre identité, vos angles éditoriaux et vos publications dans un espace visible.
                    </p>
                  </article>

                  <article class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <p class="text-sm font-semibold text-slate-950">Chaîne créateur</p>
                    <p class="mt-2 text-sm leading-6 text-slate-600">
                      Préparez une présence autonome avec branding, contenus, audience et suivi de performance.
                    </p>
                  </article>
                </div>
              </section>
            </section>
          </UserDashboardLayout>
        </div>
      </section>
  </main>
</template>
