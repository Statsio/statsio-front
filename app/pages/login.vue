<script setup lang="ts">
definePageMeta({ layout: 'studio', middleware: ['guest'], ssr: false, title: 'Connexion', robots: 'noindex,nofollow' })
import AuthLayout from '@/components/login/AuthLayout.vue'
import LoginFormCard from '@/components/login/LoginFormCard.vue'

const trustSignals = [
  {
    label: 'Accès en continu',
    value: '24/7',
    detail: 'Votre espace reste disponible à tout moment, sur tous vos usages.',
  },
  {
    label: 'Espaces actifs',
    value: '860+',
    detail: 'Utilisateurs, équipes et abonnés déjà présents sur la plateforme.',
  },
  {
    label: 'Expériences connectées',
    value: 'Multi-accès',
    detail: 'Un même compte pour retrouver vos contenus, suivis et services associés.',
  },
]

</script>

<template>
  <AuthLayout :signals="trustSignals">
    <LoginFormCard />
  </AuthLayout>
</template>
