<script setup lang="ts">
definePageMeta({ layout: 'channel-dashboard', middleware: ['auth'], ssr: false, title: 'Abonnés de la chaîne', robots: 'noindex,nofollow' })
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import { getChannelSubscribers, type ChannelSubscriber } from '@/api/channels'
import { useChannelDashboard } from '@/composables/useChannelDashboard'
import { useChannelStats } from '@/composables/useChannelStats'
import { getNameInitials, formatCompactNumber } from '@/lib/format'

const route = useRoute()
const channelId = computed(() => Number(route.params.id))
const { channel, isLoading, loadError, ensureLoaded } = useChannelDashboard()
const { stats, loading: statsLoading } = useChannelStats(channelId)

const subscribers = ref<ChannelSubscriber[]>([])
const subscribersTotal = ref(0)
const subscribersPage = ref(1)
const subscribersLastPage = ref(1)
const subscribersLoading = ref(true)

const loadSubscribers = async (page: number) => {
  subscribersLoading.value = true
  try {
    const res = await getChannelSubscribers(channelId.value, page)
    subscribers.value = res.data
    subscribersTotal.value = res.total
    subscribersLastPage.value = res.last_page
    subscribersPage.value = page
  } catch {}
  finally { subscribersLoading.value = false }
}

onMounted(async () => {
  await ensureLoaded(channelId.value)
  await loadSubscribers(1)
})
</script>

<template>
  <div class="mx-auto flex max-w-4xl flex-col gap-6">

    <template v-if="isLoading">
      <div class="h-10 w-64 animate-pulse rounded-2xl bg-slate-200" />
      <div class="h-72 animate-pulse rounded-[2rem] bg-slate-100" />
    </template>

    <p v-else-if="loadError" class="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
      {{ loadError }}
    </p>

    <template v-else-if="channel">
      <div>
        <h1 class="text-[26px] font-bold text-slate-950">Abonnés</h1>
        <p class="mt-1.5 text-[14.5px] text-slate-500">
          {{ formatCompactNumber(channel.profile.subscriber_count ?? 0) }} personnes suivent {{ channel.profile.name }}.
        </p>
      </div>

      <!-- Stats -->
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="card-xl p-[18px]">
          <p class="text-[11.5px] text-slate-500">Total</p>
          <p class="mono mt-2 text-[22px] font-semibold text-slate-950">{{ formatCompactNumber(channel.profile.subscriber_count ?? 0) }}</p>
        </div>
        <div class="card-xl p-[18px]">
          <p class="text-[11.5px] text-slate-500">Nouveaux (7j)</p>
          <p class="mono mt-2 text-[22px] font-semibold text-emerald-600">{{ statsLoading ? '…' : `+${stats?.subscribers.growth.newCount ?? 0}` }}</p>
        </div>
        <div class="card-xl p-[18px]">
          <p class="text-[11.5px] text-slate-500">Croissance (7j)</p>
          <p class="mono mt-2 text-[22px] font-semibold text-slate-950">{{ statsLoading ? '…' : `${stats?.subscribers.growth.growthPercent ?? 0}%` }}</p>
        </div>
      </div>

      <!-- Liste -->
      <div class="card-xl p-6">
        <p class="mb-4 text-sm font-bold text-slate-950">Tous les abonnés</p>
        <div v-if="subscribersLoading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="h-14 animate-pulse rounded-[1.5rem] bg-slate-100" />
        </div>
        <div v-else class="flex flex-col gap-3">
          <div
            v-for="sub in subscribers"
            :key="sub.id"
            class="flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
          >
            <div class="flex items-center gap-3">
              <AppAvatar size="sm" :src="sub.avatar ?? undefined" :initials="getNameInitials(sub.name)" background="var(--color-primary)" />
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
    </template>

  </div>
</template>
