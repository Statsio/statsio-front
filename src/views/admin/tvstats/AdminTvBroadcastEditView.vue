<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { adminGetBroadcast, adminUpdateBroadcast, type AdminBroadcast } from '@/api/admin'
import { TNT_CHANNELS } from '@/data/tnt-channels'

const route = useRoute()
const router = useRouter()

const broadcast = ref<AdminBroadcast | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)

const form = reactive({ season: '' as string | number, episode: '' as string | number })

function channelName(slug: string) {
  return TNT_CHANNELS.find((c) => c.id === slug)?.displayName ?? slug
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  const b = await adminGetBroadcast(Number(route.params.id))
  broadcast.value = b
  form.season = b.season ?? ''
  form.episode = b.episode ?? ''
  loading.value = false
})

async function submit() {
  if (!broadcast.value) return
  error.value = null
  saving.value = true
  try {
    await adminUpdateBroadcast(broadcast.value.id, {
      season: form.season !== '' ? Number(form.season) : null,
      episode: form.episode !== '' ? Number(form.episode) : null,
    })
    router.push(`/admin/tvstats/broadcasts/${broadcast.value.id}`)
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Erreur lors de la mise à jour.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="loading" class="py-20 text-center text-slate-400">Chargement…</div>
  <div v-else-if="broadcast" class="mx-auto max-w-2xl">
    <!-- Header -->
    <div class="mb-6 flex items-center gap-4">
      <RouterLink :to="`/admin/tvstats/broadcasts/${broadcast.id}`" class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
        {{ broadcast.program?.title ?? 'Diffusion' }}
      </RouterLink>
      <span class="text-slate-300">/</span>
      <h1 class="text-xl font-bold text-slate-900">Modifier</h1>
    </div>

    <!-- Context info (read-only) -->
    <div class="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm">
      <div class="flex flex-wrap gap-x-8 gap-y-1 text-slate-600">
        <span><span class="text-slate-400">Programme :</span> {{ broadcast.program?.title ?? '—' }}</span>
        <span><span class="text-slate-400">Chaîne :</span> {{ channelName(broadcast.tv_channel_id) }}</span>
        <span><span class="text-slate-400">Début :</span> {{ fmt(broadcast.start_at) }}</span>
      </div>
    </div>

    <form class="rounded-2xl border border-slate-200 bg-white p-6" @submit.prevent="submit">
      <h2 class="mb-5 text-sm font-semibold text-slate-700">Informations de série</h2>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-1 block text-xs font-medium text-slate-600">Saison</label>
          <input v-model="form.season" type="number" min="1" placeholder="ex: 3" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-slate-600">Épisode</label>
          <input v-model="form.episode" type="number" min="1" placeholder="ex: 12" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
        </div>
      </div>

      <p v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>

      <div class="mt-6 flex justify-end gap-3">
        <RouterLink :to="`/admin/tvstats/broadcasts/${broadcast.id}`" class="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</RouterLink>
        <button type="submit" class="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60" :disabled="saving">
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </form>
  </div>
</template>
