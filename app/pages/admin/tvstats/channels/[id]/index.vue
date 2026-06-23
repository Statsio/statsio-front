<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { adminGetChannel, adminDeleteChannel, adminUpdateChannel, type AdminChannel } from '@/api/admin'

const route = useRoute()
const router = useRouter()

const channel = ref<AdminChannel | null>(null)
const loading = ref(true)
const deleteConfirm = ref(false)
const deleteLoading = ref(false)
const deleteError = ref<string | null>(null)

onMounted(async () => {
  channel.value = await adminGetChannel(Number(route.params.id))
  loading.value = false
})

async function toggleActive() {
  if (!channel.value) return
  await adminUpdateChannel(channel.value.id, { is_active: !channel.value.is_active })
  channel.value.is_active = !channel.value.is_active
}

async function doDelete() {
  if (!channel.value) return
  deleteLoading.value = true
  deleteError.value = null
  try {
    await adminDeleteChannel(channel.value.id)
    router.push('/admin/tvstats/channels')
  } catch (e: any) {
    deleteError.value = e?.response?.data?.message ?? 'Impossible de supprimer cette chaîne.'
    deleteLoading.value = false
  }
}
</script>

<template>
  <div v-if="loading" class="py-20 text-center text-slate-400">Chargement…</div>
  <div v-else-if="channel" class="mx-auto max-w-2xl">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <RouterLink to="/admin/tvstats/channels" class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          Chaînes
        </RouterLink>
        <span class="text-slate-300">/</span>
        <h1 class="text-xl font-bold text-slate-900">{{ channel.display_name }}</h1>
      </div>
      <RouterLink :to="`/admin/tvstats/channels/${channel.id}/edit`" class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
        Modifier
      </RouterLink>
    </div>

    <!-- Logo + info -->
    <div class="mb-4 rounded-2xl border border-slate-200 bg-white p-6">
      <div class="flex gap-6">
        <div v-if="channel.logo_url" class="flex h-20 w-28 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2">
          <img :src="channel.logo_url" :alt="channel.display_name" class="max-h-full max-w-full object-contain" />
        </div>
        <div class="flex-1">
          <dl class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt class="text-xs font-medium text-slate-500">Nom affiché</dt>
              <dd class="font-medium text-slate-900">{{ channel.display_name }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-slate-500">Numéro TNT</dt>
              <dd class="font-medium text-slate-900">{{ channel.number }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-slate-500">Slug</dt>
              <dd class="font-mono text-slate-700">{{ channel.slug }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-slate-500">EPG Channel ID</dt>
              <dd class="font-mono text-slate-700">{{ channel.epg_channel_id ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-slate-500">Diffusions</dt>
              <dd class="text-slate-700">{{ channel.broadcasts_count?.toLocaleString('fr-FR') ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-slate-500">Statut</dt>
              <dd class="flex items-center gap-2">
                <button
                  class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="channel.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'"
                  @click="toggleActive"
                >{{ channel.is_active ? 'Active' : 'Inactive' }}</button>
              </dd>
            </div>
          </dl>
          <div v-if="channel.logo_url" class="mt-3">
            <dt class="text-xs font-medium text-slate-500">URL du logo</dt>
            <dd class="mt-0.5 break-all font-mono text-xs text-slate-500">{{ channel.logo_url }}</dd>
          </div>
        </div>
      </div>
    </div>

    <!-- Danger zone -->
    <div class="rounded-2xl border border-red-100 bg-red-50 p-5">
      <h3 class="mb-2 text-sm font-semibold text-red-800">Zone de danger</h3>
      <p class="mb-4 text-sm text-red-700">
        La suppression est irréversible. Elle échouera si des diffusions sont rattachées à cette chaîne
        <span v-if="channel.broadcasts_count">({{ channel.broadcasts_count }} actuellement)</span>.
      </p>
      <div v-if="!deleteConfirm">
        <button class="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100" @click="deleteConfirm = true">
          Supprimer cette chaîne
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
