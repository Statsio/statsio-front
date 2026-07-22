<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useChannelDashboard } from '@/composables/useChannelDashboard'
import { channelBannerStyle, resolveChannelColors } from '@/lib/channel-brand'

const route = useRoute()
const { channel, channelInitials } = useChannelDashboard()

const channelId = computed(() => Number(route.params.id))
const basePath = computed(() => `/channels/${channelId.value}/dashboard`)

const brandColors = computed(() =>
  resolveChannelColors(
    String(channel.value?.id ?? channelId.value),
    channel.value?.profile?.custom_color_primary,
    channel.value?.profile?.custom_color_secondary,
  ),
)
const brandStyle = computed(() => channelBannerStyle(brandColors.value.primary, brandColors.value.secondary))

type NavItem = { to: string; label: string; icon: string; exact?: boolean }

const navItems = computed<NavItem[]>(() => [
  {
    to: basePath.value,
    label: 'Vue d\'ensemble',
    exact: true,
    icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
  },
  {
    to: `${basePath.value}/profil`,
    label: 'Profil',
    icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  },
  {
    to: `${basePath.value}/mis-en-avant`,
    label: 'Mis en avant',
    icon: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
  },
  {
    to: `${basePath.value}/confidentialite`,
    label: 'Confidentialité',
    icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  },
  {
    to: `${basePath.value}/membres`,
    label: 'Membres & rôles',
    icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  },
  {
    to: `${basePath.value}/abonnes`,
    label: 'Abonnés',
    icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
  },
  {
    to: `${basePath.value}/parametres`,
    label: 'Paramètres',
    icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
])

const isActive = (item: NavItem) =>
  item.exact ? route.path === item.to : route.path.startsWith(item.to)
</script>

<template>
  <aside class="flex h-full w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
    <!-- Identité de la chaîne -->
    <div class="border-b border-slate-100">
      <div class="h-20 w-full" :style="channel?.profile?.banner_url ? undefined : brandStyle">
        <img
          v-if="channel?.profile?.banner_url"
          :src="channel.profile.banner_url"
          alt=""
          class="h-full w-full object-cover"
        />
      </div>
      <div class="px-5 pb-5">
        <div class="-mt-7 mb-2.5">
          <img
            v-if="channel?.profile?.logo_url"
            :src="channel.profile.logo_url"
            :alt="channel.profile.name"
            class="h-14 w-14 rounded-2xl object-cover ring-4 ring-white"
          />
          <div
            v-else
            class="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white ring-4 ring-white"
            :style="brandStyle"
          >
            {{ channelInitials }}
          </div>
        </div>
        <p class="truncate text-sm font-semibold text-slate-950">
          {{ channel?.profile?.name ?? 'Chargement...' }}
        </p>
        <p class="truncate text-xs text-slate-500">
          @{{ channel?.profile?.handle ?? '...' }}
        </p>
        <div v-if="channel" class="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-2.5">
          <div class="text-center">
            <p class="text-sm font-bold text-slate-950">{{ channel.profile.subscriber_count ?? 0 }}</p>
            <p class="text-[11px] text-slate-500">abonnés</p>
          </div>
          <div class="text-center">
            <p class="text-sm font-bold text-slate-950">{{ channel.profile.view_count ?? 0 }}</p>
            <p class="text-[11px] text-slate-500">vues</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto p-3">
      <p class="eyebrow px-3 pb-2 pt-1 text-slate-400">Gestion</p>
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="mb-1 flex items-center gap-3 rounded-[1.25rem] px-4 py-2.5 text-sm font-semibold transition"
        :class="isActive(item) ? 'bg-primary text-white shadow-[0_10px_24px_color-mix(in_srgb,var(--color-primary)_28%,transparent)]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
      >
        <svg class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
        </svg>
        {{ item.label }}
      </NuxtLink>
    </nav>

    <!-- Pied : retour au site -->
    <div class="border-t border-slate-100 p-3">
      <NuxtLink
        to="/mes-chaines"
        class="flex items-center gap-2.5 rounded-[1.25rem] px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-primary"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Retour à mes chaînes
      </NuxtLink>
      <NuxtLink
        to="/"
        class="flex items-center gap-2.5 rounded-[1.25rem] px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-primary"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
        </svg>
        Retour au site
      </NuxtLink>
    </div>
  </aside>
</template>
