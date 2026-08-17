<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { getErrorMessage } from '@/lib/http-errors'
import { adminGetEditorialChannel, adminUpdateEditorialChannel, type AdminEditorialChannelDetail } from '@/api/admin'
import type { ChannelCategory } from '@/api/channels'
import StepChannelCategories from '@/components/channels/steps/StepChannelCategories.vue'

const route = useRoute()
const router = useRouter()

const channel = ref<AdminEditorialChannelDetail | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  handle: '',
  description: '',
  categories: [] as ChannelCategory[],
  custom_color_primary: '#8b5cf6',
  custom_color_secondary: '#3b82f6',
  country: '',
})

const inputClass = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400'

onMounted(async () => {
  const ch = await adminGetEditorialChannel(Number(route.params.id))
  channel.value = ch
  form.name = ch.profile?.name ?? ''
  form.handle = ch.profile?.handle ?? ''
  form.description = ch.profile?.description ?? ''
  form.categories = (ch.profile?.categories ?? []) as ChannelCategory[]
  form.custom_color_primary = ch.profile?.custom_color_primary || '#8b5cf6'
  form.custom_color_secondary = ch.profile?.custom_color_secondary || '#3b82f6'
  form.country = ch.profile?.country ?? ''
  loading.value = false
})

async function submit() {
  if (!channel.value) return
  saving.value = true
  error.value = ''
  try {
    await adminUpdateEditorialChannel(channel.value.id, {
      name: form.name,
      handle: form.handle,
      description: form.description,
      categories: form.categories,
      custom_color_primary: form.custom_color_primary,
      custom_color_secondary: form.custom_color_secondary,
      country: form.country || null,
    })
    router.push(`/admin/channels/${channel.value.id}`)
  } catch (e) {
    error.value = getErrorMessage(e, 'Erreur lors de la mise à jour.')
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
      <RouterLink :to="`/admin/channels/${channel.id}`" class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
        {{ channel.profile?.name ?? `Chaîne #${channel.id}` }}
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
            <label class="mb-1 block text-xs font-medium text-slate-600">Nom</label>
            <input v-model="form.name" required :class="inputClass" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600">Identifiant (@handle)</label>
            <input v-model="form.handle" required :class="inputClass + ' font-mono'" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600">Pays (code ISO2)</label>
            <input v-model="form.country" maxlength="2" placeholder="FR" :class="inputClass" />
          </div>
          <div class="col-span-2">
            <label class="mb-1 block text-xs font-medium text-slate-600">Description</label>
            <textarea v-model="form.description" rows="3" :class="inputClass + ' resize-none'" />
          </div>
        </div>
      </div>

      <!-- Catégories -->
      <div class="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 class="mb-5 text-sm font-semibold text-slate-700">Catégories</h2>
        <StepChannelCategories v-model="form.categories" />
      </div>

      <!-- Couleurs -->
      <div class="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 class="mb-5 text-sm font-semibold text-slate-700">Couleurs</h2>
        <div class="grid grid-cols-2 gap-4">
          <label class="flex flex-col gap-2">
            <span class="text-xs font-medium text-slate-600">Couleur principale</span>
            <div class="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
              <input v-model="form.custom_color_primary" type="color" class="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0" />
              <span class="font-mono text-sm text-slate-600">{{ form.custom_color_primary }}</span>
            </div>
          </label>
          <label class="flex flex-col gap-2">
            <span class="text-xs font-medium text-slate-600">Couleur secondaire</span>
            <div class="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
              <input v-model="form.custom_color_secondary" type="color" class="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0" />
              <span class="font-mono text-sm text-slate-600">{{ form.custom_color_secondary }}</span>
            </div>
          </label>
        </div>
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <div class="flex justify-end gap-3">
        <RouterLink :to="`/admin/channels/${channel.id}`" class="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</RouterLink>
        <button type="submit" class="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60" :disabled="saving">
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </form>
  </div>
</template>
