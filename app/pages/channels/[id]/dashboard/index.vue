<script setup lang="ts">
definePageMeta({ layout: 'channel-dashboard', middleware: ['auth'], ssr: false, title: 'Dashboard chaîne', robots: 'noindex,nofollow' })
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useChannelDashboard } from '@/composables/useChannelDashboard'
import { useChannelStats } from '@/composables/useChannelStats'
import { useChannelContents } from '@/composables/useChannelContents'
import { formatCompactNumber } from '@/lib/format'

const route = useRoute()
const channelId = computed(() => Number(route.params.id))
const { channel, isLoading, loadError } = useChannelDashboard()

onMounted(() => useChannelDashboard().ensureLoaded(channelId.value))

const { stats, loading: statsLoading } = useChannelStats(channelId)
const { filteredContents, loading: contentsLoading } = useChannelContents(channelId, channel)
const recentContents = computed(() => filteredContents.value.slice(0, 4))

const chartPoints = computed(() => stats.value?.views.series.map((p) => p.views) ?? [])
const chartLabels = computed(() =>
  stats.value?.views.series.map((p) => new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })) ?? [],
)
</script>

<template>
  <div class="mx-auto flex max-w-6xl flex-col gap-7">

    <!-- Skeleton -->
    <template v-if="isLoading">
      <div class="h-10 w-64 animate-pulse rounded-2xl bg-slate-200" />
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="i in 4" :key="i" class="h-28 animate-pulse rounded-[1.5rem] bg-slate-100" />
      </div>
      <div class="h-40 animate-pulse rounded-[2rem] bg-slate-100" />
    </template>

    <!-- Erreur -->
    <p v-else-if="loadError" class="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
      {{ loadError }}
    </p>

    <template v-else-if="channel">
      <!-- Titre -->
      <div class="flex items-center gap-3">
        <h1 class="text-[26px] font-bold text-slate-950">{{ channel.profile.name }}</h1>
        <span class="rounded-full px-2.5 py-1 text-[11.5px] font-bold" :class="'bg-primary/10 text-primary'">Vue d'ensemble</span>
      </div>

      <!-- Stats -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="card-xl p-[18px]">
          <p class="text-[11.5px] text-slate-500">Abonnés</p>
          <p class="mono mt-2 text-[22px] font-semibold text-slate-950">{{ formatCompactNumber(channel.profile.subscriber_count ?? 0) }}</p>
          <p v-if="stats" class="mt-1 text-[11.5px] font-semibold" :class="stats.subscribers.growth.growthPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'">
            {{ stats.subscribers.growth.growthPercent >= 0 ? '▲' : '▼' }} {{ stats.subscribers.growth.newCount }} / 7j
          </p>
        </div>
        <div class="card-xl p-[18px]">
          <p class="text-[11.5px] text-slate-500">Vues (30j)</p>
          <p class="mono mt-2 text-[22px] font-semibold text-slate-950">{{ statsLoading ? '…' : formatCompactNumber(stats?.views.total ?? 0) }}</p>
          <p v-if="stats" class="mt-1 text-[11.5px] font-semibold" :class="stats.views.growthPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'">
            {{ stats.views.growthPercent >= 0 ? '▲' : '▼' }} {{ Math.abs(stats.views.growthPercent) }}%
          </p>
        </div>
        <div class="card-xl p-[18px]">
          <p class="text-[11.5px] text-slate-500">Vues totales</p>
          <p class="mono mt-2 text-[22px] font-semibold text-slate-950">{{ statsLoading ? '…' : formatCompactNumber(stats?.lifetimeViews ?? 0) }}</p>
          <p class="mt-1 text-[11.5px] text-slate-400">depuis la création</p>
        </div>
        <div class="card-xl p-[18px]">
          <p class="text-[11.5px] text-slate-500">Membres actifs</p>
          <p class="mono mt-2 text-[22px] font-semibold text-slate-950">{{ statsLoading ? '…' : (stats?.teamMemberCount ?? 0) }}</p>
          <p class="mt-1 text-[11.5px] text-slate-400">équipe éditoriale</p>
        </div>
      </div>

      <!-- Chart -->
      <div class="card-xl p-6">
        <p class="mb-4 text-sm font-bold text-slate-950">Vues sur 30 jours</p>
        <div v-if="statsLoading" class="h-[120px] animate-pulse rounded-2xl bg-slate-100" />
        <AppSparkline
          v-else-if="chartPoints.length > 1"
          :points="chartPoints"
          :labels="chartLabels"
          :height="120"
          show-axis
        />
        <p v-else class="py-8 text-center text-sm text-slate-400">Pas encore assez de données pour afficher un graphique.</p>
      </div>

      <!-- Contenus récents -->
      <div class="card-xl p-6">
        <div class="mb-4 flex items-baseline justify-between">
          <p class="text-sm font-bold text-slate-950">Contenus récents</p>
          <NuxtLink :to="`/channels/${channelId}/dashboard/contenus`" class="text-[12.5px] font-semibold text-primary hover:text-accent">
            Voir tous les contenus →
          </NuxtLink>
        </div>

        <div v-if="contentsLoading" class="space-y-3">
          <div v-for="i in 4" :key="i" class="h-10 animate-pulse rounded-xl bg-slate-100" />
        </div>

        <div v-else-if="recentContents.length" class="-mx-6 overflow-x-auto px-6">
          <div class="grid min-w-[480px] grid-cols-[2fr_1fr_1fr_1fr] text-[12.5px]">
            <div class="pb-2 font-bold text-slate-500">Titre</div>
            <div class="pb-2 font-bold text-slate-500">Type</div>
            <div class="pb-2 font-bold text-slate-500">Vues</div>
            <div class="pb-2 font-bold text-slate-500">Statut</div>
            <template v-for="rc in recentContents" :key="rc.id">
              <div class="truncate border-t border-slate-100 py-2.5 pr-3">{{ rc.title }}</div>
              <div class="border-t border-slate-100 py-2.5">{{ rc.typeLabel }}</div>
              <div class="mono border-t border-slate-100 py-2.5">{{ formatCompactNumber(rc.viewsCount) }}</div>
              <div class="border-t border-slate-100 py-2.5">
                <span class="font-semibold" :style="{ color: rc.statusColor }">{{ rc.statusLabel }}</span>
              </div>
            </template>
          </div>
        </div>

        <p v-else class="py-8 text-center text-sm text-slate-400">Aucun contenu publié pour l'instant.</p>
      </div>
    </template>

  </div>
</template>
