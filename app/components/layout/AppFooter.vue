<script setup lang="ts">
import { RouterLink } from 'vue-router'

const openCookieBanner = useCookieBanner()
</script>

<template>
  <footer class="border-t border-slate-200 bg-white/70">
    <div class="container grid gap-8 py-12 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <img src="@/assets/brand/statsio-logo.svg" alt="Statsio" class="h-9 w-9" />
          <p class="text-lg font-semibold text-slate-900">Statsio</p>
        </div>
        <p class="text-sm text-slate-500">
          La plateforme française qui transforme les statistiques en histoires et en décisions.
        </p>
      </div>
      <div class="space-y-2 text-sm text-slate-500">
        <p class="eyebrow text-slate-400">Produits</p>
        <RouterLink class="block hover:text-slate-700" to="/articles">Articles</RouterLink>
        <RouterLink class="block hover:text-slate-700" to="/statsdata">StatsData</RouterLink>
        <a class="block hover:text-slate-700" href="#">Sondages</a>
      </div>
      <div class="space-y-2 text-sm text-slate-500">
        <p class="eyebrow text-slate-400">Éditeurs</p>
        <RouterLink class="block hover:text-slate-700" to="/chaines">Chaînes pro</RouterLink>
        <a class="block hover:text-slate-700" href="#">Studio data</a>
        <a class="block hover:text-slate-700" href="#">API partenaires</a>
      </div>
      <div class="space-y-2 text-sm text-slate-500">
        <p class="eyebrow text-slate-400">Ressources</p>
        <a class="block hover:text-slate-700" href="#">Guides</a>
        <a class="block hover:text-slate-700" href="#">Centre d'aide</a>
        <a class="block hover:text-slate-700" href="#">Contact</a>
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
