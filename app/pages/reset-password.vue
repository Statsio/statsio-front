<script setup lang="ts">
definePageMeta({ layout: 'studio', middleware: ['guest'], ssr: false, title: 'Réinitialiser le mot de passe', robots: 'noindex,nofollow' })

const resetSignals = [
  {
    label: 'Récupération rapide',
    value: 'Quelques minutes',
    detail: 'Choisissez un nouveau mot de passe et reprenez immédiatement l\'accès à votre compte.',
  },
  {
    label: 'Accès protégés',
    value: '100%',
    detail: 'Vos anciennes sessions sont automatiquement révoquées après la mise à jour.',
  },
  {
    label: 'Aide disponible',
    value: 'Support',
    detail: "En cas de blocage, vous pouvez demander un nouveau lien à tout moment.",
  },
]
</script>

<template>
  <AuthShell
    :signals="resetSignals"
    badge-label="Récupération sécurisée"
    title="Choisissez un nouveau mot de passe."
    description="Définissez un mot de passe solide pour sécuriser à nouveau l'accès à votre compte Statsio."
  >
    <ResetPasswordFormCard />
  </AuthShell>
</template>
