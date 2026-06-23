<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { adminListChannels, adminUpdateChannel, adminDeleteChannel, type AdminChannel } from '@/api/admin'

const channels = ref<AdminChannel[]>([])
const total = ref(0)
const currentPage = ref(1)
const lastPage = ref(1)
const loading = ref(false)
const searchInput = ref('')
const activeFilter = ref<'all' | 'active' | 'inactive'>('all')

async function load(page = 1) {
  loading.value = true
  try {
    const params: Record<string, string | number> = { page }
    if (searchInput.value) params.search = searchInput.value
    if (activeFilter.value !== 'all') params.active = activeFilter.value === 'active' ? '1' : '0'
    const res = await adminListChannels(params as any)
    channels.value = res.data
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
watch(activeFilter, () => load(1))

async function toggleActive(ch: AdminChannel) {
  await adminUpdateChannel(ch.id, { is_active: !ch.is_active })
  ch.is_active = !ch.is_active
}

async function remove(ch: AdminChannel) {
  if (!confirm(`Supprimer « ${ch.display_name} » ? Cette action est irréversible.`)) return
  try {
    await adminDeleteChannel(ch.id)
    await load(currentPage.value)
  } catch (e: any) {
    alert(e?.response?.data?.message ?? 'Impossible de supprimer cette chaîne.')
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="mb-1 text-2xl font-bold text-slate-900">Chaînes TNT</h1>
        <p class="text-sm text-slate-500">{{ total }} chaîne(s)</p>
      </div>
      <RouterLink to="/admin/tvstats/channels/create" class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
        + Ajouter
      </RouterLink>
    </div>

    <div class="mb-4 flex flex-wrap gap-3">
      <input v-model="searchInput" type="text" placeholder="Rechercher…" class="w-60 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400" />
      <select v-model="activeFilter" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
        <option value="all">Toutes</option>
        <option value="active">Actives</option>
        <option value="inactive">Inactives</option>
      </select>
    </div>

    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table class="w-full text-sm">
        <thead class="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">#</th>
            <th class="px-4 py-3">Chaîne</th>
            <th class="px-4 py-3">Slug</th>
            <th class="px-4 py-3">EPG ID</th>
            <th class="px-4 py-3">Statut</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="loading"><td colspan="6" class="py-10 text-center text-slate-400">Chargement…</td></tr>
          <tr v-else-if="!channels.length"><td colspan="6" class="py-10 text-center text-slate-400">Aucune chaîne.</td></tr>
          <tr v-for="ch in channels" :key="ch.id" class="hover:bg-slate-50">
            <td class="px-4 py-3 font-mono text-slate-500">{{ ch.number }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <img v-if="ch.logo_url" :src="ch.logo_url" :alt="ch.display_name" class="h-6 w-10 object-contain" />
                <span class="font-medium text-slate-800">{{ ch.display_name }}</span>
              </div>
            </td>
            <td class="px-4 py-3 font-mono text-slate-500">{{ ch.slug }}</td>
            <td class="px-4 py-3 font-mono text-slate-500">{{ ch.epg_channel_id ?? '—' }}</td>
            <td class="px-4 py-3">
              <button
                class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="ch.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'"
                @click="toggleActive(ch)"
              >{{ ch.is_active ? 'Active' : 'Inactive' }}</button>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-3">
                <RouterLink :to="`/admin/tvstats/channels/${ch.id}`" class="text-sm text-slate-500 hover:text-slate-800">Voir</RouterLink>
                <RouterLink :to="`/admin/tvstats/channels/${ch.id}/edit`" class="text-sm text-slate-500 hover:text-slate-800">Modifier</RouterLink>
                <button class="text-sm text-red-400 hover:text-red-600" @click="remove(ch)">Supprimer</button>
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
