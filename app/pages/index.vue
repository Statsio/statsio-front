<script setup lang="ts">
definePageMeta({
  layout: 'default',
  description: "Analysez les données qui font l'actualité. Articles, sondages, audiences TV et StatsData en temps réel.",
})
import HomePageFrame from '@/components/home/HomePageFrame.vue'
import { articles, heroBullets, heroKpis, highlights, polls, statsData, statsStrip } from '@/data/home-page'
</script>

<template>
  <HomePageFrame
    :hero-bullets="heroBullets"
    :hero-kpis="heroKpis"
    :stats-strip="statsStrip"
    :highlights="highlights"
    :articles="articles"
    :stats-data="statsData"
    :polls="polls"
  />
</template>
