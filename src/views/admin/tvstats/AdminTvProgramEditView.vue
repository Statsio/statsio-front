<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { adminGetProgram, adminUpdateProgram, type AdminProgramDetail } from '@/api/admin'

const route = useRoute()
const router = useRouter()

const program = ref<AdminProgramDetail | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)

const form = reactive({ title: '', type: '', description: '' })

onMounted(async () => {
  const p = await adminGetProgram(Number(route.params.id))
  program.value = p
  form.title = p.title
  form.type = p.type ?? ''
  form.description = p.description ?? ''
  loading.value = false
})

async function submit() {
  if (!program.value) return
  error.value = null
  saving.value = true
  try {
    await adminUpdateProgram(program.value.id, {
      title: form.title,
      type: form.type || null,
      description: form.description || null,
    })
    router.push(`/admin/tvstats/programs/${program.value.id}`)
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Erreur lors de la mise à jour.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="loading" class="py-20 text-center text-slate-400">Chargement…</div>
  <div v-else-if="program" class="mx-auto max-w-2xl">
    <!-- Header -->
    <div class="mb-6 flex items-center gap-4">
      <RouterLink :to="`/admin/tvstats/programs/${program.id}`" class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
        {{ program.title }}
      </RouterLink>
      <span class="text-slate-300">/</span>
      <h1 class="text-xl font-bold text-slate-900">Modifier</h1>
    </div>

    <form class="rounded-2xl border border-slate-200 bg-white p-6" @submit.prevent="submit">
      <div class="space-y-5">
        <div>
          <label class="mb-1 block text-xs font-medium text-slate-600">Titre</label>
          <input v-model="form.title" required class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-slate-600">Type / Genre</label>
          <input v-model="form.type" placeholder="ex: Série, Documentaire, Sport…" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-slate-600">Description</label>
          <textarea v-model="form.description" rows="6" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 resize-y" />
        </div>
      </div>

      <p v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>

      <div class="mt-6 flex justify-end gap-3">
        <RouterLink :to="`/admin/tvstats/programs/${program.id}`" class="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</RouterLink>
        <button type="submit" class="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60" :disabled="saving">
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </form>
  </div>
</template>
