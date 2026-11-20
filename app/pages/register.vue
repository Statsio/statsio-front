<script setup lang="ts">
definePageMeta({ layout: 'studio', middleware: ['guest'], ssr: false, title: 'Inscription', robots: 'noindex,nofollow' })
</script>

<template>
  <AuthShell
    eyebrow="Rejoindre Statsio"
    eyebrow-accent="gratuit"
    :title="[{ text: 'Rejoignez celles et ceux qui ' }, { text: 'décryptent', em: true }, { text: ' les données.' }]"
    description="Ouvrez votre compte pour explorer les datasets, suivre vos sujets et partager vos propres analyses."
  >
    <RegisterFormCard />
  </AuthShell>
</template>
