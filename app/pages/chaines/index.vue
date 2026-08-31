<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Chaînes éditoriales',
  description:
    "Explorez les chaînes Statsio : rédactions, institutions et analystes indépendants qui publient Statsdata, articles et consultations. Abonnez-vous pour suivre leurs parutions.",
})

import ChannelsListingView from '@/components/channels/ChannelsListingView.vue'
</script>

<template>
  <main>
    <ChannelsListingView />
  </main>
</template>
