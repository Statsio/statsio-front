<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
import { ref, watch, onMounted } from 'vue'
import {
  adminListContactMessages,
  adminUpdateContactMessageStatus,
  adminDeleteContactMessage,
  type AdminContactMessage,
} from '@/api/admin'

const messages = ref<AdminContactMessage[]>([])
const total = ref(0)
const lastPage = ref(1)
const isLoading = ref(false)
const error = ref('')

const search = ref('')
const reasonFilter = ref('')
const statusFilter = ref('')
const page = ref(1)

const viewMessage = ref<AdminContactMessage | null>(null)
const confirmDelete = ref<AdminContactMessage | null>(null)

async function load() {
  isLoading.value = true
  error.value = ''
  try {
    const res = await adminListContactMessages({
      page: page.value,
      search: search.value,
      reason: reasonFilter.value,
      status: statusFilter.value,
    })
    messages.value = res.data
    total.value = res.total
    lastPage.value = res.last_page
  } catch {
    error.value = 'Impossible de charger les messages.'
  } finally {
    isLoading.value = false
  }
}

watch([search, reasonFilter, statusFilter], () => {
  page.value = 1
  load()
})
watch(page, load)
onMounted(load)

const REASON_LABELS: Record<string, string> = {
  general: 'Question générale',
  partenariat: 'Partenariat',
  presse: 'Presse & médias',
  commercial: 'Ventes & offres pro',
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Nouveau',
  in_progress: 'En cours',
  resolved: 'Résolu',
}

const STATUS_CLASSES: Record<string, string> = {
  new: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-sky-100 text-sky-700',
  resolved: 'bg-emerald-100 text-emerald-700',
}

async function setStatus(m: AdminContactMessage, status: AdminContactMessage['status']) {
  const updated = await adminUpdateContactMessageStatus(m.id, status)
  m.status = updated.status
  if (viewMessage.value?.id === m.id) viewMessage.value.status = updated.status
}

async function doDelete() {
  if (!confirmDelete.value) return
  await adminDeleteContactMessage(confirmDelete.value.id)
  confirmDelete.value = null
  viewMessage.value = null
  load()
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">Messages de contact</h1>
      <span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600"
        >{{ total }} au total</span
      >
    </div>

    <!-- Filters -->
    <div class="mb-4 flex flex-wrap gap-3">
      <input
        v-model="search"
        type="search"
        placeholder="Rechercher par nom, e-mail ou contenu..."
        class="min-w-64 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-slate-400"
      />
      <AppSelect
        v-model="reasonFilter"
        :options="[
          { value: 'general', label: 'Question générale' },
          { value: 'partenariat', label: 'Partenariat' },
          { value: 'presse', label: 'Presse & médias' },
          { value: 'commercial', label: 'Ventes & offres pro' },
        ]"
        placeholder="Tous les motifs"
        class="w-52"
      />
      <AppSelect
        v-model="statusFilter"
        :options="[
          { value: 'new', label: 'Nouveau' },
          { value: 'in_progress', label: 'En cours' },
          { value: 'resolved', label: 'Résolu' },
        ]"
        placeholder="Tous les statuts"
        class="w-44"
      />
    </div>

    <!-- Error -->
    <div v-if="error" class="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">{{ error }}</div>

    <!-- Table -->
    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div v-if="isLoading" class="flex items-center justify-center py-16 text-slate-400">
        Chargement...
      </div>
      <div
        v-else-if="messages.length === 0"
        class="flex items-center justify-center py-16 text-slate-400"
      >
        Aucun message.
      </div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr
            class="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-widest text-slate-400"
          >
            <th class="px-5 py-3">De</th>
            <th class="px-5 py-3">Motif</th>
            <th class="px-5 py-3">Statut</th>
            <th class="px-5 py-3">Reçu le</th>
            <th class="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="m in messages"
            :key="m.id"
            class="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
            @click="viewMessage = m"
          >
            <td class="px-5 py-3">
              <p class="font-medium text-slate-900">{{ m.name }}</p>
              <p class="text-xs text-slate-400">{{ m.email }}</p>
            </td>
            <td class="px-5 py-3 text-slate-500">{{ REASON_LABELS[m.reason] ?? m.reason }}</td>
            <td class="px-5 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                :class="STATUS_CLASSES[m.status]"
              >
                {{ STATUS_LABELS[m.status] ?? m.status }}
              </span>
            </td>
            <td class="px-5 py-3 text-slate-400">
              {{ new Date(m.created_at).toLocaleDateString('fr-FR') }}
            </td>
            <td class="px-5 py-3 text-right" @click.stop>
              <div class="flex justify-end gap-2">
                <button
                  class="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                  @click="viewMessage = m"
                >
                  Voir
                </button>
                <button
                  class="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                  @click="confirmDelete = m"
                >
                  Supprimer
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="lastPage > 1" class="mt-4 flex items-center justify-between text-sm text-slate-500">
      <span>Page {{ page }} / {{ lastPage }}</span>
      <div class="flex gap-2">
        <button
          :disabled="page <= 1"
          class="rounded-lg border border-slate-200 px-3 py-1.5 transition hover:bg-slate-50 disabled:opacity-40"
          @click="page--"
        >
          ← Précédent
        </button>
        <button
          :disabled="page >= lastPage"
          class="rounded-lg border border-slate-200 px-3 py-1.5 transition hover:bg-slate-50 disabled:opacity-40"
          @click="page++"
        >
          Suivant →
        </button>
      </div>
    </div>

    <!-- Detail modal -->
    <Teleport to="body">
      <div
        v-if="viewMessage"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      >
        <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <div class="mb-4 flex items-start justify-between">
            <div>
              <h2 class="text-lg font-bold text-slate-900">{{ viewMessage.name }}</h2>
              <p class="text-sm text-slate-500">{{ viewMessage.email }}</p>
              <p v-if="viewMessage.company" class="text-xs text-slate-400">
                {{ viewMessage.company }}
              </p>
            </div>
            <span
              class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
              :class="STATUS_CLASSES[viewMessage.status]"
            >
              {{ STATUS_LABELS[viewMessage.status] ?? viewMessage.status }}
            </span>
          </div>

          <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
            {{ REASON_LABELS[viewMessage.reason] ?? viewMessage.reason }}
          </p>
          <p class="mb-5 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            {{ viewMessage.message }}
          </p>

          <div class="mb-5 flex flex-wrap gap-2">
            <button
              v-for="s in ['new', 'in_progress', 'resolved'] as const"
              :key="s"
              class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
              :class="
                viewMessage.status === s
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              "
              @click="setStatus(viewMessage, s)"
            >
              {{ STATUS_LABELS[s] }}
            </button>
          </div>

          <div class="flex justify-end gap-3">
            <button
              class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              @click="viewMessage = null"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete confirm modal -->
    <Teleport to="body">
      <div
        v-if="confirmDelete"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      >
        <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <h2 class="mb-2 text-lg font-bold text-slate-900">Supprimer ce message ?</h2>
          <p class="mb-5 text-sm text-slate-500">
            Le message de <strong>{{ confirmDelete.name }}</strong> sera définitivement supprimé.
          </p>
          <div class="flex justify-end gap-3">
            <button
              class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              @click="confirmDelete = null"
            >
              Annuler
            </button>
            <button
              class="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              @click="doDelete"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
