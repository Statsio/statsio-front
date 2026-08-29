<script setup lang="ts">
import { onMounted } from 'vue'
import AccountPageHeader from '@/components/user/AccountPageHeader.vue'
import FavoriteCard from '@/components/user/FavoriteCard.vue'
import { useAccountFavorites } from '@/composables/useAccountFavorites'

definePageMeta({ layout: 'account', middleware: ['auth'], ssr: false, title: 'Favoris', robots: 'noindex,nofollow' })

const { items, loading, error, isEmpty, load, remove } = useAccountFavorites()
onMounted(load)
</script>

<template>
  <div>
    <AccountPageHeader
      title="Favoris"
      subtitle="Les contenus que vous avez enregistrés pour plus tard."
      :show-actions="false"
    />

    <p v-if="loading" class="py-16 text-center text-sm text-slate-400">Chargement…</p>
    <p v-else-if="error" class="py-16 text-center text-sm text-rose-500">{{ error }}</p>
    <p v-else-if="isEmpty" class="py-16 text-center text-sm text-slate-400">Aucun favori pour le moment.</p>

    <div v-else class="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
      <FavoriteCard v-for="c in items" :key="c.id" :content="c" @remove="remove" />
    </div>
  </div>
</template>
