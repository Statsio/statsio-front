<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AccountPageHeader from '@/components/user/AccountPageHeader.vue'
import AccountContentThumb from '@/components/user/AccountContentThumb.vue'
import { useAccountHistory } from '@/composables/useAccountHistory'

definePageMeta({ layout: 'account', middleware: ['auth'], ssr: false, title: 'Historique', robots: 'noindex,nofollow' })

const { groups, loading, error, isEmpty, load, clear } = useAccountHistory()
onMounted(load)
</script>

<template>
  <div>
    <AccountPageHeader
      title="Historique"
      subtitle="Tout ce que vous avez consulté, du plus récent au plus ancien."
      :show-actions="false"
    />

    <div v-if="!isEmpty && !loading" class="mb-3.5 flex justify-end">
      <button type="button" class="text-[12.5px] font-bold text-rose-600 hover:text-rose-700" @click="clear">
        Effacer l'historique
      </button>
    </div>

    <p v-if="loading" class="py-16 text-center text-sm text-slate-400">Chargement…</p>
    <p v-else-if="error" class="py-16 text-center text-sm text-rose-500">{{ error }}</p>
    <p v-else-if="isEmpty" class="py-16 text-center text-sm text-slate-400">
      Votre historique de consultation est vide.
    </p>

    <div v-for="grp in groups" v-else :key="grp.key" class="mb-6">
      <div class="mb-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-400">{{ grp.label }}</div>
      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(20,20,30,0.05)]">
        <component
          :is="it.publicPath ? RouterLink : 'div'"
          v-for="it in grp.items"
          :key="it.id"
          :to="it.publicPath ?? undefined"
          class="flex items-center gap-4 border-b border-slate-100 px-5 py-3.5 transition last:border-b-0 hover:bg-slate-50"
        >
          <AccountContentThumb :content="it" class="h-[52px] w-[52px]" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[13.5px] font-bold text-slate-950">{{ it.title }}</span>
            <span class="mt-0.5 block text-[11.5px] text-slate-400">{{ it.ownerLabel }} · {{ it.typeLabel }}</span>
          </span>
          <span class="shrink-0 rounded-full bg-primary/10 px-3.5 py-1.5 text-[12px] font-bold text-primary">Revoir</span>
        </component>
      </div>
    </div>
  </div>
</template>
