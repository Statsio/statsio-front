<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
import { ref, watch, onMounted } from 'vue'
import {
  adminListUsers,
  adminUpdateUser,
  adminDeleteUser,
  adminRestoreUser,
  type AdminUser,
} from '@/api/admin'

const users = ref<AdminUser[]>([])
const total = ref(0)
const lastPage = ref(1)
const isLoading = ref(false)
const error = ref('')

const search = ref('')
const statusFilter = ref('')
const page = ref(1)

const confirmDelete = ref<AdminUser | null>(null)
const editUser = ref<AdminUser | null>(null)
const isSaving = ref(false)
const saveError = ref('')

async function load() {
  isLoading.value = true
  error.value = ''
  try {
    const res = await adminListUsers({ page: page.value, search: search.value, status: statusFilter.value })
    users.value = res.data
    total.value = res.total
    lastPage.value = res.last_page
  } catch {
    error.value = 'Impossible de charger les utilisateurs.'
  } finally {
    isLoading.value = false
  }
}

watch([search, statusFilter], () => { page.value = 1; load() })
watch(page, load)
onMounted(load)

function userName(u: AdminUser) {
  const parts = [u.profile?.first_name, u.profile?.last_name].filter(Boolean)
  return parts.length ? parts.join(' ') : '—'
}

function statusLabel(u: AdminUser) {
  if (u.deleted_at) return 'Supprimé'
  return { active: 'Actif', suspended: 'Suspendu', banned: 'Banni' }[u.status] ?? u.status
}

function statusClass(u: AdminUser) {
  if (u.deleted_at) return 'bg-slate-100 text-slate-500'
  return {
    active: 'bg-emerald-100 text-emerald-700',
    suspended: 'bg-amber-100 text-amber-700',
    banned: 'bg-red-100 text-red-700',
  }[u.status] ?? 'bg-slate-100 text-slate-500'
}

async function toggleAdmin(u: AdminUser) {
  await adminUpdateUser(u.id, { is_admin: !u.is_admin })
  u.is_admin = !u.is_admin
}

async function doDelete() {
  if (!confirmDelete.value) return
  await adminDeleteUser(confirmDelete.value.id)
  confirmDelete.value = null
  load()
}

async function doRestore(u: AdminUser) {
  await adminRestoreUser(u.id)
  load()
}

async function saveEdit() {
  if (!editUser.value) return
  isSaving.value = true
  saveError.value = ''
  try {
    await adminUpdateUser(editUser.value.id, { status: editUser.value.status, is_admin: editUser.value.is_admin })
    editUser.value = null
    load()
  } catch {
    saveError.value = 'Erreur lors de la sauvegarde.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">Utilisateurs</h1>
      <span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">{{ total }} au total</span>
    </div>

    <!-- Filters -->
    <div class="mb-4 flex flex-wrap gap-3">
      <input
        v-model="search"
        type="search"
        placeholder="Rechercher par email ou nom..."
        class="min-w-64 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-slate-400"
      />
      <AppSelect
        v-model="statusFilter"
        :options="[{ value: 'active', label: 'Actif' }, { value: 'suspended', label: 'Suspendu' }, { value: 'banned', label: 'Banni' }, { value: 'deleted', label: 'Supprimé' }]"
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
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
            <th class="px-5 py-3">Utilisateur</th>
            <th class="px-5 py-3">Email</th>
            <th class="px-5 py-3">Statut</th>
            <th class="px-5 py-3">Admin</th>
            <th class="px-5 py-3">Inscrit le</th>
            <th class="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="u in users"
            :key="u.id"
            class="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
            :class="u.deleted_at ? 'opacity-50' : ''"
          >
            <td class="px-5 py-3 font-medium text-slate-900">{{ userName(u) }}</td>
            <td class="px-5 py-3 text-slate-500">{{ u.email }}</td>
            <td class="px-5 py-3">
              <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="statusClass(u)">
                {{ statusLabel(u) }}
              </span>
            </td>
            <td class="px-5 py-3">
              <button
                v-if="!u.deleted_at"
                class="rounded-full px-2 py-0.5 text-[11px] font-semibold transition"
                :class="u.is_admin ? 'bg-violet-100 text-violet-700 hover:bg-violet-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
                @click="toggleAdmin(u)"
              >
                {{ u.is_admin ? 'Admin' : 'Utilisateur' }}
              </button>
              <span v-else class="text-slate-300">—</span>
            </td>
            <td class="px-5 py-3 text-slate-400">
              {{ new Date(u.created_at).toLocaleDateString('fr-FR') }}
            </td>
            <td class="px-5 py-3 text-right">
              <div class="flex justify-end gap-2">
                <button
                  v-if="!u.deleted_at"
                  class="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                  @click="editUser = { ...u }"
                >
                  Modifier
                </button>
                <button
                  v-if="u.deleted_at"
                  class="rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50"
                  @click="doRestore(u)"
                >
                  Restaurer
                </button>
                <button
                  v-if="!u.deleted_at"
                  class="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                  @click="confirmDelete = u"
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

    <!-- Edit modal -->
    <Teleport to="body">
      <div v-if="editUser" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <h2 class="mb-4 text-lg font-bold text-slate-900">Modifier l'utilisateur</h2>
          <p class="mb-4 text-sm text-slate-500">{{ editUser.email }}</p>

          <label class="mb-3 block">
            <span class="text-xs font-semibold text-slate-500">Statut</span>
            <AppSelect
              v-model="editUser.status"
              :options="[{ value: 'active', label: 'Actif' }, { value: 'suspended', label: 'Suspendu' }, { value: 'banned', label: 'Banni' }]"
              class="mt-1"
            />
          </label>

          <label class="mb-5 flex items-center gap-3">
            <input v-model="editUser.is_admin" type="checkbox" class="rounded" />
            <span class="text-sm font-medium text-slate-700">Administrateur</span>
          </label>

          <p v-if="saveError" class="mb-3 text-sm text-red-600">{{ saveError }}</p>

          <div class="flex justify-end gap-3">
            <button
              class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              @click="editUser = null"
            >
              Annuler
            </button>
            <button
              class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              :disabled="isSaving"
              @click="saveEdit"
            >
              {{ isSaving ? 'Sauvegarde...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete confirm modal -->
    <Teleport to="body">
      <div v-if="confirmDelete" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <h2 class="mb-2 text-lg font-bold text-slate-900">Supprimer l'utilisateur ?</h2>
          <p class="mb-5 text-sm text-slate-500">
            <strong>{{ confirmDelete.email }}</strong> sera supprimé (soft delete, récupérable).
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
