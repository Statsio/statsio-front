<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppAccessibilityPanel from '@/components/layout/AppAccessibilityPanel.vue'
import type { HeaderNavItem } from '@/components/layout/brands/header-nav.types'
import StatsioAppHeaderNav from '@/components/layout/brands/statsio/AppHeaderNav.vue'
import TvstatsAppHeaderNav from '@/components/layout/brands/tvstats/AppHeaderNav.vue'
import AppDropdownMenu from '@/components/layout/AppDropdownMenu.vue'
import AppDropdownMenuItem from '@/components/layout/AppDropdownMenuItem.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { getBrandFromPath } from '@/data/brands'
import { getErrorMessage } from '@/lib/http-errors'
import { useAuthStore } from '@/stores/auth'

const notifications = [
  {
    type: 'Nouvel article',
    title: 'Camille Bernard a publié un nouvel article',
    detail: 'Inflation : qui retrouve un peu d’air en 2026 ?',
    href: '/articles/inflation-qui-retrouve-un-peu-dair-en-2026',
    tone: 'primary',
    time: 'Il y a 12 min',
  },
  {
    type: 'Performance',
    title: 'Votre article gagne en visibilité',
    detail: 'Présidentielle 2027 dépasse +18% d’engagement sur les 24 dernières heures.',
    href: '/articles/presidentielle-2027-bassins-indecision',
    tone: 'accent',
    time: 'Il y a 38 min',
  },
  {
    type: 'Nouveau sondage',
    title: 'Un abonnement a lancé un nouveau sondage',
    detail: 'Baromètre municipal: intentions de vote et priorités locales.',
    href: '/profile',
    tone: 'secondary',
    time: 'Il y a 1 h',
  },
  {
    type: 'Statsio',
    title: 'Suivez en direct les résultats des municipales 2026',
    detail: 'Statsio centralise les signaux, cartes et bascules clés de la soirée.',
    href: '/fil-actus',
    tone: 'slate',
    time: 'Alerte éditoriale',
  },
] as const

const notificationToneClasses = {
  primary: 'bg-primary/12 text-primary',
  accent: 'bg-accent/15 text-slate-900',
  secondary: 'bg-secondary/70 text-slate-900',
  slate: 'bg-slate-900 text-white',
} as const

const activeMenu = ref<HeaderNavItem | null>(null)
const logoutError = ref('')
const isBrandMenuOpen = ref(false)
const brandMenuRef = ref<HTMLElement | null>(null)
const isNotificationsOpen = ref(false)
const notificationsRef = ref<HTMLElement | null>(null)
const isUserMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const currentBrand = computed(() => getBrandFromPath(route.path))
const brandMenuItems = computed(() => currentBrand.value.switchMenu)
const brandNavComponentById = {
  statsio: StatsioAppHeaderNav,
  tvstats: TvstatsAppHeaderNav,
} as const
const currentBrandNavComponent = computed(() => brandNavComponentById[currentBrand.value.id])

const userInitials = () => {
  const firstName = authStore.user?.profile?.first_name?.[0] ?? ''
  const lastName = authStore.user?.profile?.last_name?.[0] ?? ''
  const initials = `${firstName}${lastName}`.trim()

  return initials || 'ST'
}

const handleLogout = async () => {
  logoutError.value = ''
  isBrandMenuOpen.value = false
  isNotificationsOpen.value = false
  isUserMenuOpen.value = false

  try {
    await authStore.logout()
    await router.push({ name: 'home' })
  } catch (error) {
    logoutError.value = getErrorMessage(error, 'Déconnexion impossible pour le moment.')
  }
}

const toggleBrandMenu = () => {
  isBrandMenuOpen.value = !isBrandMenuOpen.value

  if (isBrandMenuOpen.value) {
    isNotificationsOpen.value = false
    isUserMenuOpen.value = false
  }
}

const closeBrandMenu = () => {
  isBrandMenuOpen.value = false
}

const toggleNotifications = () => {
  isNotificationsOpen.value = !isNotificationsOpen.value

  if (isNotificationsOpen.value) {
    isBrandMenuOpen.value = false
    isUserMenuOpen.value = false
  }
}

const closeNotifications = () => {
  isNotificationsOpen.value = false
}

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value

  if (isUserMenuOpen.value) {
    isBrandMenuOpen.value = false
    isNotificationsOpen.value = false
  }
}

const closeUserMenu = () => {
  isUserMenuOpen.value = false
}

const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target

  if (!(target instanceof Node)) {
    closeBrandMenu()
    closeNotifications()
    closeUserMenu()
    return
  }

  if (!brandMenuRef.value?.contains(target)) {
    closeBrandMenu()
  }

  if (!notificationsRef.value?.contains(target)) {
    closeNotifications()
  }

  if (!userMenuRef.value?.contains(target)) {
    closeUserMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <header class="fixed inset-x-0 top-14 z-40 border-b border-slate-200 bg-white/80 backdrop-blur"
    @mouseleave="activeMenu = null">
    <div class="container flex items-center justify-between py-1">
      <div ref="brandMenuRef" class="relative flex items-center gap-2">
        <RouterLink :to="currentBrand.to"
          class="flex items-center gap-4 rounded-full transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35">
          <img :src="currentBrand.logo" :alt="currentBrand.logoAlt" class="h-10 w-10 rounded-xl bg-white p-1" />
          <p :class="[currentBrand.wordmarkClass, 'text-xl font-bold uppercase font-mono']">
            {{ currentBrand.prefix }}<span :class="currentBrand.suffixClass">{{ currentBrand.suffix }}</span>
          </p>
        </RouterLink>

        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          :aria-expanded="isBrandMenuOpen"
          aria-haspopup="menu"
          aria-label="Changer de marque"
          @click="toggleBrandMenu"
        >
          <svg
            viewBox="0 0 20 20"
            class="h-4 w-4 shrink-0 transition"
            :class="isBrandMenuOpen ? 'rotate-180' : ''"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <AppDropdownMenu v-if="isBrandMenuOpen" label="Menu des marques" align="left" width-class="min-w-[240px]">
          <AppDropdownMenuItem
            v-for="brandItem in brandMenuItems"
            :key="brandItem.id"
            :to="brandItem.to"
            @click="closeBrandMenu"
          >
            <template #leading>
              <img :src="brandItem.logo" alt="" class="h-10 w-10 rounded-xl border border-slate-200 bg-white p-1.5" />
            </template>
            <span class="block text-left">
              <span class="block text-sm font-semibold text-slate-900">{{ brandItem.name }}</span>
              <span class="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ brandItem.eyebrow }}</span>
            </span>
          </AppDropdownMenuItem>
        </AppDropdownMenu>
      </div>

      <component :is="currentBrandNavComponent" v-model="activeMenu" />

      <div class="flex items-center gap-3">
        <AppAccessibilityPanel />

        <template v-if="authStore.isAuthenticated">
          <div ref="notificationsRef" class="relative">
            <button type="button"
              class="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              :aria-expanded="isNotificationsOpen" aria-haspopup="menu" aria-label="Notifications"
              @click="toggleNotifications">
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M14.857 18H9.143M18 16.5714V10.8571C18 7.30459 15.5525 4.28571 12 4.28571C8.44752 4.28571 6 7.30459 6 10.8571V16.5714L4.28571 18.2857V19.1429H19.7143V18.2857L18 16.5714Z"
                  stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M10.2856 19.1428C10.2856 20.0896 11.0531 20.8571 11.9999 20.8571C12.9467 20.8571 13.7142 20.0896 13.7142 19.1428"
                  stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
              <span
                class="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-white">
                {{ notifications.length }}
              </span>
            </button>

            <div v-if="isNotificationsOpen"
              class="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(92vw,380px)] rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)]"
              role="menu" aria-label="Notifications">
              <div class="flex items-center justify-between px-4 py-3">
                <div>
                  <p class="text-sm font-semibold text-slate-950">Notifications</p>
                  <p class="text-xs text-slate-500">Activité éditoriale et alertes Statsio</p>
                </div>
                <span
                  class="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {{ notifications.length }} nouvelles
                </span>
              </div>

              <div class="flex max-h-[420px] flex-col gap-2 overflow-y-auto pb-1">
                <RouterLink v-for="notification in notifications" :key="notification.title" :to="notification.href"
                  class="flex w-full items-start gap-4 rounded-[1.25rem] px-4 py-4 text-left transition hover:bg-slate-50"
                  role="menuitem" @click="closeNotifications">
                  <span
                    class="mt-0.5 inline-flex shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                    :class="notificationToneClasses[notification.tone]">
                    {{ notification.type }}
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block text-sm font-semibold text-slate-900">{{ notification.title }}</span>
                    <span class="mt-1 block text-sm leading-6 text-slate-500">{{ notification.detail }}</span>
                    <span class="mt-3 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      {{ notification.time }}
                    </span>
                  </span>
                </RouterLink>
              </div>
            </div>
          </div>

          <div ref="userMenuRef" class="relative">
            <button type="button"
              class="inline-flex items-center rounded-full border border-slate-200 bg-white md:pl-0 p-1 md:p-3 text-left transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:gap-3 md:py-0 md:pr-3"
              :aria-expanded="isUserMenuOpen" aria-haspopup="menu" aria-label="Mon compte" @click="toggleUserMenu">
              <AppAvatar :initials="userInitials()" size="sm" />
              <span class="hidden min-w-0 md:block">
                <span class="block truncate text-sm font-semibold text-slate-900">{{ authStore.displayName }}</span>
                <span class="block truncate text-xs text-slate-500">{{ authStore.user?.email }}</span>
              </span>
              <svg viewBox="0 0 20 20" class="hidden h-4 w-4 shrink-0 text-slate-500 transition md:block"
                :class="isUserMenuOpen ? 'rotate-180' : ''" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </button>

            <AppDropdownMenu v-if="isUserMenuOpen" label="Menu utilisateur">
              <AppDropdownMenuItem to="/profile" @click="closeUserMenu">
                Mon profil
              </AppDropdownMenuItem>

              <AppDropdownMenuItem to="/mes-chaines" @click="closeUserMenu">
                Mes chaînes
              </AppDropdownMenuItem>

              <AppDropdownMenuItem to="/historique" @click="closeUserMenu">
                Historique
              </AppDropdownMenuItem>

              <AppDropdownMenuItem to="/fil-actus" @click="closeUserMenu">
                Fil d’actus
              </AppDropdownMenuItem>

              <AppDropdownMenuItem to="/contenus" @click="closeUserMenu">
                Mes contenus
              </AppDropdownMenuItem>

              <AppDropdownMenuItem
                as="button"
                danger
                :disabled="authStore.isLoggingOut"
                @click="handleLogout"
              >
                {{ authStore.isLoggingOut ? 'Déconnexion...' : 'Se déconnecter' }}
                <template #trailing>↗</template>
              </AppDropdownMenuItem>
            </AppDropdownMenu>
          </div>
        </template>
        <template v-else>
          <div class="md:hidden">
            <AppButton as="router-link" to="/login" variant="primary" size="md" icon-only aria-label="Connexion">
              <template #icon>
                <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 12C14.4853 12 16.5 9.98528 16.5 7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5C7.5 9.98528 9.51472 12 12 12Z"
                    stroke="currentColor" stroke-width="1.8" />
                  <path d="M4.5 20.25C4.5 16.9363 7.85786 14.25 12 14.25C16.1421 14.25 19.5 16.9363 19.5 20.25"
                    stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
              </template>
            </AppButton>
          </div>

          <div class="hidden items-center gap-3 md:flex">
            <AppButton as="router-link" to="/login" variant="outline" size="md">
              Connexion
            </AppButton>
            <AppButton as="router-link" to="/register" variant="primary" size="md" icon-position="right">
              Lancez-vous !
              <template #icon>→</template>
            </AppButton>
          </div>
        </template>
      </div>
    </div>

    <div v-if="logoutError" class="container pt-3">
      <div class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {{ logoutError }}
      </div>
    </div>

    <div v-if="activeMenu"
      class="absolute left-0 top-full z-30 w-full border-y border-slate-200 bg-white/95 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur"
      @mouseenter="activeMenu = activeMenu">
      <div class="container grid grid-cols-[minmax(0,1.35fr)_minmax(260px,0.75fr)] gap-12 py-10">
        <div class="space-y-5">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            {{ activeMenu.eyebrow }}
          </p>
          <div class="max-w-2xl space-y-3">
            <h3 class="text-3xl font-semibold leading-tight text-slate-950">
              {{ activeMenu.title }}
            </h3>
            <p class="text-base leading-7 font-medium text-slate-500">
              {{ activeMenu.description }}
            </p>
          </div>

          <div class="grid max-w-3xl grid-cols-2 gap-4">
            <a v-for="link in activeMenu.links" :key="link" href="#"
              class="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-700 transition hover:border-primary/30 hover:bg-white hover:text-slate-950">
              {{ link }}
            </a>
          </div>
        </div>

        <aside class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
            {{ activeMenu.featured.title }}
          </p>
          <p class="mt-4 text-4xl font-semibold">{{ activeMenu.featured.value }}</p>
          <p class="mt-3 max-w-xs text-sm leading-6 text-slate-300">
            {{ activeMenu.featured.detail }}
          </p>

          <div class="mt-8 rounded-3xl bg-white/10 p-4">
            <div class="flex items-end gap-2">
              <div class="h-10 w-3 rounded-full bg-accent"></div>
              <div class="h-16 w-3 rounded-full bg-primary"></div>
              <div class="h-24 w-3 rounded-full bg-white"></div>
              <div class="h-12 w-3 rounded-full bg-primary/70"></div>
            </div>
            <p class="mt-4 text-xs uppercase tracking-[0.22em] text-slate-400">Vue synthétique</p>
          </div>
        </aside>
      </div>
    </div>
  </header>
</template>
