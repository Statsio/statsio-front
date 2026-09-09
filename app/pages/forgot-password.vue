<script setup lang="ts">
definePageMeta({ layout: 'studio', middleware: ['guest'], ssr: false, title: 'Mot de passe oublié', robots: 'noindex,nofollow' })

const recoverySignals = [
  {
    label: 'récupération',
    value: 'Quelques minutes',
    detail: 'un lien de réinitialisation directement dans votre boîte e-mail',
  },
  {
    label: 'sécurité',
    value: 'Parcours protégé',
    detail: 'chaque demande suit un chemin sécurisé pour protéger votre compte',
  },
]
</script>

<template>
  <AuthShell
    :signals="recoverySignals"
    title="Récupérez l'accès à votre compte."
    description="Réinitialisez votre mot de passe simplement et reprenez l'accès à vos contenus, abonnements et services."
  >
    <ForgotPasswordFormCard />
  </AuthShell>
</template>
