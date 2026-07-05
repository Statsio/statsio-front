<script setup lang="ts">
definePageMeta({ layout: 'channel-dashboard', middleware: ['auth'], ssr: false, title: 'Abonnés de la chaîne', robots: 'noindex,nofollow' })
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { getChannelSubscribers, type ChannelSubscriber } from '@/api/channels'
import { useChannelDashboard } from '@/composables/useChannelDashboard'

const route = useRoute()
const channelId = computed(() => Number(route.params.id))
const { channel, isLoading, loadError, ensureLoaded } = useChannelDashboard()

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
        <p class="eyebrow text-primary">Audience</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Abonnés <span class="text-slate-400">({{ subscribersTotal }})</span>
        </h1>
        <p class="mt-2 text-slate-500">Les personnes abonnées à votre chaîne.</p>
      </div>

      <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
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
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                {{ sub.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?' }}
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
    </template>

  </div>
</template>
