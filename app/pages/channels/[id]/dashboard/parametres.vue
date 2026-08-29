<script setup lang="ts">
definePageMeta({ layout: 'channel-dashboard', middleware: ['auth'], ssr: false, title: 'Paramètres de la chaîne', robots: 'noindex,nofollow' })
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import ChannelDashboardHeader from '@/components/channels/dashboard/ChannelDashboardHeader.vue'
import ChannelProfileSettings from '@/components/channels/settings/ChannelProfileSettings.vue'
import ChannelPrivacySettings from '@/components/channels/settings/ChannelPrivacySettings.vue'
import ChannelOrganizationSettings from '@/components/channels/settings/ChannelOrganizationSettings.vue'
import { useChannelDashboard } from '@/composables/useChannelDashboard'

const route = useRoute()
const channelId = computed(() => Number(route.params.id))
const { channel, reload } = useChannelDashboard()

type TabKey = 'profil' | 'confidentialite' | 'organisation'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'profil', label: 'Profil de la chaîne' },
  { key: 'confidentialite', label: 'Confidentialité & sécurité' },
  { key: 'organisation', label: 'Organisation' },
]

const initialTab = TABS.some((t) => t.key === route.query.tab) ? (route.query.tab as TabKey) : 'profil'
const activeTab = ref<TabKey>(initialTab)
</script>

<template>
  <div>
    <ChannelDashboardHeader
      title="Paramètres de la chaîne"
      subtitle="Identité publique, confidentialité et organisation de la chaîne."
    />

    <nav class="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_1px_3px_rgba(20,20,30,0.05)]">
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

    <ChannelProfileSettings v-if="channel && activeTab === 'profil'" :channel-id="channelId" :channel="channel" @reload="reload" />
    <ChannelPrivacySettings v-else-if="channel && activeTab === 'confidentialite'" :channel-id="channelId" :channel="channel" @reload="reload" />
    <ChannelOrganizationSettings v-else-if="channel && activeTab === 'organisation'" :channel-id="channelId" :channel="channel" @reload="reload" />
  </div>
</template>
