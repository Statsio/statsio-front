<script setup lang="ts">
definePageMeta({ layout: 'default' })
import HomePageFrame from '@/components/home/HomePageFrame.vue'
import { articles, heroBullets, heroKpis, highlights, polls, statsData, statsStrip } from '@/data/home-page'
</script>

<template>
  <HomePageFrame
    variant="medistats"
    :hero-bullets="heroBullets"
    :hero-kpis="heroKpis"
    :stats-strip="statsStrip"
    :highlights="highlights"
    :articles="articles"
    :stats-data="statsData"
    :polls="polls"
  />
</template>
