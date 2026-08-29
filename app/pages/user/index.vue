<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AccountPageHeader from '@/components/user/AccountPageHeader.vue'
import AccountContentThumb from '@/components/user/AccountContentThumb.vue'
import { useAuthStore } from '@/stores/auth'
import { useAccountOverview } from '@/composables/useAccountOverview'

definePageMeta({ layout: 'account', middleware: ['auth'], ssr: false, title: 'Mon compte', robots: 'noindex,nofollow' })

const authStore = useAuthStore()
const { kpis, inProgress, activeChannels, loading, load } = useAccountOverview()

const firstName = computed(() => authStore.user?.profile?.first_name || authStore.displayName.split(' ')[0])

onMounted(load)
</script>

<template>
  <div>
    <AccountPageHeader
      :title="`Bonjour, ${firstName}`"
      subtitle="Un aperçu de votre activité récente sur Statsio."
    />

    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div
        v-for="k in kpis"
        :key="k.label"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(20,20,30,0.05)]"
      >
        <div class="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-400">{{ k.label }}</div>
        <div class="mt-2.5 font-mono text-[23px] font-semibold text-slate-950">{{ k.value }}</div>
        <div class="mt-1 text-[11.5px] font-semibold text-slate-400">{{ k.note }}</div>
      </div>
    </div>

    <div
      v-if="inProgress.length"
      class="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.05)]"
    >
      <div class="mb-4 flex items-baseline justify-between gap-4">
        <div class="text-[14px] font-extrabold text-slate-950">Reprendre où vous en étiez</div>
        <RouterLink to="/user/historique" class="text-[12.5px] font-bold text-primary">Tout l'historique →</RouterLink>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <component
          :is="it.publicPath ? RouterLink : 'div'"
          v-for="it in inProgress"
          :key="it.id"
          :to="it.publicPath ?? undefined"
          class="flex items-center gap-3.5 rounded-xl border border-slate-200 p-3.5 transition hover:border-primary/30"
        >
          <AccountContentThumb :content="it" class="h-[52px] w-[52px]" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[13.5px] font-bold text-slate-950">{{ it.title }}</span>
            <span class="mb-2 mt-1 block text-[11.5px] text-slate-400">{{ it.ownerLabel }} · {{ it.progress }}% lu</span>
            <span class="block h-1.5 overflow-hidden rounded bg-slate-100">
              <span
                class="block h-full rounded bg-gradient-to-r from-primary to-accent"
                :style="{ width: `${it.progress}%` }"
              />
            </span>
          </span>
        </component>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(20,20,30,0.05)]">
      <div class="px-6 pb-3.5 pt-5 text-[14px] font-extrabold text-slate-950">Vos chaînes suivies</div>
      <p v-if="loading" class="px-6 pb-6 text-[13px] text-slate-400">Chargement…</p>
      <p v-else-if="!activeChannels.length" class="px-6 pb-6 text-[13px] text-slate-400">
        Vous ne suivez aucune chaîne pour l'instant.
      </p>
      <RouterLink
        v-for="ch in activeChannels"
        :key="ch.id"
        :to="ch.handle ? `/channels/@${ch.handle}` : '/user/abonnements'"
        class="flex items-center gap-3.5 border-t border-slate-100 px-6 py-3.5 transition hover:bg-slate-50"
      >
        <span
          class="flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] text-[11.5px] font-bold text-white"
          :style="ch.logoUrl ? undefined : { background: ch.color }"
        >
          <img v-if="ch.logoUrl" :src="ch.logoUrl" alt="" class="h-full w-full object-cover" />
          <span v-else>{{ ch.initials }}</span>
        </span>
        <span class="flex-1 text-[13.5px] font-bold text-slate-950">{{ ch.name }}</span>
        <span class="text-[12px] text-slate-400">{{ ch.subscriberCount }} abonnés</span>
      </RouterLink>
    </div>
  </div>
</template>
