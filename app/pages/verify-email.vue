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
    label: 'Activation rapide',
    value: '6 chiffres',
    detail: 'Saisissez le code reçu par e-mail pour activer votre compte en quelques secondes.',
  },
  {
    label: 'Accès protégés',
    value: 'Sécurisé',
    detail: 'La vérification protège votre compte contre les usages frauduleux.',
  },
]
</script>

<template>
  <AuthShell
    :signals="verifySignals"
    badge-label="Vérification"
    title="Confirmez votre identité."
    description="Un code à 6 chiffres a été envoyé à votre adresse e-mail. Saisissez-le ci-dessous pour activer votre compte."
  >
    <VerifyEmailFormCard />
  </AuthShell>
</template>
