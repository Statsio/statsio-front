<script setup lang="ts">
// Route unique pour toute la page publique d'un Statsdata :
//   /statsdata/{slug}                       → page par défaut
//   /statsdata/{slug}/{pageSlug|valeur}     → onglet ou valeur fan-out (URL courte)
//   /statsdata/{slug}/{pageSlug}/{valeur}   → valeur fan-out scoped
// Une seule route + une clé par document : choisir / réinitialiser une valeur de
// recherche (ou changer d'onglet) met à jour l'URL sans remonter la vue ni
// recharger le document — `useStatsDataDetail` réagit aux segments.
definePageMeta({
  layout: 'default',
  path: '/statsdata/:slug/:pageSlug?/:fanOut?',
  key: (route) => `statsdata-${String(route.params.slug ?? '')}`,
  // Même document : pas de scroll auto (la vue gère le retour en haut au changement d'onglet).
  scrollToTop: (to, from) => to.params.slug !== from.params.slug,
})
</script>

<template>
  <StatsDataDetailView />
</template>
