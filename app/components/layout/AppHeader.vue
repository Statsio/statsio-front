<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppAccessibilityPanel from '@/components/layout/AppAccessibilityPanel.vue'
import AppHeaderMegaMenu from '@/components/layout/AppHeaderMegaMenu.vue'
import AppHeaderSearch from '@/components/layout/AppHeaderSearch.vue'
import AppSearchModal from '@/components/layout/AppSearchModal.vue'
import type { HeaderNavItem } from '@/components/layout/brands/header-nav.types'
import StatsioAppHeaderNav from '@/components/layout/brands/statsio/AppHeaderNav.vue'
import TvstatsAppHeaderNav from '@/components/layout/brands/tvstats/AppHeaderNav.vue'
import MedistatsAppHeaderNav from '@/components/layout/brands/medistats/AppHeaderNav.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { getBrandFromPath, getBrandSwitcherList, type BrandId } from '@/data/brands'
import { getErrorMessage } from '@/lib/http-errors'
import { useAuthStore } from '@/stores/auth'
import { useClickOutside } from '@/composables/useClickOutside'

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
const isSearchOpen = ref(false)

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const adminUrl = useRuntimeConfig().public.adminUrl

const currentBrand = computed(() => getBrandFromPath(route.path))
const universeBrands = computed(() =>
  getBrandSwitcherList().map((brand) => ({
    ...brand,
    current: brand.id === currentBrand.value.id,
  })),
)
const brandNavComponentById: Record<BrandId, Component> = {
  statsio: StatsioAppHeaderNav,
  tvstats: TvstatsAppHeaderNav,
  medistats: MedistatsAppHeaderNav,
}
const currentBrandNavComponent = computed(() => brandNavComponentById[currentBrand.value.id as BrandId])

const userMenuLinks: { to: string; label: string }[] = [
  { to: '/user', label: 'Mon compte' },
  { to: '/user/chaines', label: 'Mes chaînes' },
  { to: '/user/contenus', label: 'Mes contenus' },
  { to: '/user/parametres', label: 'Paramètres' },
]

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

const openSearch = () => {
  isMobileMenuOpen.value = false
  isBrandMenuOpen.value = false
  isUserMenuOpen.value = false
  activeMenu.value = null
  isSearchOpen.value = true
}

const isTypingTarget = (target: EventTarget | null) => {
  const el = target as HTMLElement | null
  if (!el) return false
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable
}

const handleSearchShortcut = (event: KeyboardEvent) => {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
  if (isSearchOpen.value || isTypingTarget(event.target)) return
  event.preventDefault()
  openSearch()
}

onMounted(() => {
  document.addEventListener('keydown', handleSearchShortcut)
})

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
  document.removeEventListener('keydown', handleSearchShortcut)
})
</script>

<template>
  <header class="fixed inset-x-0 top-14 z-40 border-b border-slate-200 bg-white"
    @mouseleave="activeMenu = null">
    <div class="container flex h-14 items-center gap-2">
      <div ref="brandMenuRef" class="relative flex shrink-0 items-center gap-2">
        <RouterLink :to="currentBrand.to"
          class="flex items-center gap-2 rounded-lg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35">
          <img :src="currentBrand.logo" :alt="currentBrand.logoAlt" class="h-8 w-8" />
          <p :class="[currentBrand.wordmarkClass, 'text-[15px] font-extrabold uppercase tracking-[0.08em]']">
            {{ currentBrand.prefix }}<span :class="currentBrand.suffixClass">{{ currentBrand.suffix }}</span>
          </p>
        </RouterLink>

        <button
          type="button"
          class="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px] border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          :aria-expanded="isBrandMenuOpen"
          aria-haspopup="menu"
          aria-label="Changer d'univers"
          @click="toggleBrandMenu"
        >
          <svg
            viewBox="0 0 20 20"
            class="h-2.5 w-2.5 shrink-0 transition"
            :class="isBrandMenuOpen ? 'rotate-180' : ''"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              stroke-width="2.4"
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
            class="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[340px] origin-top-left rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_44px_rgba(24,20,40,0.16)]"
            role="menu"
            aria-label="Changer d'univers"
          >
            <p class="px-2 pb-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
              Changer d'univers
            </p>
            <component
              :is="brand.current ? 'div' : RouterLink"
              v-for="brand in universeBrands"
              :key="brand.id"
              :to="brand.current ? undefined : brand.to"
              class="group flex items-center gap-3 rounded-xl p-2.5 transition"
              :class="brand.current ? 'bg-slate-50' : 'hover:bg-slate-50'"
              :role="brand.current ? undefined : 'menuitem'"
              :aria-current="brand.current ? 'true' : undefined"
              @click="brand.current || closeBrandMenu()"
            >
              <span
                class="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl"
                :class="brand.switcherIconClass"
              >
                <img :src="brand.logo" :alt="brand.name" class="h-[22px] w-[22px]" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="flex items-center gap-2">
                  <span class="text-sm font-extrabold tracking-[-0.01em] text-slate-900">{{ brand.name }}</span>
                  <span
                    v-if="brand.current"
                    class="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[8.5px] font-semibold uppercase tracking-[0.06em] text-primary"
                  >
                    Actuel
                  </span>
                </span>
                <span
                  class="mt-0.5 block font-mono text-[9.5px] font-semibold uppercase tracking-[0.07em]"
                  :class="brand.switcherTagClass"
                >
                  {{ brand.switcherTagline }}
                </span>
                <span class="mt-1 block text-xs leading-snug text-slate-500">{{ brand.switcherBlurb }}</span>
              </span>
              <svg
                v-if="!brand.current"
                class="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
                viewBox="0 0 20 20" fill="none"
              >
                <path d="M7 10h6m0 0l-2.5-2.5M13 10l-2.5 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
            </component>
          </div>
        </Transition>
      </div>

      <component :is="currentBrandNavComponent" ref="brandNavRef" v-model="activeMenu" />

      <div class="flex-1"></div>

      <div class="flex items-center gap-2 sm:gap-2.5">
        <AppHeaderSearch @open="openSearch" />

        <AppAccessibilityPanel ref="accessibilityPanelRef" />

        <template v-if="authStore.isAuthenticated">
          <div ref="userMenuRef" class="relative">
            <button type="button"
              class="flex items-center gap-1.5 rounded-full p-1 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              :aria-expanded="isUserMenuOpen" aria-haspopup="menu" aria-label="Mon compte" @click="toggleUserMenu">
              <AppAvatar :src="authStore.user?.profile?.avatar ?? undefined" :initials="userInitials()" size="sm" />
              <svg viewBox="0 0 20 20" class="h-3.5 w-3.5 shrink-0 text-slate-400 transition"
                :class="isUserMenuOpen ? 'rotate-180' : ''" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
                  stroke-linejoin="round" />
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
                v-if="isUserMenuOpen"
                class="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[248px] origin-top-right rounded-2xl border border-slate-200 bg-white p-2.5 shadow-[0_20px_44px_rgba(24,20,40,0.16)]"
                role="menu"
                aria-label="Menu utilisateur"
              >
                <div class="mb-1.5 flex items-center gap-2.5 border-b border-slate-100 px-2 pb-2.5">
                  <AppAvatar
                    :src="authStore.user?.profile?.avatar ?? undefined"
                    :initials="userInitials()"
                    size="sm"
                    background="var(--studio-gradient)"
                  />
                  <span class="min-w-0">
                    <span class="block truncate text-[13px] font-bold text-slate-900">{{ authStore.displayName }}</span>
                    <span
                      v-if="authStore.user?.email && authStore.user.email !== authStore.displayName"
                      class="block truncate font-mono text-[10px] text-slate-400"
                    >
                      {{ authStore.user.email }}
                    </span>
                  </span>
                </div>

                <a
                  v-if="authStore.isAdmin"
                  :href="adminUrl"
                  target="_blank"
                  rel="noopener"
                  role="menuitem"
                  class="block rounded-lg px-2.5 py-2 text-[13px] font-semibold text-slate-800 transition hover:bg-slate-50 hover:text-primary"
                  @click="closeUserMenu"
                >
                  Administration
                </a>

                <RouterLink
                  v-for="link in userMenuLinks"
                  :key="link.to"
                  :to="link.to"
                  role="menuitem"
                  class="block rounded-lg px-2.5 py-2 text-[13px] font-semibold text-slate-800 transition hover:bg-slate-50 hover:text-primary [&.router-link-active]:text-primary"
                  @click="closeUserMenu"
                >
                  {{ link.label }}
                </RouterLink>

                <div class="my-1.5 h-px bg-slate-100"></div>

                <button
                  type="button"
                  role="menuitem"
                  class="block w-full rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                  :disabled="authStore.isLoggingOut"
                  @click="handleLogout"
                >
                  {{ authStore.isLoggingOut ? 'Déconnexion…' : 'Se déconnecter' }}
                </button>
              </div>
            </Transition>
          </div>
        </template>
        <template v-else>
          <RouterLink
            to="/login"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full text-white studio-gradient transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:hidden"
            aria-label="Connexion"
          >
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 12C14.4853 12 16.5 9.98528 16.5 7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5C7.5 9.98528 9.51472 12 12 12Z"
                stroke="currentColor" stroke-width="1.8" />
              <path d="M4.5 20.25C4.5 16.9363 7.85786 14.25 12 14.25C16.1421 14.25 19.5 16.9363 19.5 20.25"
                stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </RouterLink>

          <div class="hidden shrink-0 items-center gap-1.5 md:flex">
            <RouterLink
              to="/login"
              class="whitespace-nowrap rounded-full px-3 py-2 text-[12.5px] font-bold text-slate-900 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Se connecter
            </RouterLink>
            <RouterLink
              to="/register"
              class="studio-gradient whitespace-nowrap rounded-full px-3.5 py-2 text-[12.5px] font-extrabold tracking-[0.02em] text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Créer un compte
            </RouterLink>
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
      class="absolute left-0 top-full z-30 w-full border-y border-slate-200 bg-white shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)]"
      @mouseenter="activeMenu = activeMenu">
      <AppHeaderMegaMenu :item="activeMenu" />
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
          <AppHeaderSearch layout="block" @open="openSearch" />

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
                Se connecter
              </AppButton>
              <AppButton
                as="router-link"
                to="/register"
                variant="primary"
                size="md"
                class="flex-1 studio-gradient"
                @click="closeMobileMenu"
              >
                Créer un compte
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

  <AppSearchModal v-model:open="isSearchOpen" />
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
