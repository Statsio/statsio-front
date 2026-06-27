<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'TVStats — Audiences & Programme TV',
  description: 'Le tableau de bord TV de référence : audiences Médiamétrie en temps réel, programme TV complet et analyses des chaînes de la TNT française.',
})
import HomePageFrame from '@/components/home/HomePageFrame.vue'
import { articles, heroBullets, heroKpis, highlights, polls, statsData, statsStrip } from '@/data/home-page'
</script>

<template>
  <HomePageFrame
    variant="tvstats"
    :hero-bullets="heroBullets"
    :hero-kpis="heroKpis"
    :stats-strip="statsStrip"
    :highlights="highlights"
    :articles="articles"
    :stats-data="statsData"
    :polls="polls"
  />
</template>
