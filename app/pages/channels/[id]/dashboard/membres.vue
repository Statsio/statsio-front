<script setup lang="ts">
definePageMeta({ layout: 'channel-dashboard', middleware: ['auth'], ssr: false, title: 'Membres de la chaîne', robots: 'noindex,nofollow' })
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getChannelMembers, type ChannelMember } from '@/api/channels'
import { useChannelDashboard } from '@/composables/useChannelDashboard'

const route = useRoute()
const channelId = computed(() => Number(route.params.id))
const { channel, isLoading, loadError, ensureLoaded } = useChannelDashboard()

const members = ref<ChannelMember[]>([])
const membersLoading = ref(true)

const roleLabel: Record<string, string> = {
  owner: 'Propriétaire',
  admin: 'Admin',
  moderator: 'Modérateur',
  subscriber: 'Abonné',
}

onMounted(async () => {
  await ensureLoaded(channelId.value)
  try {
    members.value = await getChannelMembers(channelId.value)
  } catch {}
  finally { membersLoading.value = false }
})
</script>

<template>
  <div class="mx-auto flex max-w-4xl flex-col gap-6">

    <template v-if="isLoading">
      <div class="h-10 w-64 animate-pulse rounded-2xl bg-slate-200" />
      <div class="h-72 animate-pulse rounded-[2rem] bg-slate-100" />
    </template>

    <p v-else-if="loadError" class="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
      {{ loadError }}
    </p>

    <template v-else-if="channel">
      <div>
        <p class="eyebrow text-primary">Équipe</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Membres & rôles</h1>
        <p class="mt-2 text-slate-500">Les personnes qui participent à la gestion de votre chaîne.</p>
      </div>

      <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
        <div v-if="membersLoading" class="space-y-3">
          <div v-for="i in 2" :key="i" class="h-16 animate-pulse rounded-[1.5rem] bg-slate-100" />
        </div>
        <div v-else class="flex flex-col gap-3">
          <div
            v-for="member in members"
            :key="member.id"
            class="flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
          >
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {{ member.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?' }}
              </div>
              <div>
                <p class="text-sm font-semibold text-slate-950">{{ member.name }}</p>
                <p class="text-xs text-slate-500">{{ member.email }}</p>
              </div>
            </div>
            <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {{ roleLabel[member.role] ?? member.role }}
            </span>
          </div>
          <p v-if="!members.length" class="text-sm text-slate-400">Aucun membre trouvé.</p>
        </div>
      </div>
    </template>

  </div>
</template>
