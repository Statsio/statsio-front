<script setup lang="ts">
definePageMeta({ layout: 'studio', middleware: ['guest'], ssr: false, title: 'Connexion', robots: 'noindex,nofollow' })
</script>

<template>
  <AuthShell>
    <LoginFormCard />
  </AuthShell>
</template>
