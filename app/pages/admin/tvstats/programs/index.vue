<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
import { ref, watch } from 'vue'
import { getErrorMessage } from '@/lib/http-errors'
import { RouterLink } from 'vue-router'
import { adminListPrograms, adminDeleteProgram, type AdminProgram } from '@/api/admin'
import { TNT_CHANNELS } from '@/data/tnt-channels'

const programs = ref<AdminProgram[]>([])
const total = ref(0)
const currentPage = ref(1)
const lastPage = ref(1)
const loading = ref(false)
const searchInput = ref('')
const channelFilter = ref('')

function channelName(slug: string) {
  return TNT_CHANNELS.find((c) => c.id === slug)?.displayName ?? slug
}

async function load(page = 1) {
  loading.value = true
  try {
    const params: Record<string, string | number> = { page }
    if (searchInput.value) params.search = searchInput.value
    if (channelFilter.value) params.channel = channelFilter.value
    const res = await adminListPrograms(params)
    programs.value = res.data
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

async function remove(p: AdminProgram) {
  if (!confirm(`Supprimer « ${p.title} » et ses ${p.broadcasts_count} diffusion(s) ?`)) return
  try {
    await adminDeleteProgram(p.id)
    await load(currentPage.value)
  } catch (e) {
    alert(getErrorMessage(e, 'Erreur lors de la suppression.'))
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="mb-1 text-2xl font-bold text-slate-900">Programmes</h1>
      <p class="text-sm text-slate-500">{{ total }} programme(s)</p>
    </div>

    <div class="mb-4 flex flex-wrap gap-3">
      <input v-model="searchInput" type="text" placeholder="Rechercher un titre…" class="w-64 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400" />
      <select v-model="channelFilter" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
        <option value="">Toutes les chaînes</option>
        <option v-for="c in TNT_CHANNELS" :key="c.id" :value="c.id">{{ c.displayName }}</option>
      </select>
    </div>

    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table class="w-full text-sm">
        <thead class="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Titre</th>
            <th class="px-4 py-3">Chaîne</th>
            <th class="px-4 py-3">Type</th>
            <th class="px-4 py-3">Diffusions</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="loading"><td colspan="5" class="py-10 text-center text-slate-400">Chargement…</td></tr>
          <tr v-else-if="!programs.length"><td colspan="5" class="py-10 text-center text-slate-400">Aucun programme.</td></tr>
          <tr v-for="p in programs" :key="p.id" class="hover:bg-slate-50">
            <td class="max-w-xs px-4 py-3"><span class="block truncate font-medium text-slate-800">{{ p.title }}</span></td>
            <td class="px-4 py-3 text-slate-500">{{ channelName(p.tv_channel_id) }}</td>
            <td class="px-4 py-3 text-slate-500">{{ p.type ?? '—' }}</td>
            <td class="px-4 py-3 text-slate-500">{{ p.broadcasts_count }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-3">
                <RouterLink :to="`/admin/tvstats/programs/${p.id}`" class="text-sm text-slate-500 hover:text-slate-800">Voir</RouterLink>
                <RouterLink :to="`/admin/tvstats/programs/${p.id}/edit`" class="text-sm text-slate-500 hover:text-slate-800">Modifier</RouterLink>
                <button class="text-sm text-red-400 hover:text-red-600" @click="remove(p)">Supprimer</button>
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
