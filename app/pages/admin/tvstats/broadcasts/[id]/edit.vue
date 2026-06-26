<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
import { ref, reactive, onMounted } from 'vue'
import { getErrorMessage } from '@/lib/http-errors'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { adminGetBroadcast, adminUpdateBroadcast, adminUpdateBroadcastAudience, BROADCAST_TYPES, type AdminBroadcast } from '@/api/admin'
import { TNT_CHANNELS } from '@/data/tnt-channels'

const route = useRoute()
const router = useRouter()

const broadcast = ref<AdminBroadcast | null>(null)
const loading = ref(true)
const saving = ref(false)
const savingAudience = ref(false)
const error = ref<string | null>(null)
const audienceError = ref<string | null>(null)
const audienceSaved = ref(false)

const form = reactive({
  season: '' as string | number,
  episode: '' as string | number,
  broadcast_type: '' as string,
})

const audienceForm = reactive({
  pda: '' as string | number,
  rank: '' as string | number,
  mediametrie_viewers: '' as string | number,
})

function channelName(slug: string) {
  return TNT_CHANNELS.find((c) => c.id === slug)?.displayName ?? slug
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  const b = await adminGetBroadcast(Number(route.params.id))
  broadcast.value = b
  form.season = b.season ?? ''
  form.episode = b.episode ?? ''
  form.broadcast_type = b.broadcast_type ?? ''
  audienceForm.pda = b.audience?.pda ?? ''
  audienceForm.rank = b.audience?.rank ?? ''
  audienceForm.mediametrie_viewers = b.audience?.mediametrie_viewers ?? ''
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
      broadcast_type: (form.broadcast_type as any) || null,
    })
    router.push(`/admin/tvstats/broadcasts/${broadcast.value.id}`)
  } catch (e) {
    error.value = getErrorMessage(e, 'Erreur lors de la mise à jour.')
  } finally {
    saving.value = false
  }
}

async function submitAudience() {
  if (!broadcast.value) return
  audienceError.value = null
  audienceSaved.value = false
  savingAudience.value = true
  try {
    const updated = await adminUpdateBroadcastAudience(broadcast.value.id, {
      pda: audienceForm.pda !== '' ? Number(audienceForm.pda) : null,
      rank: audienceForm.rank !== '' ? Number(audienceForm.rank) : null,
      mediametrie_viewers: audienceForm.mediametrie_viewers !== '' ? Number(audienceForm.mediametrie_viewers) : null,
    })
    broadcast.value = updated
    audienceSaved.value = true
    setTimeout(() => (audienceSaved.value = false), 3000)
  } catch (e) {
    audienceError.value = getErrorMessage(e, 'Erreur lors de la mise à jour des audiences.')
  } finally {
    savingAudience.value = false
  }
}
</script>

<template>
  <div v-if="loading" class="py-20 text-center text-slate-400">Chargement…</div>
  <div v-else-if="broadcast" class="mx-auto max-w-2xl">
    <!-- Breadcrumb -->
    <div class="mb-6 flex items-center gap-4">
      <RouterLink :to="`/admin/tvstats/broadcasts/${broadcast.id}`" class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        {{ broadcast.program?.title ?? 'Diffusion' }}
      </RouterLink>
      <span class="text-slate-300">/</span>
      <h1 class="text-xl font-bold text-slate-900">Modifier</h1>
    </div>

    <!-- Context info (read-only) -->
    <div class="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm">
      <div class="flex flex-wrap gap-x-8 gap-y-1 text-slate-600">
        <span><span class="text-slate-400">Programme :</span> {{ broadcast.program?.title ?? '—' }}</span>
        <span><span class="text-slate-400">Chaîne :</span> {{ channelName(broadcast.tv_channel_id) }}</span>
        <span><span class="text-slate-400">Début :</span> {{ fmt(broadcast.start_at) }}</span>
      </div>
    </div>

    <div class="space-y-5">

      <!-- Diffusion -->
      <form class="rounded-2xl border border-slate-200 bg-white p-6" @submit.prevent="submit">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Informations de diffusion</h2>
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600">Type de diffusion</label>
            <select v-model="form.broadcast_type" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 bg-white">
              <option value="">— Non renseigné —</option>
              <option v-for="bt in BROADCAST_TYPES" :key="bt.value" :value="bt.value">{{ bt.label }}</option>
            </select>
          </div>
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
        </div>

        <p v-if="error" class="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{{ error }}</p>

        <div class="mt-6 flex justify-end gap-3">
          <RouterLink :to="`/admin/tvstats/broadcasts/${broadcast.id}`" class="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
            Annuler
          </RouterLink>
          <button type="submit" class="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60" :disabled="saving">
            {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
          </button>
        </div>
      </form>

      <!-- Audiences Médiamétrie -->
      <form class="rounded-2xl border border-slate-200 bg-white p-6" @submit.prevent="submitAudience">
        <h2 class="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-400">Audiences Médiamétrie</h2>
        <p class="mb-4 text-xs text-slate-500">Chiffres à saisir le lendemain de la diffusion après publication des résultats.</p>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600">PDA (%)</label>
            <input
              v-model="audienceForm.pda"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="ex: 18.5"
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600">Classement</label>
            <input
              v-model="audienceForm.rank"
              type="number"
              min="1"
              placeholder="ex: 1"
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600">Spectateurs Médiamétrie</label>
            <input
              v-model="audienceForm.mediametrie_viewers"
              type="number"
              min="0"
              placeholder="ex: 4200000"
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>
        </div>

        <p v-if="audienceError" class="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{{ audienceError }}</p>
        <p v-if="audienceSaved" class="mt-4 rounded-xl bg-green-50 px-4 py-2 text-sm text-green-700">Audiences enregistrées.</p>

        <div class="mt-4 flex justify-end">
          <button type="submit" class="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60" :disabled="savingAudience">
            {{ savingAudience ? 'Enregistrement…' : 'Enregistrer les audiences' }}
          </button>
        </div>
      </form>

    </div>
  </div>
</template>
