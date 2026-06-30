<script setup lang="ts">
definePageMeta({
  layout: 'studio',
  middleware: ['guest'],
  ssr: false,
  title: 'Vérification email',
  description: 'Confirmez votre adresse e-mail pour activer votre compte Statsio.',
})
import AuthLayout from '@/components/login/AuthLayout.vue'
import VerifyEmailCard from '@/components/login/VerifyEmailCard.vue'
</script>

<template>
  <AuthLayout
    badge-label="Vérification"
    title="Confirmez votre identité."
    description="Un code à 6 chiffres a été envoyé à votre adresse e-mail. Saisissez-le ci-dessous pour activer votre compte."
  >
    <VerifyEmailCard />
  </AuthLayout>
</template>
