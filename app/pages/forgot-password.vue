<script setup lang="ts">
definePageMeta({
  layout: 'studio',
  ssr: false,
  title: 'Mot de passe oublié',
  description: 'Réinitialisez votre mot de passe Statsio et reprenez l\'accès à vos contenus, abonnements et services.',
})
import AuthLayout from '@/components/login/AuthLayout.vue'
import ForgotPasswordFormCard from '@/components/login/ForgotPasswordFormCard.vue'

const recoverySignals = [
  {
    label: 'Récupération rapide',
    value: 'Quelques minutes',
    detail: 'Recevez un lien de réinitialisation directement sur votre boîte e-mail.',
  },
  {
    label: 'Accès protégés',
    value: '100%',
    detail: 'Chaque demande suit un parcours sécurisé pour protéger votre compte.',
  },
  {
    label: 'Aide disponible',
    value: 'Support',
    detail: "En cas de blocage, vous pouvez reprendre la main ou demander de l'assistance.",
  },
]
</script>

<template>
  <AuthLayout
    :signals="recoverySignals"
    badge-label="Récupération sécurisée"
    title="Récupérez l'accès à votre compte."
    description="Réinitialisez votre mot de passe simplement et reprenez l'accès à vos contenus, abonnements et services."
  >
    <ForgotPasswordFormCard />
  </AuthLayout>
</template>
