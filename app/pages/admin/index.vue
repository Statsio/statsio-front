<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
import { ref, onMounted } from 'vue'
import { apiHttp } from '@/lib/http'

const stats = ref({ users: '—', admins: '—', broadcasts: '—', programs: '—' })

onMounted(async () => {
  try {
    const usersRes = await apiHttp.get<{ total: number }>('/admin/users?per_page=1')
    stats.value.users = String(usersRes.data.total ?? '—')
  } catch {
    // silent
  }
})
</script>

<template>
  <div>
    <h1 class="mb-6 text-2xl font-bold text-slate-900">Dashboard</h1>

    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-5">
        <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Utilisateurs</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">{{ stats.users }}</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5 opacity-50">
        <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Programmes TV</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">—</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5 opacity-50">
        <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Diffusions</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">—</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5 opacity-50">
        <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Vues enregistrées</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">—</p>
      </div>
    </div>
  </div>
</template>
