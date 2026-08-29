<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import DashboardShell from '@/components/layout/DashboardShell.vue'
import ChannelSidebar from '@/components/channels/dashboard/ChannelSidebar.vue'
import ChannelTopbar from '@/components/channels/dashboard/ChannelTopbar.vue'
import { useChannelDashboard } from '@/composables/useChannelDashboard'

usePageSeo({ title: 'Dashboard chaîne', robots: 'noindex,nofollow' })

const route = useRoute()
const channelId = computed(() => Number(route.params.id))
const { channel, isLoading, loadError, ensureLoaded } = useChannelDashboard()

onMounted(() => ensureLoaded(channelId.value))
watch(channelId, (id) => ensureLoaded(id))
</script>

<template>
  <DashboardShell>
    <template #sidebar="{ close }">
      <ChannelSidebar @navigate="close" />
    </template>

    <template #topbar>
      <ChannelTopbar />
    </template>

    <div class="mx-auto w-full max-w-[1180px] px-5 pb-16 pt-8 sm:px-8 md:px-10">
      <template v-if="isLoading">
        <div class="h-9 w-64 animate-pulse rounded-2xl bg-slate-200" />
        <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="i in 4" :key="i" class="h-28 animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <div class="mt-6 h-64 animate-pulse rounded-2xl bg-slate-100" />
      </template>

      <p
        v-else-if="loadError"
        class="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700"
      >
        {{ loadError }}
      </p>

      <slot v-else-if="channel" />
    </div>
  </DashboardShell>
</template>
