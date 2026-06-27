<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
import { ref, watch } from 'vue'
import { getErrorMessage } from '@/lib/http-errors'
import { RouterLink } from 'vue-router'
import { adminListBroadcasts, adminDeleteBroadcast, type AdminBroadcast } from '@/api/admin'
import { TNT_CHANNELS } from '@/data/tnt-channels'

const broadcasts = ref<AdminBroadcast[]>([])
const total = ref(0)
const currentPage = ref(1)
const lastPage = ref(1)
const loading = ref(false)
const searchInput = ref('')
const channelFilter = ref('')
const dateFilter = ref('')

function channelName(slug: string) {
  return TNT_CHANNELS.find((c) => c.id === slug)?.displayName ?? slug
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function load(page = 1) {
  loading.value = true
  try {
    const params: Record<string, string | number> = { page }
    if (searchInput.value) params.search = searchInput.value
    if (channelFilter.value) params.channel = channelFilter.value
    if (dateFilter.value) params.date = dateFilter.value
    const res = await adminListBroadcasts(params)
    broadcasts.value = res.data
    total.value = res.total
    currentPage.value = res.current_page
    lastPage.value = res.last_page
  } finally {
    loading.value = false
  }
}

load()

let searchTimer: ReturnType<typeof setTimeout>
watch(searchInput, () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => load(1), 300) })
watch(channelFilter, () => load(1))
watch(dateFilter, () => load(1))

async function remove(b: AdminBroadcast) {
  if (!confirm(`Supprimer la diffusion de « ${b.program?.title ?? '—'} » ?`)) return
  try {
    await adminDeleteBroadcast(b.id)
    await load(currentPage.value)
  } catch (e) {
    alert(getErrorMessage(e, 'Erreur lors de la suppression.'))
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="mb-1 text-2xl font-bold text-slate-900">Diffusions</h1>
      <p class="text-sm text-slate-500">{{ total }} diffusion(s)</p>
    </div>

    <div class="mb-4 flex flex-wrap gap-3">
      <input v-model="searchInput" type="text" placeholder="Rechercher un titre…" class="w-64 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400" />
      <AppSelect
        v-model="channelFilter"
        :options="TNT_CHANNELS.map((c) => ({ value: c.id, label: c.displayName }))"
        placeholder="Toutes les chaînes"
        class="w-44"
      />
      <input v-model="dateFilter" type="date" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400" />
      <button v-if="dateFilter" class="text-sm text-slate-500 underline hover:text-slate-800" @click="dateFilter = ''">Effacer la date</button>
    </div>

    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table class="w-full text-sm">
        <thead class="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Programme</th>
            <th class="px-4 py-3">Chaîne</th>
            <th class="px-4 py-3">Début</th>
            <th class="px-4 py-3">Spectateurs</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="loading"><td colspan="5" class="py-10 text-center text-slate-400">Chargement…</td></tr>
          <tr v-else-if="!broadcasts.length"><td colspan="5" class="py-10 text-center text-slate-400">Aucune diffusion.</td></tr>
          <tr v-for="b in broadcasts" :key="b.id" class="hover:bg-slate-50">
            <td class="max-w-[220px] px-4 py-3">
              <span class="block truncate font-medium text-slate-800">{{ b.program?.title ?? '—' }}</span>
              <span v-if="b.program?.type" class="text-xs text-slate-400">{{ b.program.type }}</span>
            </td>
            <td class="px-4 py-3 text-slate-500">{{ channelName(b.tv_channel_id) }}</td>
            <td class="px-4 py-3 text-slate-500">{{ fmt(b.start_at) }}</td>
            <td class="px-4 py-3 text-slate-500">
              <span v-if="b.audience?.viewers">{{ b.audience.viewers.toLocaleString('fr-FR') }}</span>
              <span v-else class="text-slate-300">—</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-3">
                <RouterLink :to="`/admin/tvstats/broadcasts/${b.id}`" class="text-sm text-slate-500 hover:text-slate-800">Voir</RouterLink>
                <RouterLink :to="`/admin/tvstats/broadcasts/${b.id}/edit`" class="text-sm text-slate-500 hover:text-slate-800">Modifier</RouterLink>
                <button class="text-sm text-red-400 hover:text-red-600" @click="remove(b)">Supprimer</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="lastPage > 1" class="mt-4 flex items-center justify-end gap-2 text-sm">
      <button class="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40" :disabled="currentPage === 1" @click="load(currentPage - 1)">Précédent</button>
      <span class="text-slate-500">{{ currentPage }} / {{ lastPage }}</span>
      <button class="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40" :disabled="currentPage === lastPage" @click="load(currentPage + 1)">Suivant</button>
    </div>
  </div>
</template>
