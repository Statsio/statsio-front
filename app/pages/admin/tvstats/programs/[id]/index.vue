<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
import { ref, onMounted } from 'vue'
import { getErrorMessage } from '@/lib/http-errors'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { adminGetProgram, adminDeleteProgram, type AdminProgramDetail } from '@/api/admin'
import { TNT_CHANNELS } from '@/data/tnt-channels'

const route = useRoute()
const router = useRouter()

const program = ref<AdminProgramDetail | null>(null)
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

onMounted(async () => {
  program.value = await adminGetProgram(Number(route.params.id))
  loading.value = false
})

async function doDelete() {
  if (!program.value) return
  deleteLoading.value = true
  deleteError.value = null
  try {
    await adminDeleteProgram(program.value.id)
    router.push('/admin/tvstats/programs')
  } catch (e) {
    deleteError.value = getErrorMessage(e, 'Erreur lors de la suppression.')
    deleteLoading.value = false
  }
}
</script>

<template>
  <div v-if="loading" class="py-20 text-center text-slate-400">Chargement…</div>
  <div v-else-if="program" class="mx-auto max-w-3xl">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <RouterLink to="/admin/tvstats/programs" class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          Programmes
        </RouterLink>
        <span class="text-slate-300">/</span>
        <h1 class="text-xl font-bold text-slate-900 line-clamp-1">{{ program.title }}</h1>
      </div>
      <RouterLink :to="`/admin/tvstats/programs/${program.id}/edit`" class="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
        Modifier
      </RouterLink>
    </div>

    <!-- Metadata -->
    <div class="mb-4 rounded-2xl border border-slate-200 bg-white p-6">
      <dl class="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <div class="col-span-2">
          <dt class="mb-0.5 text-xs font-medium text-slate-500">Titre</dt>
          <dd class="font-medium text-slate-900">{{ program.title }}</dd>
        </div>
        <div>
          <dt class="mb-0.5 text-xs font-medium text-slate-500">Chaîne</dt>
          <dd class="text-slate-700">{{ channelName(program.tv_channel_id) }}</dd>
        </div>
        <div>
          <dt class="mb-0.5 text-xs font-medium text-slate-500">Type / Genre</dt>
          <dd class="text-slate-700">{{ program.type ?? '—' }}</dd>
        </div>
        <div>
          <dt class="mb-0.5 text-xs font-medium text-slate-500">Total diffusions</dt>
          <dd class="text-slate-700">{{ program.broadcasts_count }}</dd>
        </div>
        <div>
          <dt class="mb-0.5 text-xs font-medium text-slate-500">Créé le</dt>
          <dd class="text-slate-700">{{ fmt(program.created_at) }}</dd>
        </div>
        <div v-if="program.description" class="col-span-2">
          <dt class="mb-0.5 text-xs font-medium text-slate-500">Description</dt>
          <dd class="whitespace-pre-line text-slate-700">{{ program.description }}</dd>
        </div>
      </dl>
    </div>

    <!-- Recent broadcasts -->
    <div class="mb-4 rounded-2xl border border-slate-200 bg-white">
      <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 class="text-sm font-semibold text-slate-700">Diffusions récentes</h2>
        <RouterLink :to="`/admin/tvstats/broadcasts?search=${encodeURIComponent(program.title)}`" class="text-xs text-slate-400 hover:text-slate-700">
          Voir toutes →
        </RouterLink>
      </div>
      <table class="w-full text-sm">
        <thead class="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-2.5">Début</th>
            <th class="px-4 py-2.5">Fin</th>
            <th class="px-4 py-2.5">Spectateurs</th>
            <th class="px-4 py-2.5">PDA</th>
            <th class="px-4 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="!program.broadcasts?.length">
            <td colspan="5" class="px-4 py-6 text-center text-slate-400">Aucune diffusion enregistrée.</td>
          </tr>
          <tr v-for="b in program.broadcasts" :key="b.id" class="hover:bg-slate-50">
            <td class="px-4 py-2.5 text-slate-700">{{ fmt(b.start_at) }}</td>
            <td class="px-4 py-2.5 text-slate-500">{{ fmt(b.end_at) }}</td>
            <td class="px-4 py-2.5 text-slate-500">{{ b.audience?.viewers?.toLocaleString('fr-FR') ?? '—' }}</td>
            <td class="px-4 py-2.5 text-slate-500">{{ b.audience?.pda != null ? b.audience.pda + ' %' : '—' }}</td>
            <td class="px-4 py-2.5 text-right">
              <RouterLink :to="`/admin/tvstats/broadcasts/${b.id}`" class="text-xs text-slate-400 hover:text-slate-700">Voir</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Danger zone -->
    <div class="rounded-2xl border border-red-100 bg-red-50 p-5">
      <h3 class="mb-2 text-sm font-semibold text-red-800">Zone de danger</h3>
      <p class="mb-4 text-sm text-red-700">
        Supprimer ce programme supprimera aussi ses {{ program.broadcasts_count }} diffusion(s) et les données d'audience associées.
      </p>
      <div v-if="!deleteConfirm">
        <button class="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100" @click="deleteConfirm = true">
          Supprimer ce programme
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
