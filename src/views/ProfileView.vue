<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const activeSection = ref<'overview' | 'settings' | 'subscriptions' | 'billing' | 'notifications'>('overview')

const userInitials = computed(() => {
  const firstName = authStore.user?.profile?.first_name?.[0] ?? ''
  const lastName = authStore.user?.profile?.last_name?.[0] ?? ''
  const initials = `${firstName}${lastName}`.trim()
  return initials || 'ST'
})

const hasChannel = ref(false)

const mockSubscriptions = [
  {
    id: 1,
    name: 'Statsio Premium',
    type: 'paid' as const,
    status: 'active' as const,
    price: '19.99€/mois',
    nextBilling: '2026-06-01',
    features: ['Accès illimité aux analyses', 'Exports avancés', 'Signaux enrichis'],
  },
  {
    id: 2,
    name: 'StatsData Pro',
    type: 'paid' as const,
    status: 'trial' as const,
    price: '29.99€/mois',
    trialEndsAt: '2026-05-15',
    features: ['Comparateurs avancés', 'Exports CSV', 'Exploration illimitée'],
  },
  {
    id: 3,
    name: 'Newsletter Hebdo',
    type: 'free' as const,
    status: 'active' as const,
    features: ['Résumé hebdomadaire', 'Sélection éditoriale'],
  },
]

const mockInvoices = [
  { id: 1, date: '2026-04-01', amount: '19.99€', subscription: 'Statsio Premium', status: 'paid' as const },
  { id: 2, date: '2026-03-01', amount: '19.99€', subscription: 'Statsio Premium', status: 'paid' as const },
  { id: 3, date: '2026-02-01', amount: '19.99€', subscription: 'Statsio Premium', status: 'paid' as const },
]

const notificationChannels = [
  {
    id: 'email',
    name: 'Email',
    enabled: true,
    types: [
      { id: 'new_article', label: 'Nouvel article d\'un abonnement', enabled: true },
      { id: 'subscription_expiring', label: 'Abonnement bientôt expiré', enabled: true },
      { id: 'new_statsdata', label: 'Nouveau StatsData', enabled: false },
      { id: 'poll_results', label: 'Résultats de sondage', enabled: true },
    ],
  },
  {
    id: 'push',
    name: 'Notifications Push Web',
    enabled: true,
    types: [
      { id: 'new_article', label: 'Nouvel article d\'un abonnement', enabled: true },
      { id: 'subscription_expiring', label: 'Abonnement bientôt expiré', enabled: false },
      { id: 'new_statsdata', label: 'Nouveau StatsData', enabled: true },
      { id: 'poll_results', label: 'Résultats de sondage', enabled: false },
    ],
  },
]

const sidebarItems = [
  { id: 'overview' as const, label: 'Vue générale', icon: 'home' },
  { id: 'settings' as const, label: 'Paramètres', icon: 'settings' },
  { id: 'subscriptions' as const, label: 'Abonnements', icon: 'subscriptions' },
  { id: 'billing' as const, label: 'Facturation', icon: 'billing' },
  { id: 'notifications' as const, label: 'Notifications', icon: 'notifications' },
]

const handleDeleteAccount = () => {
  if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
    alert('Fonctionnalité de suppression de compte à implémenter')
  }
}

const handleUpdateProfile = () => {
  alert('Fonctionnalité de mise à jour du profil à implémenter')
}

const handleCancelSubscription = (subscriptionId: number) => {
  if (confirm('Voulez-vous vraiment annuler cet abonnement ?')) {
    alert(`Annulation de l'abonnement ${subscriptionId} à implémenter`)
  }
}

const handleDownloadInvoice = (invoiceId: number) => {
  alert(`Téléchargement de la facture ${invoiceId} à implémenter`)
}

const handleCreateChannel = () => {
  router.push('/channels/create')
}
</script>

<template>
  <main class="pb-24 pt-32">
    <section class="section pb-10">
      <div class="container flex flex-col gap-8">
        <div class="flex flex-col gap-4">
          <p class="eyebrow text-primary">Mon compte</p>
          <div class="max-w-4xl">
            <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              Profil
            </h1>
            <p class="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Gérez vos informations personnelles, vos abonnements et vos préférences de notification.
            </p>
          </div>
        </div>

        <div class="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside class="flex flex-col gap-4">
            <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
              <div class="flex flex-col items-center gap-4">
                <AppAvatar :initials="userInitials" size="lg" />
                <div class="text-center">
                  <p class="text-lg font-semibold text-slate-950">{{ authStore.displayName }}</p>
                  <p class="text-sm text-slate-500">{{ authStore.user?.email }}</p>
                </div>
              </div>
            </div>

            <nav class="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
              <button
                v-for="item in sidebarItems"
                :key="item.id"
                type="button"
                class="w-full rounded-[1.25rem] px-4 py-3 text-left text-sm font-semibold transition"
                :class="activeSection === item.id
                  ? 'bg-primary text-white'
                  : 'text-slate-700 hover:bg-slate-50'"
                @click="activeSection = item.id"
              >
                {{ item.label }}
              </button>
            </nav>
          </aside>

          <div class="flex flex-col gap-6">
            <section v-if="activeSection === 'overview'" class="flex flex-col gap-6">
              <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                <div class="flex items-start justify-between">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Informations</p>
                    <h2 class="mt-2 text-2xl font-semibold text-slate-950">Vos informations personnelles</h2>
                  </div>
                </div>

                <div class="mt-6 grid gap-4 sm:grid-cols-2">
                  <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Prénom</p>
                    <p class="mt-2 text-base font-semibold text-slate-950">
                      {{ authStore.user?.profile?.first_name || '—' }}
                    </p>
                  </div>
                  <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nom</p>
                    <p class="mt-2 text-base font-semibold text-slate-950">
                      {{ authStore.user?.profile?.last_name || '—' }}
                    </p>
                  </div>
                  <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 sm:col-span-2">
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Email</p>
                    <p class="mt-2 text-base font-semibold text-slate-950">{{ authStore.user?.email }}</p>
                  </div>
                </div>
              </div>

              <div v-if="!hasChannel" class="rounded-[2rem] border border-dashed border-primary/30 bg-primary/5 p-8 text-center shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                <div class="mx-auto max-w-md">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Créateur</p>
                  <h3 class="mt-3 text-2xl font-semibold text-slate-950">Créez votre chaîne</h3>
                  <p class="mt-3 text-sm leading-7 text-slate-600">
                    Lancez votre présence éditoriale avec une chaîne personnalisée. Publiez vos contenus, développez votre audience et suivez vos performances.
                  </p>
                  <AppButton variant="primary" size="md" class="mt-6" @click="handleCreateChannel">
                    Créer ma chaîne
                  </AppButton>
                </div>
              </div>

              <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Abonnements actifs</p>
                <h2 class="mt-2 text-2xl font-semibold text-slate-950">Vos abonnements</h2>

                <div class="mt-6 grid gap-4">
                  <article
                    v-for="sub in mockSubscriptions.slice(0, 3)"
                    :key="sub.id"
                    class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <div class="flex items-center gap-2">
                          <p class="text-base font-semibold text-slate-950">{{ sub.name }}</p>
                          <span
                            v-if="sub.type === 'paid'"
                            class="inline-flex rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent"
                          >
                            Payant
                          </span>
                          <span
                            v-else
                            class="inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600"
                          >
                            Gratuit
                          </span>
                        </div>
                        <p v-if="sub.type === 'paid'" class="mt-1 text-sm text-slate-600">{{ sub.price }}</p>
                      </div>
                      <span
                        class="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                        :class="sub.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'"
                      >
                        {{ sub.status === 'active' ? 'Actif' : 'Essai' }}
                      </span>
                    </div>
                  </article>
                </div>

                <div class="mt-4">
                  <AppButton variant="secondary" size="md" @click="activeSection = 'subscriptions'">
                    Voir tous les abonnements
                  </AppButton>
                </div>
              </div>
            </section>

            <section v-else-if="activeSection === 'settings'" class="flex flex-col gap-6">
              <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Paramètres</p>
                <h2 class="mt-2 text-2xl font-semibold text-slate-950">Mettre à jour mes informations</h2>

                <form class="mt-6 flex flex-col gap-4" @submit.prevent="handleUpdateProfile">
                  <label class="flex flex-col gap-2">
                    <span class="text-sm font-semibold text-slate-700">Prénom</span>
                    <input
                      type="text"
                      :value="authStore.user?.profile?.first_name"
                      class="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Votre prénom"
                    />
                  </label>

                  <label class="flex flex-col gap-2">
                    <span class="text-sm font-semibold text-slate-700">Nom</span>
                    <input
                      type="text"
                      :value="authStore.user?.profile?.last_name"
                      class="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Votre nom"
                    />
                  </label>

                  <label class="flex flex-col gap-2">
                    <span class="text-sm font-semibold text-slate-700">Email</span>
                    <input
                      type="email"
                      :value="authStore.user?.email"
                      class="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="votre@email.com"
                    />
                  </label>

                  <div class="mt-2">
                    <AppButton type="submit" variant="primary" size="md">
                      Enregistrer les modifications
                    </AppButton>
                  </div>
                </form>
              </div>

              <div class="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">Zone dangereuse</p>
                <h2 class="mt-2 text-2xl font-semibold text-slate-950">Supprimer mon compte</h2>
                <p class="mt-3 text-sm leading-7 text-slate-600">
                  Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                </p>
                <div class="mt-4">
                  <AppButton variant="danger" size="md" @click="handleDeleteAccount">
                    Supprimer mon compte
                  </AppButton>
                </div>
              </div>
            </section>

            <section v-else-if="activeSection === 'subscriptions'" class="flex flex-col gap-6">
              <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Abonnements</p>
                <h2 class="mt-2 text-2xl font-semibold text-slate-950">Gérer mes abonnements</h2>

                <div class="mt-6 flex flex-col gap-4">
                  <article
                    v-for="sub in mockSubscriptions"
                    :key="sub.id"
                    class="rounded-[1.5rem] border border-slate-200 bg-white p-6"
                  >
                    <div class="flex flex-col gap-4">
                      <div class="flex items-start justify-between">
                        <div>
                          <div class="flex items-center gap-2">
                            <h3 class="text-lg font-semibold text-slate-950">{{ sub.name }}</h3>
                            <span
                              v-if="sub.type === 'paid'"
                              class="inline-flex rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent"
                            >
                              Payant
                            </span>
                            <span
                              v-else
                              class="inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600"
                            >
                              Gratuit
                            </span>
                          </div>
                          <p v-if="sub.type === 'paid'" class="mt-1 text-sm font-semibold text-slate-600">
                            {{ sub.price }}
                          </p>
                        </div>
                        <span
                          class="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                          :class="sub.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'"
                        >
                          {{ sub.status === 'active' ? 'Actif' : 'Essai' }}
                        </span>
                      </div>

                      <ul class="flex flex-col gap-2">
                        <li v-for="feature in sub.features" :key="feature" class="flex items-center gap-2 text-sm text-slate-600">
                          <svg class="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                          {{ feature }}
                        </li>
                      </ul>

                      <div v-if="sub.type === 'paid'" class="flex items-center gap-3 rounded-[1.25rem] bg-slate-50 p-4">
                        <p class="text-sm text-slate-600">
                          <span v-if="sub.status === 'active'">Prochain paiement le {{ sub.nextBilling }}</span>
                          <span v-else>Essai jusqu'au {{ sub.trialEndsAt }}</span>
                        </p>
                        <AppButton variant="outline" size="sm" @click="handleCancelSubscription(sub.id)">
                          Annuler
                        </AppButton>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </section>

            <section v-else-if="activeSection === 'billing'" class="flex flex-col gap-6">
              <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Facturation</p>
                <h2 class="mt-2 text-2xl font-semibold text-slate-950">Historique de facturation</h2>

                <div class="mt-6 overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-slate-200">
                        <th class="pb-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Date</th>
                        <th class="pb-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Abonnement</th>
                        <th class="pb-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Montant</th>
                        <th class="pb-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Statut</th>
                        <th class="pb-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="invoice in mockInvoices" :key="invoice.id" class="border-b border-slate-100">
                        <td class="py-4 text-sm text-slate-900">{{ invoice.date }}</td>
                        <td class="py-4 text-sm text-slate-900">{{ invoice.subscription }}</td>
                        <td class="py-4 text-sm font-semibold text-slate-900">{{ invoice.amount }}</td>
                        <td class="py-4">
                          <span class="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                            Payé
                          </span>
                        </td>
                        <td class="py-4 text-right">
                          <button
                            type="button"
                            class="text-sm font-semibold text-primary hover:text-primary/80"
                            @click="handleDownloadInvoice(invoice.id)"
                          >
                            Télécharger
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section v-else-if="activeSection === 'notifications'" class="flex flex-col gap-6">
              <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Notifications</p>
                <h2 class="mt-2 text-2xl font-semibold text-slate-950">Gérer mes notifications</h2>
                <p class="mt-2 text-sm text-slate-600">
                  Choisissez comment vous souhaitez être notifié des nouveaux contenus et événements.
                </p>

                <div class="mt-6 flex flex-col gap-6">
                  <div
                    v-for="channel in notificationChannels"
                    :key="channel.id"
                    class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6"
                  >
                    <div class="flex items-center justify-between">
                      <h3 class="text-lg font-semibold text-slate-950">{{ channel.name }}</h3>
                      <label class="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" :checked="channel.enabled" class="peer sr-only" />
                        <div class="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20"></div>
                      </label>
                    </div>

                    <div class="mt-4 flex flex-col gap-3">
                      <div
                        v-for="type in channel.types"
                        :key="type.id"
                        class="flex items-center justify-between rounded-[1.25rem] bg-white p-4"
                      >
                        <span class="text-sm text-slate-700">{{ type.label }}</span>
                        <label class="relative inline-flex cursor-pointer items-center">
                          <input type="checkbox" :checked="type.enabled" class="peer sr-only" />
                          <div class="peer h-5 w-9 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
