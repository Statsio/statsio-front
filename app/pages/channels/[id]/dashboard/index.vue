<script setup lang="ts">
definePageMeta({ layout: 'channel-dashboard', middleware: ['auth'], ssr: false, title: 'Dashboard chaîne', robots: 'noindex,nofollow' })
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useChannelDashboard } from '@/composables/useChannelDashboard'

const route = useRoute()
const channelId = computed(() => Number(route.params.id))
const { channel, isLoading, loadError, getCategoryLabel } = useChannelDashboard()

onMounted(() => useChannelDashboard().ensureLoaded(channelId.value))

const formatCount = (n: number | undefined) => {
  if (n === undefined || n === null) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

const statusLabel: Record<string, { label: string; classes: string }> = {
  active:     { label: 'Active',     classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  suspended:  { label: 'Suspendue',  classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  banned:     { label: 'Bannie',     classes: 'bg-rose-50 text-rose-700 border-rose-200' },
  anonymized: { label: 'Anonymisée', classes: 'bg-slate-100 text-slate-500 border-slate-200' },
}
const getStatus = (s: string) => statusLabel[s] ?? { label: s, classes: 'bg-slate-100 text-slate-500 border-slate-200' }
</script>

<template>
  <div class="mx-auto flex max-w-4xl flex-col gap-6">

    <!-- Skeleton -->
    <template v-if="isLoading">
      <div class="h-10 w-64 animate-pulse rounded-2xl bg-slate-200" />
      <div class="grid gap-4 sm:grid-cols-3">
        <div v-for="i in 3" :key="i" class="h-28 animate-pulse rounded-[1.5rem] bg-slate-100" />
      </div>
      <div class="h-40 animate-pulse rounded-[2rem] bg-slate-100" />
    </template>

    <!-- Erreur -->
    <p v-else-if="loadError" class="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
      {{ loadError }}
    </p>

    <template v-else-if="channel">
      <!-- Titre -->
      <div>
        <p class="eyebrow text-primary">Vue d'ensemble</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Bonjour, voici votre chaîne
        </h1>
        <p class="mt-2 text-slate-500">Suivez les performances de {{ channel.profile.name }} en un coup d'œil.</p>
      </div>

      <!-- Stats -->
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Abonnés</p>
          <p class="mt-2 text-3xl font-bold text-slate-950">{{ formatCount(channel.profile.subscriber_count) }}</p>
        </div>
        <div class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Vues totales</p>
          <p class="mt-2 text-3xl font-bold text-slate-950">{{ formatCount(channel.profile.view_count) }}</p>
        </div>
        <div class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Statut</p>
          <p class="mt-3">
            <span class="rounded-full border px-3 py-1 text-sm font-semibold" :class="getStatus(channel.status).classes">
              {{ getStatus(channel.status).label }}
            </span>
          </p>
        </div>
      </div>

      <!-- Ligne éditoriale -->
      <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Catégories</p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-950">Ligne éditoriale</h2>
        <div class="mt-4 flex flex-wrap gap-2">
          <span
            v-for="cat in channel.profile.categories"
            :key="cat"
            class="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary"
          >
            {{ getCategoryLabel(cat) }}
          </span>
          <span v-if="!channel.profile.categories?.length" class="text-sm text-slate-400">Aucune catégorie définie</span>
        </div>
        <p v-if="channel.profile.description" class="mt-4 text-sm leading-7 text-slate-600">
          {{ channel.profile.description }}
        </p>
      </div>

      <!-- Raccourcis -->
      <div class="grid gap-4 sm:grid-cols-2">
        <NuxtLink
          :to="`/channels/${channelId}/dashboard/profil`"
          class="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-primary/30"
        >
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
            </svg>
          </div>
          <h3 class="mt-4 text-base font-semibold text-slate-950 transition group-hover:text-primary">Compléter mon profil</h3>
          <p class="mt-1 text-sm text-slate-500">Nom, description, catégories, logo et bannière.</p>
        </NuxtLink>
        <NuxtLink
          :to="`/channels/${channelId}/dashboard/membres`"
          class="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-primary/30"
        >
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </div>
          <h3 class="mt-4 text-base font-semibold text-slate-950 transition group-hover:text-primary">Gérer mon équipe</h3>
          <p class="mt-1 text-sm text-slate-500">Membres, rôles et permissions de la chaîne.</p>
        </NuxtLink>
      </div>
    </template>

  </div>
</template>
