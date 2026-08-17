<script setup lang="ts">
definePageMeta({ layout: 'channel-dashboard', middleware: ['auth'], ssr: false, robots: 'noindex,nofollow' })
import { useRoute } from 'vue-router'

const route = useRoute()
await navigateTo({ path: `/channels/${route.params.id}/dashboard/parametres`, query: { tab: 'confidentialite' } }, { replace: true })
</script>

<template>
  <div />
</template>
