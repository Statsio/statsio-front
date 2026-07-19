<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getBrandFromPath } from '@/data/brands'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const openCookieBanner = useCookieBanner()

const route = useRoute()
const currentBrand = computed(() => getBrandFromPath(route.path))

const statsioInvite = computed(() => {
  if (currentBrand.value.id === 'statsio') return null
  return currentBrand.value.switchMenu.find((brand) => brand.id === 'statsio') ?? null
})

const accountNav = computed(() => {
  if (auth.isAuthenticated) {
    return [
      { label: 'Mon profil', href: '/user' },
      { label: 'Mes contenus', href: '/contenus' },
      { label: 'Mes chaînes', href: '/mes-chaines' },
    ]
  }
  return [
    { label: 'Me connecter', href: '/login' },
    { label: "M'inscrire", href: '/register' },
  ]
})

const aboutNav = [
  { label: 'Présentation Statsio', href: '/about' },
  { label: "Centre d'aide", href: '#' },
  { label: 'Contact', href: '/contact' },
]
</script>

<template>
  <footer class="border-t border-slate-200 bg-white/70">
    <div v-if="statsioInvite" class="container pt-10">
      <RouterLink
        :to="statsioInvite.to"
        class="group flex flex-col gap-4 rounded-2xl border p-6 transition hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
        :class="statsioInvite.accentClass"
      >
        <div class="flex items-center gap-4">
          <img :src="statsioInvite.logo" :alt="statsioInvite.name" class="h-10 w-10 shrink-0" />
          <div>
            <p class="eyebrow text-slate-400">{{ statsioInvite.eyebrow }}</p>
            <p class="text-base font-semibold text-slate-900">Retrouvez tout l'écosystème Statsio</p>
            <p class="text-sm text-slate-500">{{ statsioInvite.description }}</p>
          </div>
        </div>
        <span
          class="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition group-hover:gap-3 sm:self-auto"
        >
          Découvrir Statsio
          <span aria-hidden="true" class="transition group-hover:translate-x-0.5">→</span>
        </span>
      </RouterLink>
    </div>

    <div class="container grid gap-8 py-12 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <img :src="currentBrand.logo" :alt="currentBrand.logoAlt" class="h-9 w-9" />
          <p class="text-lg font-semibold text-slate-900">{{ currentBrand.name }}</p>
        </div>
        <p class="text-sm text-slate-500">{{ currentBrand.footerTagline }}</p>
      </div>
      <div class="space-y-2 text-sm text-slate-500">
        <p class="eyebrow text-slate-400">Navigation</p>
        <RouterLink
          v-for="item in currentBrand.footerNav"
          :key="item.label"
          class="block hover:text-primary"
          :to="item.href"
        >
          {{ item.label }}
        </RouterLink>
      </div>
      <div class="space-y-2 text-sm text-slate-500">
        <p class="eyebrow text-slate-400">Mon compte</p>
        <RouterLink
          v-for="item in accountNav"
          :key="item.label"
          class="block hover:text-primary"
          :to="item.href"
        >
          {{ item.label }}
        </RouterLink>
      </div>
      <div class="space-y-2 text-sm text-slate-500">
        <p class="eyebrow text-slate-400">À propos</p>
        <component
          :is="item.href.startsWith('/') ? RouterLink : 'a'"
          v-for="item in aboutNav"
          :key="item.label"
          class="block hover:text-primary"
          :to="item.href.startsWith('/') ? item.href : undefined"
          :href="item.href.startsWith('/') ? undefined : item.href"
        >
          {{ item.label }}
        </component>
      </div>
    </div>
    <div class="container flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-4">
      <p class="text-[0.8125rem] text-slate-400">© {{ new Date().getFullYear() }} Statsio</p>
      <div class="flex flex-wrap gap-4 text-[0.8125rem] text-slate-400">
        <RouterLink to="/politique-de-confidentialite" class="hover:text-slate-600 transition-colors">
          Politique de confidentialité
        </RouterLink>
        <button
          class="hover:text-slate-600 transition-colors"
          @click="openCookieBanner = true"
        >
          Gérer les cookies
        </button>
      </div>
    </div>
  </footer>
</template>
