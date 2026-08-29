<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppSidebarNavItem from '@/components/ui/AppSidebarNavItem.vue'
import CreateContentMenu from '@/components/create/CreateContentMenu.vue'
import { useAuthStore } from '@/stores/auth'
import { getUserInitials } from '@/lib/format'

const emit = defineEmits<{ navigate: [] }>()

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const TABS = [
  {
    to: '/user',
    label: 'Aperçu',
    exact: true,
    icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
    countKey: null,
  },
  {
    to: '/user/contenus',
    label: 'Mes contenus',
    icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    countKey: 'contents' as const,
  },
  {
    to: '/user/abonnements',
    label: 'Chaînes suivies',
    icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
    countKey: 'subscriptions' as const,
  },
  {
    to: '/user/historique',
    label: 'Historique',
    icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
    countKey: null,
  },
  {
    to: '/user/favoris',
    label: 'Favoris',
    icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
    countKey: 'favorites' as const,
  },
  {
    to: '/user/parametres',
    label: 'Paramètres',
    icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    countKey: null,
  },
]

const counts = computed(() => authStore.user?.counts)

const initials = computed(() =>
  getUserInitials(
    authStore.user?.profile?.first_name,
    authStore.user?.profile?.last_name,
    authStore.user?.email?.[0]?.toUpperCase() ?? 'ST',
  ),
)

const handle = computed(() => {
  const local = authStore.user?.email?.split('@')[0] ?? ''
  return local ? `@${local}` : ''
})

const memberSince = computed(() => {
  const createdAt = authStore.user?.created_at
  if (!createdAt) return null
  const date = new Date(createdAt)
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
})

function isActive(tab: { to: string; exact?: boolean }) {
  return tab.exact ? route.path === tab.to : route.path.startsWith(tab.to)
}

function formatCount(value?: number) {
  return value && value > 0 ? String(value) : ''
}

async function handleLogout() {
  await authStore.logout()
  emit('navigate')
  router.push('/')
}
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <!-- Carte profil -->
    <div class="shrink-0 px-3.5 pb-3.5 pt-[18px]">
      <div class="rounded-2xl border-[1.5px] border-slate-200 p-4 text-center">
        <AppAvatar
          :src="authStore.user?.profile?.avatar ?? undefined"
          :initials="initials"
          size="md"
          background="linear-gradient(135deg, var(--color-primary), var(--color-accent))"
          class="mx-auto"
        />
        <div class="mt-2.5 text-[14.5px] font-extrabold text-slate-950">{{ authStore.displayName }}</div>
        <div v-if="handle" class="mt-0.5 font-mono text-[10.5px] text-slate-400">{{ handle }}</div>
        <div v-if="memberSince" class="mt-2 text-[11px] text-slate-400">Membre depuis {{ memberSince }}</div>

        <div class="mt-3.5 flex border-t border-slate-100 pt-3">
          <div class="flex-1">
            <div class="font-mono text-sm font-semibold text-slate-950">{{ counts?.subscriptions ?? 0 }}</div>
            <div class="mt-0.5 text-[9.5px] font-bold uppercase tracking-[0.04em] text-slate-400">Suivies</div>
          </div>
          <div class="flex-1 border-l border-slate-100">
            <div class="font-mono text-sm font-semibold text-slate-950">{{ counts?.favorites ?? 0 }}</div>
            <div class="mt-0.5 text-[9.5px] font-bold uppercase tracking-[0.04em] text-slate-400">Favoris</div>
          </div>
          <div class="flex-1 border-l border-slate-100">
            <div class="font-mono text-sm font-semibold text-slate-950">{{ counts?.channels ?? 0 }}</div>
            <div class="mt-0.5 text-[9.5px] font-bold uppercase tracking-[0.04em] text-slate-400">Chaînes</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation (onglets) -->
    <nav class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3.5">
      <AppSidebarNavItem
        v-for="tab in TABS"
        :key="tab.to"
        :to="tab.to"
        :label="tab.label"
        :icon="tab.icon"
        :active="isActive(tab)"
        @click="emit('navigate')"
      >
        <template #trailing>
          <span v-if="tab.countKey" class="font-mono text-[10px] text-slate-400">
            {{ formatCount(counts?.[tab.countKey]) }}
          </span>
        </template>
      </AppSidebarNavItem>
    </nav>

    <!-- Actions secondaires (hors zone scrollable pour ne pas rogner le menu) -->
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
            <span class="flex-1">Nouveau contenu</span>
          </button>
        </template>
      </CreateContentMenu>

      <AppSidebarNavItem
        to="/user/chaines"
        label="Mes chaînes"
        icon="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        :active="route.path.startsWith('/user/chaines')"
        @click="emit('navigate')"
      />
      <AppSidebarNavItem
        to="/"
        label="Retour au site Statsio"
        icon="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
        @click="emit('navigate')"
      />
    </div>

    <!-- Déconnexion -->
    <div class="mt-3 shrink-0 border-t border-slate-100 px-3.5 py-3">
      <AppSidebarNavItem
        as="button"
        tone="danger"
        :disabled="authStore.isLoggingOut"
        :label="authStore.isLoggingOut ? 'Déconnexion…' : 'Se déconnecter'"
        icon="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3"
        @click="handleLogout"
      />
    </div>
  </div>
</template>
