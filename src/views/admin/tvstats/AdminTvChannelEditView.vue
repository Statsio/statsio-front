<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { adminGetChannel, adminUpdateChannel, adminUploadChannelLogo, type AdminChannel } from '@/api/admin'

const route = useRoute()
const router = useRouter()

const channel = ref<AdminChannel | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)

const form = reactive({
  display_name: '',
  number: 1,
  epg_channel_id: '',
  logo_url: '',
  is_active: true,
})

const selectedFile = ref<File | null>(null)
const filePreview = ref<string | null>(null)

const logoPreview = computed(() => filePreview.value ?? (form.logo_url || null))

onMounted(async () => {
  const ch = await adminGetChannel(Number(route.params.id))
  channel.value = ch
  form.display_name = ch.display_name
  form.number = ch.number
  form.epg_channel_id = ch.epg_channel_id ?? ''
  form.logo_url = ch.logo_url ?? ''
  form.is_active = ch.is_active
  loading.value = false
})

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  selectedFile.value = file
  filePreview.value = file ? URL.createObjectURL(file) : null
}

function clearFile() {
  selectedFile.value = null
  filePreview.value = null
  const input = document.getElementById('logo-file') as HTMLInputElement | null
  if (input) input.value = ''
}

async function submit() {
  if (!channel.value) return
  error.value = null
  saving.value = true

  try {
    // If a file is selected, upload it first → it sets logo_url on the backend
    if (selectedFile.value) {
      const result = await adminUploadChannelLogo(channel.value.id, selectedFile.value)
      await adminUpdateChannel(channel.value.id, {
        display_name: form.display_name,
        number: form.number,
        epg_channel_id: form.epg_channel_id || null,
        is_active: form.is_active,
        logo_url: result.url,
      })
    } else {
      await adminUpdateChannel(channel.value.id, {
        display_name: form.display_name,
        number: form.number,
        epg_channel_id: form.epg_channel_id || null,
        logo_url: form.logo_url || null,
        is_active: form.is_active,
      })
    }

    router.push(`/admin/tvstats/channels/${channel.value.id}`)
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Erreur lors de la mise à jour.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="loading" class="py-20 text-center text-slate-400">Chargement…</div>
  <div v-else-if="channel" class="mx-auto max-w-2xl">
    <!-- Header -->
    <div class="mb-6 flex items-center gap-4">
      <RouterLink :to="`/admin/tvstats/channels/${channel.id}`" class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
        {{ channel.display_name }}
      </RouterLink>
      <span class="text-slate-300">/</span>
      <h1 class="text-xl font-bold text-slate-900">Modifier</h1>
    </div>

    <form class="space-y-6" @submit.prevent="submit">
      <!-- Identité -->
      <div class="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 class="mb-5 text-sm font-semibold text-slate-700">Identité</h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="mb-1 block text-xs font-medium text-slate-600">Nom affiché</label>
            <input v-model="form.display_name" required class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600">Numéro TNT</label>
            <input v-model.number="form.number" type="number" min="1" required class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600">EPG Channel ID</label>
            <input v-model="form.epg_channel_id" placeholder="ex: 443174" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono outline-none focus:border-slate-400" />
          </div>
          <div class="col-span-2">
            <label class="flex cursor-pointer items-center gap-3">
              <input v-model="form.is_active" type="checkbox" class="h-4 w-4 rounded" />
              <span class="text-sm text-slate-700">Chaîne active</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Logo -->
      <div class="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 class="mb-1 text-sm font-semibold text-slate-700">Logo</h2>
        <p class="mb-5 text-xs text-slate-400">Si un fichier est importé, il aura la priorité sur l'URL.</p>

        <!-- Preview -->
        <div v-if="logoPreview" class="mb-5 flex items-center gap-4">
          <div class="flex h-16 w-24 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2">
            <img :src="logoPreview" alt="Aperçu" class="max-h-full max-w-full object-contain" />
          </div>
          <span v-if="filePreview" class="text-xs font-medium text-emerald-600">Fichier sélectionné — remplacera l'URL</span>
          <span v-else class="text-xs text-slate-500">Aperçu URL actuelle</span>
        </div>

        <!-- URL -->
        <div class="mb-4">
          <label class="mb-1 block text-xs font-medium text-slate-600">URL du logo</label>
          <input v-model="form.logo_url" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" :class="filePreview ? 'opacity-40' : ''" />
        </div>

        <!-- File upload -->
        <div>
          <label class="mb-1 block text-xs font-medium text-slate-600">Importer un fichier <span class="text-slate-400">(PNG, JPG, WebP, SVG — max 2 Mo)</span></label>
          <div class="flex items-center gap-3">
            <label class="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
              Choisir un fichier
              <input id="logo-file" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" class="hidden" @change="onFileChange" />
            </label>
            <span v-if="selectedFile" class="text-sm text-slate-600">{{ selectedFile.name }}</span>
            <button v-if="selectedFile" type="button" class="text-sm text-red-400 hover:text-red-600" @click="clearFile">Retirer</button>
          </div>
        </div>
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <div class="flex justify-end gap-3">
        <RouterLink :to="`/admin/tvstats/channels/${channel.id}`" class="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</RouterLink>
        <button type="submit" class="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60" :disabled="saving">
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </form>
  </div>
</template>
