<script setup lang="ts">
definePageMeta({ layout: 'studio', middleware: ['guest'], ssr: false, title: 'Inscription', robots: 'noindex,nofollow' })
import AuthLayout from '@/components/login/AuthLayout.vue'
import RegisterFormCard from '@/components/login/RegisterFormCard.vue'

const registerSignals = [
  {
    label: 'Mise en route rapide',
    value: '2 min',
    detail: 'Créez votre compte et commencez à personnaliser votre expérience immédiatement.',
  },
  {
    label: 'Accès unifiés',
    value: '1 compte',
    detail: 'Retrouvez au même endroit vos chaînes, abonnements et services actifs.',
  },
  {
    label: 'Parcours sécurisé',
    value: 'Protégé',
    detail: 'Vos informations et accès sont gérés dans un environnement pensé pour la confiance.',
  },
]
</script>

<template>
  <AuthLayout
    :signals="registerSignals"
    badge-label="Nouvel espace"
    title="Créez votre accès Statsio."
    description="Ouvrez votre compte pour retrouver vos contenus, souscrire à vos services et naviguer dans une expérience personnalisée."
    form-width-class="480px"
  >
    <RegisterFormCard />
  </AuthLayout>
</template>
