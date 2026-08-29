<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AccountPageHeader from '@/components/user/AccountPageHeader.vue'
import AccountProfileCard from '@/components/user/AccountProfileCard.vue'
import AccountDemographicsCard from '@/components/user/AccountDemographicsCard.vue'
import AccountNotificationsCard from '@/components/user/AccountNotificationsCard.vue'
import AccountDangerZone from '@/components/user/AccountDangerZone.vue'

definePageMeta({ layout: 'account', middleware: ['auth'], ssr: false, title: 'Paramètres', robots: 'noindex,nofollow' })

const router = useRouter()

// Deep-link vers la carte démographie (#demographics) — scroll après montage.
onMounted(() => {
  if (router.currentRoute.value.hash === '#demographics') {
    requestAnimationFrame(() => document.getElementById('demographics')?.scrollIntoView({ behavior: 'smooth' }))
  }
})
</script>

<template>
  <div>
    <AccountPageHeader
      title="Paramètres"
      subtitle="Informations personnelles, notifications et sécurité du compte."
      :show-actions="false"
    />

    <div class="flex flex-col gap-5">
      <AccountProfileCard />
      <AccountDemographicsCard />
      <AccountNotificationsCard />
      <AccountDangerZone />
    </div>
  </div>
</template>
