<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'TVStats — Audiences & Programme TV',
  description: 'Le tableau de bord TV de référence : audiences Médiamétrie en temps réel, programme TV complet et analyses des chaînes de la TNT française.',
})
import TvstatsHome from '@/components/home/tvstats/TvstatsHome.vue'
</script>

<template>
  <TvstatsHome />
</template>
