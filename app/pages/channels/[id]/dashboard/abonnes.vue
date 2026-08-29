<script setup lang="ts">
definePageMeta({ layout: 'channel-dashboard', middleware: ['auth'], ssr: false, title: 'Abonnés de la chaîne', robots: 'noindex,nofollow' })
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppStatCard from '@/components/ui/AppStatCard.vue'
import ChannelDashboardHeader from '@/components/channels/dashboard/ChannelDashboardHeader.vue'
import { getChannelSubscribers, type ChannelSubscriber } from '@/api/channels'
import { useChannelDashboard } from '@/composables/useChannelDashboard'
import { useChannelStats } from '@/composables/useChannelStats'
import { getNameInitials, formatCompactNumber } from '@/lib/format'

const route = useRoute()
const channelId = computed(() => Number(route.params.id))
const { channel } = useChannelDashboard()
const { stats, loading: statsLoading } = useChannelStats(channelId)

const subscribers = ref<ChannelSubscriber[]>([])
const subscribersPage = ref(1)
const subscribersLastPage = ref(1)
const subscribersLoading = ref(true)

async function loadSubscribers(page: number) {
  subscribersLoading.value = true
  try {
    const res = await getChannelSubscribers(channelId.value, page)
    subscribers.value = res.data
    subscribersLastPage.value = res.last_page
    subscribersPage.value = page
  } catch {
    /* silencieux : la liste reste vide */
  } finally {
    subscribersLoading.value = false
  }
}

const subscriberCount = computed(
  () => channel.value?.profile?.subscriber_count ?? stats.value?.subscribers.total ?? 0,
)

onMounted(() => loadSubscribers(1))
</script>

<template>
  <div>
    <ChannelDashboardHeader
      title="Abonnés"
      :subtitle="`${formatCompactNumber(subscriberCount)} personnes suivent ${channel?.profile?.name ?? 'la chaîne'}.`"
    />

    <div class="grid gap-4 sm:grid-cols-3">
      <AppStatCard label="Total" :value="formatCompactNumber(subscriberCount)" />
      <AppStatCard
        label="Nouveaux (7j)"
        :value="statsLoading ? '…' : `+${stats?.subscribers.growth.newCount ?? 0}`"
        :hint="stats ? 'derniers 7 jours' : ''"
        hint-tone="positive"
      />
      <AppStatCard
        label="Croissance (7j)"
        :value="statsLoading ? '…' : `${stats?.subscribers.growth.growthPercent ?? 0} %`"
        :hint-tone="(stats?.subscribers.growth.growthPercent ?? 0) >= 0 ? 'positive' : 'negative'"
      />
    </div>

    <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.05)]">
      <p class="mb-4 text-sm font-bold text-slate-950">Derniers abonnés</p>

      <div v-if="subscribersLoading" class="space-y-3">
        <div v-for="i in 4" :key="i" class="h-14 animate-pulse rounded-xl bg-slate-100" />
      </div>

      <div v-else class="flex flex-col gap-3">
        <div
          v-for="sub in subscribers"
          :key="sub.id"
          class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5"
        >
          <div class="flex min-w-0 items-center gap-3">
            <AppAvatar
              size="sm"
              :src="sub.avatar ?? undefined"
              :initials="getNameInitials(sub.name)"
              background="var(--color-primary)"
            />
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-slate-950">{{ sub.name }}</p>
              <p class="truncate text-xs text-slate-500">{{ sub.email }}</p>
            </div>
          </div>
          <span class="shrink-0 font-mono text-[11px] text-slate-400">
            {{ new Date(sub.subscribed_at).toLocaleDateString('fr-FR') }}
          </span>
        </div>
        <p v-if="!subscribers.length" class="text-sm text-slate-400">Aucun abonné pour l'instant.</p>
      </div>

      <div v-if="subscribersLastPage > 1" class="mt-4 flex items-center justify-between">
        <AppButton
          variant="secondary"
          size="sm"
          :disabled="subscribersPage <= 1"
          @click="loadSubscribers(subscribersPage - 1)"
        >
          Précédent
        </AppButton>
        <span class="text-sm text-slate-500">Page {{ subscribersPage }} / {{ subscribersLastPage }}</span>
        <AppButton
          variant="secondary"
          size="sm"
          :disabled="subscribersPage >= subscribersLastPage"
          @click="loadSubscribers(subscribersPage + 1)"
        >
          Suivant
        </AppButton>
      </div>
    </div>
  </div>
</template>
