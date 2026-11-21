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
import DsButton from '@/components/ds/DsButton.vue'
import { getBrandFromPath, getBrandSwitcherList, type BrandId } from '@/data/brands'
import { getErrorMessage } from '@/lib/http-errors'
import { useAuthStore } from '@/stores/auth'
import { useClickOutside } from '@/composables/useClickOutside'
import { useSearchTarget } from '@/composables/useSearchTarget'

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
const expandedMobileItem = ref<string | null>(null)

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
  expandedMobileItem.value = null
}

const toggleMobileItem = (label: string) => {
  expandedMobileItem.value = expandedMobileItem.value === label ? null : label
}

// Une page peut porter sa propre grande recherche (hero de l'accueil) : le bouton
// et le raccourci « / » y envoient alors le focus au lieu d'ouvrir la modale, et
// le bouton du header ne s'affiche qu'une fois cette recherche sortie de l'écran.
const { target: searchTarget, targetVisible: searchTargetVisible, focusTarget } = useSearchTarget()
const showHeaderSearch = computed(() => !searchTarget.value || !searchTargetVisible.value)

// Thème de marque pour le drawer téléporté hors du wrapper `.app-shell[data-theme]`.
const brandTheme = computed(() => (currentBrand.value.id === 'statsio' ? undefined : currentBrand.value.id))

const openSearch = () => {
  isMobileMenuOpen.value = false
  isBrandMenuOpen.value = false
  isUserMenuOpen.value = false
  activeMenu.value = null
  if (focusTarget()) return
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
  <header class="ds-scope ds-header fixed inset-x-0 top-12 z-40"
    @mouseleave="activeMenu = null">
    <div class="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-2 px-4 sm:px-6 lg:gap-4 lg:px-10">
      <div ref="brandMenuRef" class="relative flex shrink-0 items-center gap-2">
        <RouterLink :to="currentBrand.to"
          class="ds-header__brand flex items-center gap-2 rounded-[3px] transition hover:opacity-90">
          <img :src="currentBrand.logo" :alt="currentBrand.logoAlt" class="h-8 w-8" />
          <p :class="[currentBrand.wordmarkClass, 'text-[15px] font-extrabold uppercase tracking-[0.08em]']">
            {{ currentBrand.prefix }}<span :class="currentBrand.suffixClass">{{ currentBrand.suffix }}</span>
          </p>
        </RouterLink>

        <button
          type="button"
          class="ds-header__chev inline-flex h-[24px] w-[24px] items-center justify-center rounded-[3px] transition"
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
            class="ds-pop absolute left-0 top-[calc(100%+0.75rem)] z-50 w-[340px] origin-top-left p-4"
            role="menu"
            aria-label="Changer d'univers"
          >
            <p class="ds-pop__label px-2 pb-2.5">
              Changer d'univers
            </p>
            <component
              :is="brand.current ? 'div' : RouterLink"
              v-for="brand in universeBrands"
              :key="brand.id"
              :to="brand.current ? undefined : brand.to"
              class="ds-pop__row group flex cursor-pointer items-center gap-3 p-2.5"
              :class="{ 'is-current': brand.current }"
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
                  <span class="ds-pop__title text-sm font-extrabold tracking-[-0.01em]">{{ brand.name }}</span>
                  <span
                    v-if="brand.current"
                    class="ds-pop__badge px-1.5 py-0.5"
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
                <span class="ds-pop__muted mt-1 block text-xs leading-snug">{{ brand.switcherBlurb }}</span>
              </span>
              <svg
                v-if="!brand.current"
                class="ds-pop__arrow h-4 w-4 shrink-0 transition group-hover:translate-x-0.5"
                viewBox="0 0 20 20" fill="none"
              >
                <path d="M7 10h6m0 0l-2.5-2.5M13 10l-2.5 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
            </component>
          </div>
        </Transition>
      </div>

      <component :is="currentBrandNavComponent" ref="brandNavRef" v-model="activeMenu" />

      <div class="ml-auto flex items-center gap-2 sm:gap-2.5">
        <AppHeaderSearch v-show="showHeaderSearch" @open="openSearch" />

        <AppAccessibilityPanel ref="accessibilityPanelRef" />

        <template v-if="authStore.isAuthenticated">
          <div ref="userMenuRef" class="relative">
            <button type="button"
              class="ds-header__user flex items-center gap-1.5 rounded-full p-1 transition"
              :aria-expanded="isUserMenuOpen" aria-haspopup="menu" aria-label="Mon compte" @click="toggleUserMenu">
              <AppAvatar :src="authStore.user?.profile?.avatar ?? undefined" :initials="userInitials()" size="sm" />
              <svg viewBox="0 0 20 20" class="ds-header__muted h-3.5 w-3.5 shrink-0 transition"
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
                class="ds-pop absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[248px] origin-top-right p-2.5"
                role="menu"
                aria-label="Menu utilisateur"
              >
                <div class="ds-pop__head mb-1.5 flex items-center gap-2.5 px-2 pb-2.5">
                  <AppAvatar
                    :src="authStore.user?.profile?.avatar ?? undefined"
                    :initials="userInitials()"
                    size="sm"
                    background="var(--studio-gradient)"
                  />
                  <span class="min-w-0">
                    <span class="ds-pop__title block truncate text-[13px] font-bold">{{ authStore.displayName }}</span>
                    <span
                      v-if="authStore.user?.email && authStore.user.email !== authStore.displayName"
                      class="ds-pop__muted block truncate text-[10.5px] [font-family:var(--ds-num)]"
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
                  class="ds-pop__item block px-2.5 py-2 text-[13px] font-semibold"
                  @click="closeUserMenu"
                >
                  Administration
                </a>

                <RouterLink
                  v-for="link in userMenuLinks"
                  :key="link.to"
                  :to="link.to"
                  role="menuitem"
                  class="ds-pop__item block px-2.5 py-2 text-[13px] font-semibold"
                  @click="closeUserMenu"
                >
                  {{ link.label }}
                </RouterLink>

                <div class="ds-pop__sep my-1.5 h-[2px]"></div>

                <button
                  type="button"
                  role="menuitem"
                  class="ds-pop__item ds-pop__item--danger block w-full px-2.5 py-2 text-left text-[13px] font-semibold disabled:opacity-60"
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
            class="ds-header__icon-btn inline-flex h-10 w-10 items-center justify-center rounded-[3px] transition md:hidden"
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

          <div class="hidden shrink-0 items-center gap-4 md:flex">
            <RouterLink to="/login" class="ds-header__login whitespace-nowrap">Se connecter</RouterLink>
            <DsButton to="/register" size="sm">Créer un compte</DsButton>
          </div>
        </template>

        <button
          type="button"
          class="ds-header__icon-btn inline-flex h-10 w-10 items-center justify-center rounded-[3px] transition lg:hidden"
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
    <nav class="mobile-slider ds-header__slider flex h-12 items-center gap-2 overflow-x-auto px-4 lg:hidden" aria-label="Navigation rapide">
      <component
        v-for="item in mobileNavItems"
        :key="item.label"
        :is="item.href.startsWith('/') ? RouterLink : 'a'"
        :to="item.href.startsWith('/') ? item.href : undefined"
        :href="item.href.startsWith('/') ? undefined : item.href"
        class="ds-header__pill flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition"
      >
        <AppNavIcon :kind="item.icon" class="h-[16px] w-[16px]" />
        {{ item.label }}
      </component>
    </nav>

    <div v-if="logoutError" class="mx-auto w-full max-w-[1800px] px-4 pt-3 sm:px-6 lg:px-10">
      <div class="rounded-[4px] border-2 border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {{ logoutError }}
      </div>
    </div>

    <div v-if="activeMenu"
      class="ds-header__mega absolute left-0 top-full z-30 w-full"
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
        class="ds-scope ds-drawer fixed inset-0 z-50 flex flex-col lg:hidden"
        :data-theme="brandTheme"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
      >
        <!-- Drawer header -->
        <div class="ds-drawer__head flex h-16 shrink-0 items-center justify-between px-4">
          <RouterLink
            :to="currentBrand.to"
            class="flex items-center gap-2 rounded-[3px]"
            @click="closeMobileMenu"
          >
            <img :src="currentBrand.logo" :alt="currentBrand.logoAlt" class="h-8 w-8" />
            <p :class="[currentBrand.wordmarkClass, 'text-[15px] font-extrabold uppercase tracking-[0.08em]']">
              {{ currentBrand.prefix }}<span :class="currentBrand.suffixClass">{{ currentBrand.suffix }}</span>
            </p>
          </RouterLink>
          <button
            type="button"
            class="ds-header__icon-btn inline-flex h-10 w-10 items-center justify-center rounded-[3px] transition"
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

          <div v-for="item in mobileNavItems" :key="item.label" class="ds-drawer__card overflow-hidden">
            <div class="flex items-center gap-3 p-4">
              <component
                :is="item.href.startsWith('/') ? RouterLink : 'a'"
                :to="item.href.startsWith('/') ? item.href : undefined"
                :href="item.href.startsWith('/') ? undefined : item.href"
                class="group flex min-w-0 flex-1 items-center gap-3"
                @click="closeMobileMenu"
              >
                <span class="ds-drawer__icon flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px]">
                  <AppNavIcon :kind="item.icon" class="h-[20px] w-[20px]" />
                </span>
                <span class="min-w-0">
                  <span class="ds-drawer__title block text-[15px] font-bold transition">{{ item.label }}</span>
                  <span class="ds-drawer__eyebrow block">{{ item.eyebrow }}</span>
                </span>
              </component>
              <button
                type="button"
                class="ds-header__icon-btn inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] transition"
                :aria-expanded="expandedMobileItem === item.label"
                :aria-label="`Afficher le sous-menu ${item.label}`"
                @click="toggleMobileItem(item.label)"
              >
                <svg viewBox="0 0 20 20" class="h-4 w-4 shrink-0 transition"
                  :class="expandedMobileItem === item.label ? 'rotate-180' : ''" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </button>
            </div>
            <Transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div
                v-if="expandedMobileItem === item.label"
                class="ds-drawer__sub cursor-pointer px-3 py-4"
                @click="closeMobileMenu"
              >
                <AppHeaderMegaMenu :item="item" dense />
              </div>
            </Transition>
          </div>
        </div>

        <!-- Auth footer -->
        <div class="ds-drawer__foot shrink-0 p-4">
          <template v-if="authStore.isAuthenticated">
            <div class="mb-4 flex items-center gap-3">
              <AppAvatar :initials="userInitials()" size="sm" />
              <div class="min-w-0 max-w-full flex-1">
                <p class="ds-drawer__title truncate text-sm font-bold">{{ authStore.displayName }}</p>
                <p class="ds-drawer__eyebrow truncate">{{ authStore.user?.email }}</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <DsButton to="/user" variant="secondary" block @click="closeMobileMenu">Mon compte</DsButton>
              <DsButton variant="secondary" block :disabled="authStore.isLoggingOut" class="ds-drawer__logout" @click="handleLogout">
                {{ authStore.isLoggingOut ? 'Déconnexion…' : 'Se déconnecter' }}
              </DsButton>
            </div>
          </template>
          <template v-else>
            <div class="flex gap-3">
              <DsButton to="/login" variant="secondary" class="flex-1" @click="closeMobileMenu">Se connecter</DsButton>
              <DsButton to="/register" class="flex-1" @click="closeMobileMenu">Créer un compte</DsButton>
            </div>
          </template>
          <button
            type="button"
            class="ds-drawer__eyebrow mt-4 flex w-full items-center justify-center gap-1.5 transition hover:opacity-80"
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
/* ─── Header Bold Outline (charte Tranches) ─────────────────────────────── */
.ds-header {
  border-bottom: 2px solid var(--ds-ol);
  background: color-mix(in srgb, var(--ds-bg) 94%, transparent);
  color: var(--ds-text);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  font-family: var(--ds-ui);
}
.ds-header__brand:focus-visible,
.ds-header :focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 3px;
}
.ds-header__chev {
  border: 2px solid var(--ds-divide);
  color: var(--ds-link);
  background: var(--ds-surface);
}
.ds-header__chev:hover,
.ds-header__chev[aria-expanded='true'] {
  border-color: var(--ds-ol);
}
.ds-header__login {
  color: var(--ds-link);
  font-size: 14.5px;
  font-weight: 700;
}
.ds-header__login:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}
.ds-header__icon-btn {
  border: 2px solid var(--ds-ol);
  background: var(--ds-surface);
  color: var(--ds-ol);
}
.ds-header__icon-btn:hover {
  background: var(--ds-tint);
}
.ds-header__user:hover {
  background: var(--ds-tint);
}
.ds-header__muted {
  color: var(--ds-muted);
}
.ds-header__slider {
  border-top: 2px solid var(--ds-divide);
}
.ds-header__pill {
  border: 2px solid var(--ds-divide);
  background: var(--ds-surface);
  color: var(--ds-muted);
}
.ds-header__pill:hover {
  border-color: var(--ds-ol);
  color: var(--ds-text);
}
.ds-header__pill.router-link-active {
  border-color: var(--ds-ol);
  background: var(--ds-tint);
  color: var(--ds-link);
}
.ds-header__mega {
  border-bottom: 2px solid var(--ds-ol);
  background: var(--ds-surface);
  box-shadow: 0 6px 0 var(--ds-tint);
}

/* ─── Drawer mobile ─────────────────────────────────────────────────────── */
.ds-drawer {
  background: var(--ds-bg);
  color: var(--ds-text);
  font-family: var(--ds-ui);
}
.ds-drawer__head {
  border-bottom: 2px solid var(--ds-ol);
}
.ds-drawer__card {
  border: 2px solid var(--ds-ol);
  border-radius: 6px;
  background: var(--ds-surface);
  box-shadow: 3px 3px 0 var(--ds-sh);
}
.ds-drawer__icon {
  border: 2px solid var(--ds-divide);
  background: var(--ds-tint);
}
.ds-drawer__title {
  color: var(--ds-text);
}
.group:hover .ds-drawer__title,
.router-link-active .ds-drawer__title {
  color: var(--ds-link);
}
.ds-drawer__eyebrow {
  color: var(--ds-muted);
  font: 500 10.5px/1.4 var(--ds-num);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.ds-drawer__sub {
  border-top: 2px solid var(--ds-divide);
  background: var(--ds-surface);
}
.ds-drawer__foot {
  border-top: 2px solid var(--ds-ol);
}
.ds-drawer__logout {
  color: #be123c;
}

.mobile-slider::-webkit-scrollbar {
  display: none;
}
.mobile-slider {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
