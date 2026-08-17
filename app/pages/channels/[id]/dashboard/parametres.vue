<script setup lang="ts">
definePageMeta({ layout: 'channel-dashboard', middleware: ['auth'], ssr: false, title: 'Paramètres de la chaîne', robots: 'noindex,nofollow' })
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import ChannelProfileSettings from '@/components/channels/settings/ChannelProfileSettings.vue'
import ChannelPrivacySettings from '@/components/channels/settings/ChannelPrivacySettings.vue'
import ChannelOrganizationSettings from '@/components/channels/settings/ChannelOrganizationSettings.vue'
import { useChannelDashboard } from '@/composables/useChannelDashboard'

const route = useRoute()
const channelId = computed(() => Number(route.params.id))
const { channel, isLoading, loadError, ensureLoaded, reload } = useChannelDashboard()

type TabKey = 'profil' | 'confidentialite' | 'organisation'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'profil', label: 'Profil de la chaîne' },
  { key: 'confidentialite', label: 'Confidentialité & sécurité' },
  { key: 'organisation', label: 'Organisation' },
]

const initialTab = TABS.some((t) => t.key === route.query.tab) ? (route.query.tab as TabKey) : 'profil'
const activeTab = ref<TabKey>(initialTab)

onMounted(() => ensureLoaded(channelId.value))
</script>

<template>
  <div class="mx-auto flex max-w-4xl flex-col gap-6">

    <template v-if="isLoading">
      <div class="h-10 w-64 animate-pulse rounded-2xl bg-slate-200" />
      <div class="h-96 animate-pulse rounded-[2rem] bg-slate-100" />
    </template>

    <p v-else-if="loadError" class="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
      {{ loadError }}
    </p>

    <template v-else-if="channel">
      <div>
        <h1 class="text-[26px] font-bold text-slate-950">Paramètres de la chaîne</h1>
        <p class="mt-1.5 text-[14.5px] text-slate-500">Identité, confidentialité et organisation de {{ channel.profile.name }}.</p>
      </div>

      <nav class="flex gap-1 overflow-x-auto rounded-[1.25rem] border border-slate-100 bg-white p-1.5 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          type="button"
          class="shrink-0 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold transition"
          :class="activeTab === tab.key ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </nav>

      <ChannelProfileSettings v-if="activeTab === 'profil'" :channel-id="channelId" :channel="channel" @reload="reload" />
      <ChannelPrivacySettings v-else-if="activeTab === 'confidentialite'" :channel-id="channelId" :channel="channel" @reload="reload" />
      <ChannelOrganizationSettings v-else-if="activeTab === 'organisation'" :channel-id="channelId" :channel="channel" @reload="reload" />
    </template>

  </div>
</template>
