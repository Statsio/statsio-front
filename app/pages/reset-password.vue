<script setup lang="ts">
definePageMeta({ layout: 'studio', middleware: ['guest'], ssr: false, title: 'Réinitialiser le mot de passe', robots: 'noindex,nofollow' })

const resetSignals = [
  {
    label: 'récupération',
    value: 'Quelques minutes',
    detail: 'choisissez un nouveau mot de passe et reprenez l\'accès à votre compte',
  },
  {
    label: 'sécurité',
    value: 'Sessions révoquées',
    detail: 'vos anciennes sessions sont fermées après la mise à jour',
  },
]
</script>

<template>
  <AuthShell
    :signals="resetSignals"
    title="Choisissez un nouveau mot de passe."
    description="Définissez un mot de passe solide pour sécuriser à nouveau l'accès à votre compte Statsio."
  >
    <ResetPasswordFormCard />
  </AuthShell>
</template>
