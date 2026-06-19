<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import { getMyChannels, channelCategoryLabels, type Channel } from '@/api/channels'

const router = useRouter()

const channels = ref<Channel[]>([])
const isLoading = ref(true)
const loadError = ref('')

const hasChannels = computed(() => channels.value.length > 0)

const fetchChannels = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    channels.value = await getMyChannels()
  } catch (e) {
    loadError.value = 'Impossible de charger vos chaînes. Veuillez réessayer.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchChannels)

const handleCreateChannel = () => {
  router.push('/channels/create')
}

const getChannelInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

const statusLabel: Record<string, { label: string; classes: string }> = {
  active: { label: 'Active', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  suspended: { label: 'Suspendue', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  banned: { label: 'Bannie', classes: 'bg-rose-50 text-rose-700 border-rose-200' },
  anonymized: { label: 'Anonymisée', classes: 'bg-slate-100 text-slate-500 border-slate-200' },
}

const getStatus = (status: string) =>
  statusLabel[status] ?? { label: status, classes: 'bg-slate-100 text-slate-500 border-slate-200' }
</script>

<template>
  <main class="pb-24 pt-32">

    <!-- ─── SKELETON ─── -->
    <section v-if="isLoading" class="section">
      <div class="container">
        <div class="mx-auto max-w-5xl space-y-8">
          <!-- header skeleton -->
          <div class="space-y-3">
            <div class="h-3 w-20 animate-pulse rounded-full bg-slate-200" />
            <div class="h-10 w-64 animate-pulse rounded-2xl bg-slate-200" />
            <div class="h-5 w-96 animate-pulse rounded-xl bg-slate-100" />
          </div>
          <!-- cards skeleton -->
          <div class="grid gap-6 lg:grid-cols-2">
            <div
              v-for="i in 2"
              :key="i"
              class="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.15)]"
            >
              <div class="flex gap-4">
                <div class="h-16 w-16 shrink-0 animate-pulse rounded-2xl bg-slate-200" />
                <div class="flex-1 space-y-3 pt-1">
                  <div class="h-5 w-40 animate-pulse rounded-lg bg-slate-200" />
                  <div class="h-3 w-56 animate-pulse rounded-lg bg-slate-100" />
                  <div class="flex gap-4">
                    <div class="h-3 w-16 animate-pulse rounded-lg bg-slate-100" />
                    <div class="h-3 w-16 animate-pulse rounded-lg bg-slate-100" />
                    <div class="h-3 w-16 animate-pulse rounded-lg bg-slate-100" />
                  </div>
                </div>
              </div>
              <div class="mt-6 flex gap-3">
                <div class="h-8 w-20 animate-pulse rounded-full bg-slate-200" />
                <div class="h-8 w-28 animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── ERREUR ─── -->
    <section v-else-if="loadError" class="section">
      <div class="container">
        <div class="mx-auto max-w-lg text-center">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
            <svg class="h-8 w-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 class="mt-4 text-xl font-semibold text-slate-950">Erreur de chargement</h2>
          <p class="mt-2 text-sm text-slate-600">{{ loadError }}</p>
          <AppButton variant="primary" size="md" class="mt-6" @click="fetchChannels">
            Réessayer
          </AppButton>
        </div>
      </div>
    </section>

    <!-- ─── ÉTAT VIDE : pas encore de chaîne ─── -->
    <section v-else-if="!hasChannels" class="section">
      <div class="container">
        <div class="mx-auto max-w-5xl">
          <div class="rounded-[3rem] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 shadow-[0_32px_100px_-60px_rgba(15,23,42,0.45)] sm:p-12 lg:p-16">
            <div class="text-center">
              <p class="eyebrow text-primary">Créateur</p>
              <h1 class="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                Lancez votre chaîne
              </h1>
              <p class="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Créez votre présence éditoriale avec une chaîne personnalisée. Publiez vos contenus, développez votre audience et suivez vos performances en temps réel.
              </p>
            </div>

            <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]">
                <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <svg class="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 class="mt-4 text-lg font-semibold text-slate-950">Publiez vos contenus</h3>
                <p class="mt-2 text-sm leading-6 text-slate-600">
                  Créez et partagez des articles et sondages sous votre propre marque éditoriale.
                </p>
              </article>

              <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]">
                <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
                  <svg class="h-6 w-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 class="mt-4 text-lg font-semibold text-slate-950">Développez votre audience</h3>
                <p class="mt-2 text-sm leading-6 text-slate-600">
                  Attirez des abonnés, fidélisez votre communauté et construisez votre réputation.
                </p>
              </article>

              <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]">
                <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/70">
                  <svg class="h-6 w-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 class="mt-4 text-lg font-semibold text-slate-950">Suivez vos performances</h3>
                <p class="mt-2 text-sm leading-6 text-slate-600">
                  Analysez vos statistiques, mesurez l'engagement et optimisez votre stratégie éditoriale.
                </p>
              </article>
            </div>

            <div class="mt-12 rounded-[2rem] border border-primary/20 bg-primary/5 p-8">
              <div class="flex flex-col items-center gap-6 lg:flex-row lg:justify-between">
                <div class="text-center lg:text-left">
                  <h2 class="text-2xl font-semibold text-slate-950">Prêt à commencer ?</h2>
                  <p class="mt-2 text-sm leading-6 text-slate-600">
                    Créez votre chaîne en quelques minutes et commencez à publier dès aujourd'hui.
                  </p>
                </div>
                <AppButton variant="primary" size="lg" @click="handleCreateChannel">
                  Créer ma chaîne
                  <template #icon>→</template>
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── ÉTAT AVEC CHAÎNES ─── -->
    <section v-else class="section">
      <div class="container flex flex-col gap-10">

        <!-- En-tête -->
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="eyebrow text-primary">Créateur</p>
            <h1 class="mt-2 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Mes chaînes
            </h1>
            <p class="mt-3 text-lg leading-8 text-slate-600">
              {{ channels.length }} chaîne{{ channels.length > 1 ? 's' : '' }} · gérez vos contenus et suivez vos performances.
            </p>
          </div>
          <AppButton variant="primary" size="md" @click="handleCreateChannel">
            <template #icon>
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </template>
            Nouvelle chaîne
          </AppButton>
        </div>

        <!-- Grille de chaînes -->
        <div class="grid gap-6 lg:grid-cols-2">
          <article
            v-for="channel in channels"
            :key="channel.id"
            class="group relative rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_-42px_rgba(15,23,42,0.25)] transition-all duration-300 hover:shadow-[0_32px_80px_-40px_rgba(15,23,42,0.35)] hover:-translate-y-0.5"
          >
            <!-- Bannière -->
            <div
              class="relative h-32 w-full overflow-hidden rounded-t-[2rem]"
              :style="channel.profile.custom_color_primary
                ? `background: linear-gradient(135deg, ${channel.profile.custom_color_primary}22, ${channel.profile.custom_color_secondary ?? channel.profile.custom_color_primary}44)`
                : 'background: linear-gradient(135deg, #f1f5f9, #e2e8f0)'"
            >
              <img
                v-if="channel.profile.banner_url"
                :src="channel.profile.banner_url"
                :alt="`Bannière ${channel.profile.name}`"
                class="h-full w-full object-cover"
              />
              <!-- Badge statut -->
              <span
                class="absolute right-4 top-4 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                :class="getStatus(channel.status).classes"
              >
                {{ getStatus(channel.status).label }}
              </span>
            </div>

            <!-- Corps -->
            <div class="p-6">
              <div class="flex items-start gap-4">
                <!-- Logo / Avatar -->
                <div class="-mt-10 shrink-0 overflow-hidden ring-4 ring-white rounded-2xl">
                  <img
                    v-if="channel.profile.logo_url"
                    :src="channel.profile.logo_url"
                    :alt="channel.profile.name"
                    class="h-16 w-16 rounded-2xl object-cover"
                  />
                  <div
                    v-else
                    class="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-[0_8px_24px_-8px_rgba(15,23,42,0.4)]"
                    :style="channel.profile.custom_color_primary
                      ? `background-color: ${channel.profile.custom_color_primary}`
                      : 'background: var(--color-primary)'"
                  >
                    {{ getChannelInitials(channel.profile.name) }}
                  </div>
                </div>

                <div class="min-w-0 flex-1 pt-1">
                  <div class="flex items-center gap-2">
                    <h2 class="truncate text-xl font-semibold text-slate-950">{{ channel.profile.name }}</h2>
                  </div>
                  <p class="mt-0.5 text-sm text-slate-500">@{{ channel.profile.handle }}</p>
                </div>
              </div>

              <!-- Description -->
              <p
                v-if="channel.profile.description"
                class="mt-4 line-clamp-2 text-sm leading-6 text-slate-600"
              >
                {{ channel.profile.description }}
              </p>

              <!-- Catégories -->
              <div v-if="channel.profile.categories?.length" class="mt-3 flex flex-wrap gap-1.5">
                <span
                  v-for="cat in channel.profile.categories.slice(0, 3)"
                  :key="cat"
                  class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                >
                  {{ channelCategoryLabels[cat] ?? cat }}
                </span>
                <span
                  v-if="channel.profile.categories.length > 3"
                  class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-400"
                >
                  +{{ channel.profile.categories.length - 3 }}
                </span>
              </div>

              <!-- Stats -->
              <div class="mt-5 grid grid-cols-3 divide-x divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50">
                <div class="flex flex-col items-center py-3">
                  <span class="text-lg font-bold text-slate-950">{{ formatCount(channel.profile.subscriber_count) }}</span>
                  <span class="mt-0.5 text-xs text-slate-500">abonnés</span>
                </div>
                <div class="flex flex-col items-center py-3">
                  <span class="text-lg font-bold text-slate-950">{{ formatCount(channel.profile.view_count) }}</span>
                  <span class="mt-0.5 text-xs text-slate-500">vues</span>
                </div>
                <div class="flex flex-col items-center py-3">
                  <span class="text-lg font-bold text-slate-950">
                    <span v-if="channel.profile.is_featured" class="text-amber-500">★</span>
                    <span v-else class="text-slate-300">★</span>
                  </span>
                  <span class="mt-0.5 text-xs text-slate-500">{{ channel.profile.is_featured ? 'En vedette' : 'Standard' }}</span>
                </div>
              </div>

              <!-- Actions -->
              <div class="mt-5 flex gap-3">
                <AppButton
                  variant="primary"
                  size="sm"
                  as="router-link"
                  :to="`/channels/${channel.id}/manage`"
                >
                  Gérer
                </AppButton>
                <AppButton
                  variant="outline"
                  size="sm"
                  as="router-link"
                  :to="`/channels/@${channel.profile.handle}`"
                >
                  Voir la chaîne
                </AppButton>
              </div>
            </div>
          </article>
        </div>

        <!-- CTA créer une nouvelle chaîne -->
        <div class="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center transition hover:border-primary/40 hover:bg-primary/5">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-[0_8px_24px_-8px_rgba(15,23,42,0.15)]">
            <svg class="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 class="mt-4 text-base font-semibold text-slate-950">Créer une nouvelle chaîne</h3>
          <p class="mt-1 text-sm text-slate-500">Lancez une seconde présence éditoriale sur un nouveau sujet.</p>
          <AppButton variant="secondary" size="sm" class="mt-4" @click="handleCreateChannel">
            Commencer
          </AppButton>
        </div>

      </div>
    </section>

  </main>
</template>
