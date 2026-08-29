<script setup lang="ts">
import { onMounted } from 'vue'
import AccountPageHeader from '@/components/user/AccountPageHeader.vue'
import SubscriptionRow from '@/components/user/SubscriptionRow.vue'
import { useAccountSubscriptions } from '@/composables/useAccountSubscriptions'

definePageMeta({ layout: 'account', middleware: ['auth'], ssr: false, title: 'Chaînes suivies', robots: 'noindex,nofollow' })

const { items, loading, error, isEmpty, load, toggle } = useAccountSubscriptions()
onMounted(load)
</script>

<template>
  <div>
    <AccountPageHeader
      title="Chaînes suivies"
      subtitle="Les chaînes éditoriales dont vous recevez les publications."
      :show-actions="false"
    />

    <p v-if="loading" class="py-16 text-center text-sm text-slate-400">Chargement…</p>
    <p v-else-if="error" class="py-16 text-center text-sm text-rose-500">{{ error }}</p>
    <p v-else-if="isEmpty" class="py-16 text-center text-sm text-slate-400">
      Vous ne suivez aucune chaîne pour l'instant.
    </p>

    <div v-else class="flex flex-col gap-3">
      <SubscriptionRow v-for="s in items" :key="s.id" :subscription="s" @toggle="toggle" />
    </div>
  </div>
</template>
