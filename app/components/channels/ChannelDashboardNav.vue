<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useChannelDashboard } from '@/composables/useChannelDashboard'

const route = useRoute()
const { channel } = useChannelDashboard()

const channelId = computed(() => Number(route.params.id))
const basePath = computed(() => `/channels/${channelId.value}/dashboard`)
const accentColor = computed(() => channel.value?.profile?.custom_color_primary || 'var(--color-primary)')

type NavItem = { to: string; label: string; exact?: boolean }

const navItems = computed<NavItem[]>(() => [
  { to: basePath.value, label: "Vue d'ensemble", exact: true },
  { to: `${basePath.value}/contenus`, label: 'Contenus' },
  { to: `${basePath.value}/abonnes`, label: 'Abonnés' },
  { to: `${basePath.value}/membres`, label: 'Membres' },
  { to: `${basePath.value}/parametres`, label: 'Paramètres' },
])

const isActive = (item: NavItem) =>
  item.exact ? route.path === item.to : route.path.startsWith(item.to)
</script>

<template>
  <nav class="flex flex-col gap-0.5 rounded-[20px] border border-slate-100 bg-white p-2.5 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
    <NuxtLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="flex items-center gap-[11px] rounded-xl px-3.5 py-3 text-[14.5px] font-semibold transition"
      :class="isActive(item) ? '' : 'text-slate-700 hover:bg-slate-50'"
      :style="isActive(item) ? { background: `color-mix(in srgb, ${accentColor} 12%, transparent)`, color: accentColor } : {}"
    >
      <span
        class="h-2 w-2 shrink-0 rounded-full"
        :style="{ background: isActive(item) ? accentColor : 'rgba(24,24,31,0.2)' }"
      />
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>
