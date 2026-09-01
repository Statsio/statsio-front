<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppSidebarNavItem from '@/components/ui/AppSidebarNavItem.vue'
import ChannelSwitcher from '@/components/channels/ChannelSwitcher.vue'
import CreateContentMenu from '@/components/create/CreateContentMenu.vue'
import { useAuthStore } from '@/stores/auth'
import { useChannelDashboard } from '@/composables/useChannelDashboard'
import { useChannelStats } from '@/composables/useChannelStats'
import { useChannelContents } from '@/composables/useChannelContents'
import { useChannelDataSources } from '@/composables/useChannelDataSources'
import { getUserInitials, formatCompactNumber } from '@/lib/format'

const emit = defineEmits<{ navigate: [] }>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

async function handleLogout() {
  await authStore.logout()
  emit('navigate')
  router.push('/')
}
const channelId = computed(() => Number(route.params.id))
const basePath = computed(() => `/channels/${channelId.value}/dashboard`)

const { channel } = useChannelDashboard()
const { stats } = useChannelStats(channelId)
const { entries: channelContentEntries } = useChannelContents(channelId, channel)
const { count: sourceCount } = useChannelDataSources(channelId)

const userInitials = computed(() =>
  getUserInitials(
    authStore.user?.profile?.first_name,
    authStore.user?.profile?.last_name,
    authStore.user?.email?.[0]?.toUpperCase() ?? 'ST',
  ),
)

const subscriberCount = computed(
  () => stats.value?.subscribers.total ?? channel.value?.profile?.subscriber_count ?? 0,
)

type NavItem = { to: string; label: string; icon: string; exact?: boolean; count?: string }

const navItems = computed<NavItem[]>(() => [
  {
    to: basePath.value,
    label: "Vue d'ensemble",
    exact: true,
    icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
  },
  {
    to: `${basePath.value}/contenus`,
    label: 'Contenus',
    icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    count: channelContentEntries.value.length ? String(channelContentEntries.value.length) : undefined,
  },
  {
    to: `${basePath.value}/sources`,
    label: 'Sources de données',
    icon: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125',
    count: sourceCount.value ? String(sourceCount.value) : undefined,
  },
  {
    to: `${basePath.value}/abonnes`,
    label: 'Abonnés',
    icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
    count: subscriberCount.value ? formatCompactNumber(subscriberCount.value) : undefined,
  },
  {
    to: `${basePath.value}/membres`,
    label: 'Membres',
    icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    count: stats.value?.teamMemberCount ? String(stats.value.teamMemberCount) : undefined,
  },
  {
    to: `${basePath.value}/parametres`,
    label: 'Paramètres',
    icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
])

function isActive(item: NavItem) {
  return item.exact ? route.path === item.to : route.path.startsWith(item.to)
}
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <!-- Retour à l'espace compte -->
    <NuxtLink
      to="/user"
      class="flex shrink-0 items-center gap-2.5 border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50"
      @click="emit('navigate')"
    >
      <span class="w-[18px] shrink-0 text-center text-[14px] leading-none text-primary">←</span>
      <span class="min-w-0 flex-1">
        <span class="block text-[9.5px] font-extrabold uppercase tracking-[0.07em] text-slate-400">Retour à</span>
        <span class="mt-0.5 block text-[12.5px] font-bold text-slate-950">Mon profil Statsio</span>
      </span>
      <AppAvatar
        :src="authStore.user?.profile?.avatar ?? undefined"
        :initials="userInitials"
        size="sm"
        background="linear-gradient(135deg, var(--color-primary), var(--color-accent))"
        class="!h-[26px] !w-[26px] !text-[9.5px]"
      />
    </NuxtLink>

    <!-- Sélecteur de chaîne -->
    <div class="shrink-0 px-3.5 pb-3 pt-4">
      <ChannelSwitcher />
    </div>

    <!-- Navigation -->
    <nav class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3.5">
      <AppSidebarNavItem
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :label="item.label"
        :icon="item.icon"
        :active="isActive(item)"
        @click="emit('navigate')"
      >
        <template #trailing>
          <span v-if="item.count" class="font-mono text-[10px] text-slate-400">{{ item.count }}</span>
        </template>
      </AppSidebarNavItem>
    </nav>

    <!-- Actions secondaires -->
    <div class="flex shrink-0 flex-col gap-0.5 px-3.5 pt-3">
      <div class="mx-1.5 mb-3 h-px bg-slate-100" />

      <CreateContentMenu align="left" direction="up" panel-class="!w-[236px]">
        <template #default="{ toggle }">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13.5px] font-bold text-slate-950 transition hover:bg-slate-50"
            @click="toggle"
          >
            <span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[15px] text-primary">✛</span>
            <span class="flex-1">Créer un contenu</span>
          </button>
        </template>
      </CreateContentMenu>

      <AppSidebarNavItem
        to="/user/chaines"
        label="Gérer mes chaînes"
        icon="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12M3 3v18M15 3l6 6m0 0v12"
        :active="route.path.startsWith('/user/chaines')"
        @click="emit('navigate')"
      />
      <AppSidebarNavItem
        :to="`${basePath}/parametres?tab=profil`"
        label="Profil de la chaîne"
        icon="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
        @click="emit('navigate')"
      />
    </div>

    <!-- Déconnexion -->
    <div class="shrink-0 border-t border-slate-100 px-3.5 py-2">
      <AppSidebarNavItem
        as="button"
        tone="danger"
        :disabled="authStore.isLoggingOut"
        :label="authStore.isLoggingOut ? 'Déconnexion…' : 'Se déconnecter'"
        icon="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3"
        @click="handleLogout"
      />
    </div>

    <!-- Carte upgrade -->
    <div class="shrink-0 px-3.5 pb-4 pt-2">
      <div class="rounded-2xl bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] p-4 text-white">
        <div class="text-[13px] font-extrabold leading-tight">Passez à Statsio Pro</div>
        <div class="mt-1.5 text-[11.5px] leading-relaxed text-white/80">
          Audience illimitée, revenus et export des données brutes.
        </div>
        <NuxtLink
          to="/about"
          class="mt-3 block rounded-full bg-white px-3.5 py-2 text-center text-[11px] font-extrabold uppercase tracking-[0.06em] text-primary"
          @click="emit('navigate')"
        >
          En savoir plus
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
