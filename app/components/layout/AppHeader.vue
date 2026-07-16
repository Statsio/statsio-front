<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, type Component } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppAccessibilityPanel from '@/components/layout/AppAccessibilityPanel.vue'
import type { HeaderNavItem } from '@/components/layout/brands/header-nav.types'
import StatsioAppHeaderNav from '@/components/layout/brands/statsio/AppHeaderNav.vue'
import TvstatsAppHeaderNav from '@/components/layout/brands/tvstats/AppHeaderNav.vue'
import MedistatsAppHeaderNav from '@/components/layout/brands/medistats/AppHeaderNav.vue'
import AppDropdownMenu from '@/components/layout/AppDropdownMenu.vue'
import AppDropdownMenuItem from '@/components/layout/AppDropdownMenuItem.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { getBrandFromPath, type BrandId } from '@/data/brands'
import { getErrorMessage } from '@/lib/http-errors'
import { useAuthStore } from '@/stores/auth'
import { useClickOutside } from '@/composables/useClickOutside'

const notificationCount = 4

interface BrandNavExpose { items: HeaderNavItem[] }

const activeMenu = ref<HeaderNavItem | null>(null)
const logoutError = ref('')
const isBrandMenuOpen = ref(false)
const isMobileMenuOpen = ref(false)
const brandNavRef = ref<BrandNavExpose | null>(null)
const accessibilityPanelRef = ref<{ open: () => void } | null>(null)
const mobileNavItems = computed<HeaderNavItem[]>(() => brandNavRef.value?.items ?? [])
const brandMenuRef = ref<HTMLElement | null>(null)
const isUserMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const currentBrand = computed(() => getBrandFromPath(route.path))
const brandMenuItems = computed(() => currentBrand.value.switchMenu)
const brandNavComponentById: Record<BrandId, Component> = {
  statsio: StatsioAppHeaderNav,
  tvstats: TvstatsAppHeaderNav,
  medistats: MedistatsAppHeaderNav,
}
const currentBrandNavComponent = computed(() => brandNavComponentById[currentBrand.value.id as BrandId])

const userInitials = () => {
  const firstName = authStore.user?.profile?.first_name?.[0] ?? ''
  const lastName = authStore.user?.profile?.last_name?.[0] ?? ''
  const initials = `${firstName}${lastName}`.trim()

  return initials || 'ST'
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  if (isMobileMenuOpen.value) {
    isBrandMenuOpen.value = false
    isUserMenuOpen.value = false
    activeMenu.value = null
  }
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const openAccessibilityPanel = () => {
  closeMobileMenu()
  setTimeout(() => accessibilityPanelRef.value?.open(), 50)
}

watch(route, () => {
  closeMobileMenu()
})

watch(isMobileMenuOpen, (open: boolean) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = open ? 'hidden' : ''
  }
})

const handleLogout = async () => {
  logoutError.value = ''
  isBrandMenuOpen.value = false
  isUserMenuOpen.value = false
  closeMobileMenu()

  try {
    await authStore.logout()
    await router.push('/')
  } catch (error) {
    logoutError.value = getErrorMessage(error, 'Déconnexion impossible pour le moment.')
  }
}

const toggleBrandMenu = () => {
  isBrandMenuOpen.value = !isBrandMenuOpen.value

  if (isBrandMenuOpen.value) {
    isUserMenuOpen.value = false
  }
}

const closeBrandMenu = () => {
  isBrandMenuOpen.value = false
}

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value

  if (isUserMenuOpen.value) {
    isBrandMenuOpen.value = false
  }
}

const closeUserMenu = () => {
  isUserMenuOpen.value = false
}

useClickOutside(brandMenuRef, closeBrandMenu, { escapeKey: false })
useClickOutside(userMenuRef, closeUserMenu)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <header class="fixed inset-x-0 top-14 z-40 border-b border-slate-200 bg-white/80 backdrop-blur"
    @mouseleave="activeMenu = null">
    <div class="container flex items-center justify-between py-1">
      <div ref="brandMenuRef" class="relative flex items-center gap-2">
        <RouterLink :to="currentBrand.to"
          class="flex items-center gap-2 sm:gap-4 rounded-full transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35">
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

        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-1"
        >
          <div
            v-if="isBrandMenuOpen"
            class="absolute left-0 top-[calc(100%+0.75rem)] z-50 w-72 origin-top-left rounded-2xl border border-slate-200 bg-white shadow-[0_24px_64px_-32px_rgba(15,23,42,0.4)]"
            role="menu"
            aria-label="Changer d'univers"
          >
            <div class="border-b border-slate-100 px-4 py-3">
              <p class="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Changer d'univers</p>
            </div>
            <div class="p-2">
              <RouterLink
                v-for="brand in brandMenuItems"
                :key="brand.id"
                :to="brand.to"
                class="group flex items-center gap-3.5 rounded-xl p-3 transition hover:bg-slate-50"
                role="menuitem"
                @click="closeBrandMenu"
              >
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
                  :class="brand.accentClass"
                >
                  <img :src="brand.logo" :alt="brand.name" class="h-7 w-7" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-bold tracking-wide text-slate-900">{{ brand.name }}</p>
                  <p class="mt-0.5 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">{{ brand.eyebrow }}</p>
                  <p class="mt-1 text-xs leading-relaxed text-slate-500">{{ brand.description }}</p>
                </div>
                <svg
                  class="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
                  viewBox="0 0 20 20" fill="none"
                >
                  <path d="M7 10h6m0 0l-2.5-2.5M13 10l-2.5 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
              </RouterLink>
            </div>
          </div>
        </Transition>
      </div>

      <component :is="currentBrandNavComponent" ref="brandNavRef" v-model="activeMenu" />

      <div class="flex items-center gap-3">
        <AppAccessibilityPanel ref="accessibilityPanelRef" />

        <template v-if="authStore.isAuthenticated">
          <div ref="userMenuRef" class="relative">
            <button type="button"
              class="inline-flex items-center rounded-full md:border md:border-slate-200 md:bg-white md:pl-0 p-1 md:p-3 text-left transition hover:md:border-slate-300 hover:md:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:gap-3 md:py-0 md:pr-3"
              :aria-expanded="isUserMenuOpen" aria-haspopup="menu" aria-label="Mon compte" @click="toggleUserMenu">
              <span class="relative shrink-0">
                <AppAvatar :src="authStore.user?.profile?.avatar ?? undefined" :initials="userInitials()" size="sm" />
                <span v-if="notificationCount > 0"
                  class="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {{ notificationCount }}
                </span>
              </span>
              <span class="hidden min-w-0 max-w-[90px] md:block lg:max-w-[130px]">
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
              <AppDropdownMenuItem v-if="authStore.isAdmin" to="/admin" @click="closeUserMenu">
                Administration
                <template #trailing>⚙</template>
              </AppDropdownMenuItem>

              <AppDropdownMenuItem to="/user" @click="closeUserMenu">
                Mon compte
              </AppDropdownMenuItem>

              <AppDropdownMenuItem to="/mes-chaines" @click="closeUserMenu">
                Mes chaînes
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

        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:hidden"
          :aria-expanded="isMobileMenuOpen"
          aria-haspopup="dialog"
          aria-label="Menu de navigation"
          @click="toggleMobileMenu"
        >
          <svg v-if="!isMobileMenuOpen" viewBox="0 0 24 24" class="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          <svg v-else viewBox="0 0 24 24" class="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile navigation slider -->
    <nav class="mobile-slider flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden" aria-label="Navigation rapide">
      <component
        v-for="item in mobileNavItems"
        :key="item.label"
        :is="item.href.startsWith('/') ? RouterLink : 'a'"
        :to="item.href.startsWith('/') ? item.href : undefined"
        :href="item.href.startsWith('/') ? undefined : item.href"
        class="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-primary/30 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&.router-link-active]:border-primary/40 [&.router-link-active]:text-primary [&.router-link-active]:underline [&.router-link-active]:underline-offset-4"
      >
        <AppNavIcon :kind="item.icon" class="h-[16px] w-[16px]" />
        {{ item.label }}
      </component>
    </nav>

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

  <!-- Mobile menu drawer -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-3"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-3"
    >
      <div
        v-if="isMobileMenuOpen"
        class="fixed inset-0 z-50 flex flex-col bg-white lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
      >
        <!-- Drawer header -->
        <div class="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
          <RouterLink
            :to="currentBrand.to"
            class="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            @click="closeMobileMenu"
          >
            <img :src="currentBrand.logo" :alt="currentBrand.logoAlt" class="h-9 w-9 rounded-xl border border-slate-100 bg-white p-1" />
            <p :class="[currentBrand.wordmarkClass, 'text-lg font-bold uppercase font-mono']">
              {{ currentBrand.prefix }}<span :class="currentBrand.suffixClass">{{ currentBrand.suffix }}</span>
            </p>
          </RouterLink>
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Fermer le menu"
            @click="closeMobileMenu"
          >
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <!-- Nav items -->
        <div class="flex-1 space-y-3 overflow-y-auto p-4">
          <div v-for="item in mobileNavItems" :key="item.label" class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <component
              :is="item.href.startsWith('/') ? RouterLink : 'a'"
              :to="item.href.startsWith('/') ? item.href : undefined"
              :href="item.href.startsWith('/') ? undefined : item.href"
              class="group mb-3 flex items-center gap-3"
              @click="closeMobileMenu"
            >
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
                <AppNavIcon :kind="item.icon" class="h-[20px] w-[20px]" />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold text-slate-900 transition group-hover:text-primary [.router-link-active_&]:text-primary [.router-link-active_&]:underline [.router-link-active_&]:underline-offset-4">{{ item.label }}</span>
                <span class="block text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{{ item.eyebrow }}</span>
              </span>
            </component>
            <div class="flex flex-wrap gap-2">
              <a
                v-for="link in item.links"
                :key="link"
                href="#"
                class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
                @click="closeMobileMenu"
              >
                {{ link }}
              </a>
            </div>
          </div>
        </div>

        <!-- Auth footer -->
        <div class="shrink-0 border-t border-slate-100 p-4">
          <template v-if="authStore.isAuthenticated">
            <div class="mb-4 flex items-center gap-3">
              <AppAvatar :initials="userInitials()" size="sm" />
              <div class="min-w-0 max-w-full flex-1">
                <p class="truncate text-sm font-semibold text-slate-900">{{ authStore.displayName }}</p>
                <p class="truncate text-xs text-slate-500">{{ authStore.user?.email }}</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <RouterLink
                to="/user"
                class="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                @click="closeMobileMenu"
              >
                Mon compte
              </RouterLink>
              <button
                type="button"
                class="flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                :disabled="authStore.isLoggingOut"
                @click="handleLogout"
              >
                {{ authStore.isLoggingOut ? 'Déconnexion...' : 'Se déconnecter' }}
              </button>
            </div>
          </template>
          <template v-else>
            <div class="flex gap-3">
              <AppButton as="router-link" to="/login" variant="outline" size="md" class="flex-1" @click="closeMobileMenu">
                Connexion
              </AppButton>
              <AppButton as="router-link" to="/register" variant="primary" size="md" icon-position="right" class="flex-1" @click="closeMobileMenu">
                Lancez-vous !
                <template #icon>→</template>
              </AppButton>
            </div>
          </template>
          <button
            type="button"
            class="mt-3 flex w-full items-center justify-center gap-1.5 text-xs text-slate-400 transition hover:text-slate-600"
            @click="openAccessibilityPanel"
          >
            <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none">
              <circle cx="12" cy="5" r="2.25" stroke="currentColor" stroke-width="1.8" />
              <path d="M12 8.75V13.5M9 10.5L12 13.5L15 10.5M8 20L10.6 15.25M16 20L13.4 15.25" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Préférences d'accessibilité
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mobile-slider::-webkit-scrollbar {
  display: none;
}
.mobile-slider {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
