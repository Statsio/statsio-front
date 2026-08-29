<script setup lang="ts">
definePageMeta({ layout: 'channel-dashboard', middleware: ['auth'], ssr: false, title: 'Dashboard chaîne', robots: 'noindex,nofollow' })
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppStatCard from '@/components/ui/AppStatCard.vue'
import AppSparkline from '@/components/ui/AppSparkline.vue'
import ChannelDashboardHeader from '@/components/channels/dashboard/ChannelDashboardHeader.vue'
import ChannelViewsBreakdownCard from '@/components/channels/dashboard/ChannelViewsBreakdownCard.vue'
import { useChannelDashboard } from '@/composables/useChannelDashboard'
import { useChannelStats } from '@/composables/useChannelStats'
import { useChannelContents } from '@/composables/useChannelContents'
import { formatCompactNumber } from '@/lib/format'

const route = useRoute()
const channelId = computed(() => Number(route.params.id))
const { channel } = useChannelDashboard()
const { stats, loading: statsLoading } = useChannelStats(channelId)
const { displayContents, loading: contentsLoading } = useChannelContents(channelId, channel)

const basePath = computed(() => `/channels/${channelId.value}/dashboard`)
const recentContents = computed(() => displayContents.value.slice(0, 5))

const subscriberCount = computed(
  () => channel.value?.profile?.subscriber_count ?? stats.value?.subscribers.total ?? 0,
)

const kpis = computed(() => {
  const subGrowth = stats.value?.subscribers.growth.growthPercent ?? 0
  const viewsGrowth = stats.value?.views.growthPercent ?? 0
  return [
    {
      label: 'Abonnés',
      value: formatCompactNumber(subscriberCount.value),
      hint: stats.value ? `▲ ${stats.value.subscribers.growth.newCount} / 7j` : '',
      hintTone: subGrowth >= 0 ? ('positive' as const) : ('negative' as const),
    },
    {
      label: 'Vues (30j)',
      value: statsLoading.value ? '…' : formatCompactNumber(stats.value?.views.total ?? 0),
      hint: stats.value ? `${viewsGrowth >= 0 ? '▲' : '▼'} ${Math.abs(viewsGrowth)} %` : '',
      hintTone: viewsGrowth >= 0 ? ('positive' as const) : ('negative' as const),
    },
    { label: 'Revenus (mois)', value: '—', hint: 'Bientôt', hintTone: 'muted' as const },
    { label: 'Engagement', value: '—', hint: 'Bientôt', hintTone: 'muted' as const },
  ]
})

const chartPoints = computed(() => stats.value?.views.series.map((p) => p.views) ?? [])
const chartLabels = computed(
  () =>
    stats.value?.views.series.map((p) =>
      new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    ) ?? [],
)
</script>

<template>
  <div>
    <ChannelDashboardHeader
      :title="channel?.profile?.name ?? 'Vue d\'ensemble'"
      subtitle="Audience, vues et contenus de la chaîne sur les 30 derniers jours."
    />

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AppStatCard
        v-for="k in kpis"
        :key="k.label"
        :label="k.label"
        :value="k.value"
        :hint="k.hint"
        :hint-tone="k.hintTone"
      />
    </div>

    <div class="mt-6 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.05)]">
        <div class="mb-4 flex items-baseline justify-between gap-3">
          <p class="text-sm font-bold text-slate-950">Vues sur 30 jours</p>
          <span v-if="stats" class="font-mono text-[11px] text-slate-400">
            {{ formatCompactNumber(stats.views.total) }} au total
          </span>
        </div>
        <div v-if="statsLoading" class="h-[150px] animate-pulse rounded-2xl bg-slate-100" />
        <AppSparkline
          v-else-if="chartPoints.length > 1"
          :points="chartPoints"
          :labels="chartLabels"
          :height="150"
          show-axis
        />
        <p v-else class="py-10 text-center text-sm text-slate-400">
          Pas encore assez de données pour afficher un graphique.
        </p>
      </div>

      <ChannelViewsBreakdownCard />
    </div>

    <div class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(20,20,30,0.05)]">
      <div class="flex items-baseline justify-between gap-3 px-6 pb-3.5 pt-5">
        <p class="text-sm font-bold text-slate-950">Contenus récents</p>
        <NuxtLink :to="`${basePath}/contenus`" class="text-[12.5px] font-bold text-primary hover:text-accent">
          Tous les contenus →
        </NuxtLink>
      </div>

      <div v-if="contentsLoading" class="space-y-2 px-6 pb-6">
        <div v-for="i in 4" :key="i" class="h-11 animate-pulse rounded-xl bg-slate-100" />
      </div>

      <div v-else-if="recentContents.length" class="overflow-x-auto">
        <table class="w-full min-w-[560px] text-[12.5px]">
          <thead>
            <tr class="border-t border-slate-100 bg-slate-50/60 text-left text-[10.5px] font-bold uppercase tracking-[0.06em] text-slate-400">
              <th class="px-6 py-2.5 font-bold">Titre</th>
              <th class="px-3 py-2.5 font-bold">Type</th>
              <th class="px-3 py-2.5 font-bold">Vues</th>
              <th class="px-6 py-2.5 font-bold">Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rc in recentContents" :key="rc.id" class="border-t border-slate-100">
              <td class="max-w-[280px] truncate px-6 py-3 font-semibold text-slate-950">
                <NuxtLink :to="rc.studioPath" class="hover:text-primary">{{ rc.title }}</NuxtLink>
              </td>
              <td class="px-3 py-3">
                <span
                  class="rounded-full px-2.5 py-1 text-[11px] font-bold"
                  :style="{ color: rc.typeColor, background: rc.typeBg }"
                >
                  {{ rc.typeLabel }}
                </span>
              </td>
              <td class="px-3 py-3 font-mono text-slate-500">{{ formatCompactNumber(rc.viewsCount) }}</td>
              <td class="px-6 py-3">
                <span class="font-bold" :style="{ color: rc.statusColor }">{{ rc.statusLabel }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else class="px-6 pb-6 text-sm text-slate-400">Aucun contenu publié pour l'instant.</p>
    </div>
  </div>
</template>
