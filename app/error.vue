<script setup lang="ts">
import type { NuxtError } from '#app'
import AppButton from '@/components/ui/AppButton.vue'
import AppWordmark from '@/components/ui/AppWordmark.vue'
import { getBrandFromPath } from '@/data/brands'

const props = defineProps<{
  error: NuxtError
}>()

const statusCode = computed(() => props.error?.statusCode ?? 500)
const isProduction = useRuntimeConfig().public.appEnv === 'production'

const route = useRoute()
const currentBrand = computed(() => getBrandFromPath(route.path || ''))
const appTheme = computed(() => (currentBrand.value.id === 'statsio' ? undefined : currentBrand.value.id))

const goHome = () => clearError({ redirect: currentBrand.value.to })
const goLogin = () => clearError({ redirect: '/login' })
const goBrandContent = () => clearError({ redirect: currentBrand.value.footerNav[0]?.href ?? currentBrand.value.to })
const retry = () => {
  if (import.meta.client) window.location.reload()
}

interface ErrorContent {
  code: string
  eyebrow: string
  title: string
  description: string
  primaryLabel: string
  primaryAction: () => void
  secondaryLabel: string
  secondaryAction: () => void
}

const content = computed<ErrorContent>(() => {
  switch (statusCode.value) {
    case 404:
      return {
        code: '404',
        eyebrow: 'Erreur 404',
        title: 'Page introuvable',
        description:
          'Cette page n’existe pas, a été déplacée ou renommée. Vérifiez l’adresse ou repartez depuis l’accueil.',
        primaryLabel: 'Retour à l’accueil',
        primaryAction: goHome,
        secondaryLabel: currentBrand.value.footerNav[0]?.label ?? 'Voir les articles',
        secondaryAction: goBrandContent,
      }
    case 401:
      return {
        code: '401',
        eyebrow: 'Erreur 401',
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour accéder à cette page.',
        primaryLabel: 'Se connecter',
        primaryAction: goLogin,
        secondaryLabel: 'Retour à l’accueil',
        secondaryAction: goHome,
      }
    case 403:
      return {
        code: '403',
        eyebrow: 'Erreur 403',
        title: 'Accès refusé',
        description: 'Vous n’avez pas les droits nécessaires pour consulter cette page.',
        primaryLabel: 'Retour à l’accueil',
        primaryAction: goHome,
        secondaryLabel: 'Se connecter avec un autre compte',
        secondaryAction: goLogin,
      }
    case 503:
      return {
        code: '503',
        eyebrow: 'Erreur 503',
        title: 'Service temporairement indisponible',
        description:
          'Statsio est en maintenance ou rencontre une forte affluence. Merci de réessayer dans quelques instants.',
        primaryLabel: 'Réessayer',
        primaryAction: retry,
        secondaryLabel: 'Retour à l’accueil',
        secondaryAction: goHome,
      }
    case 500:
    default:
      return {
        code: statusCode.value >= 400 ? String(statusCode.value) : '500',
        eyebrow: `Erreur ${statusCode.value >= 400 ? statusCode.value : 500}`,
        title: 'Une erreur est survenue',
        description:
          'Un problème inattendu s’est produit de notre côté. Nos équipes ont été notifiées, réessayez dans un instant.',
        primaryLabel: 'Réessayer',
        primaryAction: retry,
        secondaryLabel: 'Retour à l’accueil',
        secondaryAction: goHome,
      }
  }
})

const quickLinks = computed(() => currentBrand.value.footerNav)

useHead({
  title: () => `${content.value.title} · ${currentBrand.value.name}`,
})
</script>

<template>
  <div
    :data-theme="appTheme"
    class="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_16%,#eef4ff_100%)] text-slate-900"
  >
    <!-- Radial glow -->
    <div
      class="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-[var(--color-primary)]/[0.08] blur-3xl"
      aria-hidden="true"
    />
    <!-- Dot grid overlay -->
    <div
      class="pointer-events-none absolute inset-0"
      style="background-image: radial-gradient(circle, color-mix(in srgb, var(--color-primary) 8%, transparent) 1px, transparent 1px); background-size: 28px 28px;"
      aria-hidden="true"
    />

    <div class="container relative flex min-h-screen flex-col py-8 sm:py-10">
      <!-- Mini header -->
      <header class="flex items-center justify-between">
        <NuxtLink :to="currentBrand.to" class="flex items-center gap-3" @click.prevent="goHome">
          <img
            :src="currentBrand.logo"
            :alt="currentBrand.logoAlt"
            class="h-10 w-10 rounded-2xl bg-[var(--color-primary)]/10 p-1.5"
          />
          <AppWordmark
            as="p"
            class="text-lg tracking-[0.2em]"
            :prefix="currentBrand.prefix"
            :suffix="currentBrand.suffix"
          />
        </NuxtLink>
        <span class="badge">
          <span class="h-1.5 w-1.5 rounded-full bg-[var(--color-error)]" aria-hidden="true" />
          {{ content.eyebrow }}
        </span>
      </header>

      <!-- Main content -->
      <main class="flex flex-1 flex-col items-center justify-center py-16 text-center" role="alert">
        <p class="mono text-gradient text-[6rem] font-bold leading-none sm:text-[8rem]">
          {{ content.code }}
        </p>

        <h1 class="mt-6 max-w-xl text-3xl font-semibold text-slate-950 sm:text-4xl">
          {{ content.title }}
        </h1>
        <p class="mt-4 max-w-md text-base leading-7 text-slate-600">
          {{ content.description }}
        </p>

        <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
          <AppButton size="lg" @click="content.primaryAction">{{ content.primaryLabel }}</AppButton>
          <AppButton variant="secondary" size="lg" @click="content.secondaryAction">
            {{ content.secondaryLabel }}
          </AppButton>
        </div>

        <p v-if="error?.message && !isProduction" class="mono mt-8 max-w-lg text-xs text-slate-400">
          {{ error.message }}
        </p>

        <!-- Quick links -->
        <div class="panel mt-14 w-full max-w-xl rounded-2xl px-6 py-5">
          <p class="eyebrow mb-4">Continuer sur {{ currentBrand.name }}</p>
          <div class="flex flex-wrap justify-center gap-2">
            <NuxtLink
              v-for="link in quickLinks"
              :key="link.href"
              :to="link.href"
              class="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              @click.prevent="clearError({ redirect: link.href })"
            >
              {{ link.label }}
            </NuxtLink>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="flex items-center justify-center border-t border-slate-100 pt-6 text-xs text-slate-400">
        © {{ new Date().getFullYear() }} Statsio. Tous droits réservés.
      </footer>
    </div>
  </div>
</template>
