<script setup lang="ts">
definePageMeta({
  layout: 'studio',
  middleware: ['guest'],
  ssr: false,
  title: 'Vérification email',
  description: 'Confirmez votre adresse e-mail pour activer votre compte Statsio.',
  robots: 'noindex,nofollow',
})

const verifySignals = [
  {
    label: 'activation',
    value: 'Code à 6 chiffres',
    detail: 'activez votre compte en quelques secondes',
  },
  {
    label: 'sécurité',
    value: 'Compte protégé',
    detail: 'la vérification protège votre compte contre les usages frauduleux',
  },
]
</script>

<template>
  <AuthShell
    :signals="verifySignals"
    title="Confirmez votre identité."
    description="Un code à 6 chiffres a été envoyé à votre adresse e-mail. Saisissez-le ci-dessous pour activer votre compte."
  >
    <VerifyEmailFormCard />
  </AuthShell>
</template>
