<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppSidebarNavItem from '@/components/ui/AppSidebarNavItem.vue'

export type TabKey = 'apercu' | 'historique' | 'favoris' | 'abonnements' | 'parametres'
export type ActiveSection = TabKey | 'contenus' | 'mes-chaines'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  {
    key: 'apercu',
    label: 'Aperçu',
    icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
  },
  {
    key: 'historique',
    label: 'Historique',
    icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    key: 'favoris',
    label: 'Favoris',
    icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
  },
  {
    key: 'abonnements',
    label: 'Chaînes suivies',
    icon: 'M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z',
  },
  {
    key: 'parametres',
    label: 'Paramètres',
    icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
]

const STATIC_LINKS: { key: 'contenus' | 'mes-chaines'; to: string; label: string; icon: string }[] = [
  {
    key: 'contenus',
    to: '/contenus',
    label: 'Mes contenus',
    icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  },
  {
    key: 'mes-chaines',
    to: '/mes-chaines',
    label: 'Mes chaînes',
    icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  },
]

const props = withDefaults(
  defineProps<{
    active: ActiveSection
    subCount: number
    favCount: number
    /** true quand la sidebar est rendue depuis la page /user elle-même : les onglets
     * changent l'état local au lieu de naviguer. Depuis les autres pages du compte
     * (Mes contenus, Mes chaînes), un clic navigue vers /user?tab=... */
    preventNavigation?: boolean
  }>(),
  { preventNavigation: false },
)

const emit = defineEmits<{ 'select-tab': [key: TabKey] }>()

const authStore = useAuthStore()
const router = useRouter()

const userInitials = computed(() => {
  const firstName = authStore.user?.profile?.first_name?.[0] ?? ''
  const lastName = authStore.user?.profile?.last_name?.[0] ?? ''
  return `${firstName}${lastName}`.trim() || authStore.user?.email?.[0]?.toUpperCase() || 'ST'
})

const handle = computed(() => {
  const local = authStore.user?.email?.split('@')[0] ?? ''
  return local ? `@${local}` : ''
})

const memberSince = computed(() => {
  const createdAt = authStore.user?.created_at
  if (!createdAt) return '—'
  const year = new Date(createdAt).getFullYear()
  return Number.isNaN(year) ? '—' : String(year)
})

function onTabClick(key: TabKey, event: MouseEvent) {
  if (props.preventNavigation) {
    event.preventDefault()
    emit('select-tab', key)
  }
}

const isLoggingOut = computed(() => authStore.isLoggingOut)
async function handleLogout() {
  await authStore.logout()
  router.push('/')
}
</script>

<template>
  <aside class="flex w-full flex-col gap-5 lg:sticky lg:top-28 lg:w-[288px] lg:flex-none">
    <div class="rounded-[1.75rem] border border-slate-200 bg-white p-6 text-center shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
      <div class="mx-auto flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent text-3xl font-bold text-white">
        <img
          v-if="authStore.user?.profile?.avatar"
          :src="authStore.user.profile.avatar"
          alt="Photo de profil"
          class="h-full w-full object-cover"
        />
        <span v-else>{{ userInitials }}</span>
      </div>
      <div class="mt-4 text-[19px] font-bold text-slate-950">{{ authStore.displayName }}</div>
      <div v-if="handle" class="mt-0.5 text-[13px] text-slate-400">{{ handle }}</div>

      <RouterLink
        :to="{ path: '/user', query: { tab: 'parametres' } }"
        class="mt-[18px] block w-full rounded-[10px] border border-slate-200 bg-white py-2.5 text-[13.5px] font-bold text-slate-950 transition hover:bg-slate-50"
        @click="onTabClick('parametres', $event)"
      >
        Modifier le profil
      </RouterLink>

      <div class="mt-[22px] flex border-t border-slate-100 pt-5">
        <div class="flex-1">
          <div class="font-mono text-base font-semibold text-slate-950">{{ subCount }}</div>
          <div class="mt-0.5 text-[11px] text-slate-400">Abonnements</div>
        </div>
        <div class="flex-1">
          <div class="font-mono text-base font-semibold text-slate-950">{{ favCount }}</div>
          <div class="mt-0.5 text-[11px] text-slate-400">Favoris</div>
        </div>
        <div class="flex-1">
          <div class="font-mono text-base font-semibold text-slate-950">{{ memberSince }}</div>
          <div class="mt-0.5 text-[11px] text-slate-400">Membre depuis</div>
        </div>
      </div>
    </div>

    <nav class="flex flex-col gap-0.5 rounded-[1.75rem] border border-slate-200 bg-white p-2.5 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
      <AppSidebarNavItem
        v-for="tab in TABS"
        :key="tab.key"
        :to="{ path: '/user', query: { tab: tab.key } }"
        :label="tab.label"
        :icon="tab.icon"
        :active="active === tab.key"
        @click="onTabClick(tab.key, $event)"
      />

      <div class="my-2 mx-1.5 h-px bg-slate-100" />

      <AppSidebarNavItem
        v-for="link in STATIC_LINKS"
        :key="link.key"
        :to="link.to"
        :label="link.label"
        :icon="link.icon"
        :active="active === link.key"
      />

      <div class="my-2 mx-1.5 h-px bg-slate-100" />

      <AppSidebarNavItem
        as="button"
        tone="danger"
        :disabled="isLoggingOut"
        :label="isLoggingOut ? 'Déconnexion…' : 'Se déconnecter'"
        @click="handleLogout"
      />
    </nav>
  </aside>
</template>
