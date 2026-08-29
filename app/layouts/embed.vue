<script setup lang="ts">
/**
 * Layout minimal pour les pages intégrées en `<iframe>` (`/embed/**`) : aucune
 * navigation ni pied de page, juste le contenu + un lien retour discret.
 */
usePageSeo({ robots: 'noindex,follow' })
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900">
    <main id="main-content" class="px-3 py-3 sm:px-5 sm:py-5">
      <slot />
    </main>
  </div>
</template>
