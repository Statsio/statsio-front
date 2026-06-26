<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
import { ref, computed, onMounted } from 'vue'
import { getErrorMessage } from '@/lib/http-errors'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { adminGetBroadcast, adminDeleteBroadcast, type AdminBroadcast } from '@/api/admin'
import { TNT_CHANNELS } from '@/data/tnt-channels'

const route = useRoute()
const router = useRouter()

const broadcast = ref<AdminBroadcast | null>(null)
const loading = ref(true)
const deleteConfirm = ref(false)
const deleteLoading = ref(false)
const deleteError = ref<string | null>(null)

function channelName(slug: string) {
  return TNT_CHANNELS.find((c) => c.id === slug)?.displayName ?? slug
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const duration = computed(() => {
  if (!broadcast.value) return null
  const ms = new Date(broadcast.value.end_at).getTime() - new Date(broadcast.value.start_at).getTime()
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
})

onMounted(async () => {
  broadcast.value = await adminGetBroadcast(Number(route.params.id))
  loading.value = false
})

async function doDelete() {
  if (!broadcast.value) return
  deleteLoading.value = true
  deleteError.value = null
  try {
    await adminDeleteBroadcast(broadcast.value.id)
    router.push('/admin/tvstats/broadcasts')
  } catch (e) {
    deleteError.value = getErrorMessage(e, 'Erreur lors de la suppression.')
    deleteLoading.value = false
  }
}
</script>

<template>
  <div v-if="loading" class="py-20 text-center text-slate-400">Chargement…</div>
  <div v-else-if="broadcast" class="mx-auto max-w-2xl">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <RouterLink to="/admin/tvstats/broadcasts" class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          Diffusions
        </RouterLink>
        <span class="text-slate-300">/</span>
        <h1 class="text-xl font-bold text-slate-900 line-clamp-1">{{ broadcast.program?.title ?? '—' }}</h1>
      </div>
      <RouterLink :to="`/admin/tvstats/broadcasts/${broadcast.id}/edit`" class="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
        Modifier
      </RouterLink>
    </div>

    <!-- Data -->
    <div class="mb-4 rounded-2xl border border-slate-200 bg-white p-6">
      <dl class="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <div class="col-span-2">
          <dt class="mb-0.5 text-xs font-medium text-slate-500">Programme</dt>
          <dd class="font-medium text-slate-900">
            <RouterLink v-if="broadcast.program" :to="`/admin/tvstats/programs/${broadcast.program_id}`" class="hover:underline">
              {{ broadcast.program.title }}
            </RouterLink>
            <span v-else>—</span>
          </dd>
          <dd v-if="broadcast.program?.type" class="text-xs text-slate-500">{{ broadcast.program.type }}</dd>
        </div>
        <div>
          <dt class="mb-0.5 text-xs font-medium text-slate-500">Chaîne</dt>
          <dd class="text-slate-700">{{ channelName(broadcast.tv_channel_id) }}</dd>
        </div>
        <div>
          <dt class="mb-0.5 text-xs font-medium text-slate-500">Durée</dt>
          <dd class="text-slate-700">{{ duration }}</dd>
        </div>
        <div>
          <dt class="mb-0.5 text-xs font-medium text-slate-500">Début</dt>
          <dd class="text-slate-700">{{ fmt(broadcast.start_at) }}</dd>
        </div>
        <div>
          <dt class="mb-0.5 text-xs font-medium text-slate-500">Fin</dt>
          <dd class="text-slate-700">{{ fmt(broadcast.end_at) }}</dd>
        </div>
        <div>
          <dt class="mb-0.5 text-xs font-medium text-slate-500">Saison</dt>
          <dd class="text-slate-700">{{ broadcast.season ?? '—' }}</dd>
        </div>
        <div>
          <dt class="mb-0.5 text-xs font-medium text-slate-500">Épisode</dt>
          <dd class="text-slate-700">{{ broadcast.episode ?? '—' }}</dd>
        </div>
      </dl>
    </div>

    <!-- Audience -->
    <div class="mb-4 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 class="mb-4 text-sm font-semibold text-slate-700">Audience</h2>
      <div v-if="broadcast.audience && (broadcast.audience.viewers != null || broadcast.audience.pda != null)" class="grid grid-cols-3 gap-4">
        <div class="rounded-xl bg-slate-50 p-4 text-center">
          <p class="text-2xl font-bold text-slate-900">{{ broadcast.audience.viewers?.toLocaleString('fr-FR') ?? '—' }}</p>
          <p class="mt-0.5 text-xs text-slate-500">Spectateurs</p>
        </div>
        <div class="rounded-xl bg-slate-50 p-4 text-center">
          <p class="text-2xl font-bold text-slate-900">{{ broadcast.audience.pda != null ? broadcast.audience.pda + ' %' : '—' }}</p>
          <p class="mt-0.5 text-xs text-slate-500">Part d'audience</p>
        </div>
        <div class="rounded-xl bg-slate-50 p-4 text-center">
          <p class="text-2xl font-bold text-slate-900">{{ broadcast.audience.rank != null ? '#' + broadcast.audience.rank : '—' }}</p>
          <p class="mt-0.5 text-xs text-slate-500">Classement</p>
        </div>
      </div>
      <p v-else class="text-sm text-slate-400">Aucune donnée d'audience pour cette diffusion.</p>
    </div>

    <!-- Danger zone -->
    <div class="rounded-2xl border border-red-100 bg-red-50 p-5">
      <h3 class="mb-2 text-sm font-semibold text-red-800">Zone de danger</h3>
      <p class="mb-4 text-sm text-red-700">Supprimer cette diffusion supprimera aussi ses données d'audience.</p>
      <div v-if="!deleteConfirm">
        <button class="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100" @click="deleteConfirm = true">
          Supprimer cette diffusion
        </button>
      </div>
      <div v-else class="flex flex-wrap items-center gap-3">
        <span class="text-sm font-medium text-red-800">Confirmer la suppression ?</span>
        <button class="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60" :disabled="deleteLoading" @click="doDelete">
          {{ deleteLoading ? 'Suppression…' : 'Oui, supprimer' }}
        </button>
        <button class="text-sm text-red-600 hover:text-red-800" @click="deleteConfirm = false">Annuler</button>
      </div>
      <p v-if="deleteError" class="mt-3 text-sm text-red-700">{{ deleteError }}</p>
    </div>
  </div>
</template>
