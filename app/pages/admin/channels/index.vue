<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
import { ref, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import ChannelBadgeList from '@/components/channels/ChannelBadgeList.vue'
import {
  adminListEditorialChannels,
  adminSuspendEditorialChannel,
  adminBanEditorialChannel,
  adminActivateEditorialChannel,
  adminAnonymizeEditorialChannel,
  adminDeleteEditorialChannel,
  type AdminEditorialChannel,
  type AdminEditorialChannelDetail,
} from '@/api/admin'

const channels = ref<AdminEditorialChannel[]>([])
const total = ref(0)
const lastPage = ref(1)
const isLoading = ref(false)
const error = ref('')

const search = ref('')
const statusFilter = ref('')
const page = ref(1)

const confirmDelete = ref<AdminEditorialChannel | null>(null)
const actioningId = ref<number | null>(null)

async function load() {
  isLoading.value = true
  error.value = ''
  try {
    const res = await adminListEditorialChannels({ page: page.value, search: search.value, status: statusFilter.value })
    channels.value = res.data
    total.value = res.total
    lastPage.value = res.last_page
  } catch {
    error.value = 'Impossible de charger les chaînes.'
  } finally {
    isLoading.value = false
  }
}

watch([search, statusFilter], () => { page.value = 1; load() })
watch(page, load)
onMounted(load)

function ownerLabel(c: AdminEditorialChannel) {
  const owner = c.owners[0]
  if (!owner) return '—'
  const name = [owner.profile?.first_name, owner.profile?.last_name].filter(Boolean).join(' ')
  return name || owner.email
}

const statusLabels: Record<string, string> = {
  active: 'Active',
  suspended: 'Suspendue',
  banned: 'Bannie',
  anonymized: 'Anonymisée',
}

const statusClasses: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  suspended: 'bg-amber-100 text-amber-700',
  banned: 'bg-red-100 text-red-700',
  anonymized: 'bg-slate-200 text-slate-500',
}

async function runAction(c: AdminEditorialChannel, action: (id: number) => Promise<AdminEditorialChannelDetail>) {
  actioningId.value = c.id
  try {
    const updated = await action(c.id)
    Object.assign(c, updated)
  } catch {
    error.value = "L'action a échoué."
  } finally {
    actioningId.value = null
  }
}

async function doDelete() {
  if (!confirmDelete.value) return
  try {
    await adminDeleteEditorialChannel(confirmDelete.value.id)
    confirmDelete.value = null
    load()
  } catch {
    error.value = 'La suppression a échoué.'
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">Chaînes éditoriales</h1>
      <span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">{{ total }} au total</span>
    </div>

    <!-- Filters -->
    <div class="mb-4 flex flex-wrap gap-3">
      <input
        v-model="search"
        type="search"
        placeholder="Rechercher par nom ou identifiant..."
        class="min-w-64 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-slate-400"
      />
      <AppSelect
        v-model="statusFilter"
        :options="[
          { value: 'active', label: 'Active' },
          { value: 'suspended', label: 'Suspendue' },
          { value: 'banned', label: 'Bannie' },
          { value: 'anonymized', label: 'Anonymisée' },
        ]"
        placeholder="Tous les statuts"
        class="w-48"
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
            <th class="px-5 py-3">Chaîne</th>
            <th class="px-5 py-3">Propriétaire</th>
            <th class="px-5 py-3">Abonnés</th>
            <th class="px-5 py-3">Statut</th>
            <th class="px-5 py-3">Créée le</th>
            <th class="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in channels" :key="c.id" class="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
            <td class="px-5 py-3">
              <RouterLink :to="`/admin/channels/${c.id}`" class="flex items-center gap-3">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-900 text-xs font-bold text-white">
                  <img v-if="c.profile?.logo_url" :src="c.profile.logo_url" alt="" class="h-full w-full object-cover" />
                  <span v-else>{{ (c.profile?.name ?? '?').slice(0, 1).toUpperCase() }}</span>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <p class="truncate font-medium text-slate-900 hover:underline">{{ c.profile?.name ?? `Chaîne #${c.id}` }}</p>
                    <ChannelBadgeList :slugs="c.badges" :organization="c.organization" size="sm" />
                  </div>
                  <p class="truncate text-xs text-slate-400">@{{ c.profile?.handle ?? '—' }}</p>
                </div>
              </RouterLink>
            </td>
            <td class="px-5 py-3 text-slate-500">{{ ownerLabel(c) }}</td>
            <td class="px-5 py-3 text-slate-500">{{ c.subscribers_count }}</td>
            <td class="px-5 py-3">
              <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="statusClasses[c.status]">
                {{ statusLabels[c.status] ?? c.status }}
              </span>
            </td>
            <td class="px-5 py-3 text-slate-400">{{ new Date(c.created_at).toLocaleDateString('fr-FR') }}</td>
            <td class="px-5 py-3 text-right">
              <div class="flex flex-wrap justify-end gap-2">
                <RouterLink
                  :to="`/admin/channels/${c.id}`"
                  class="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Détails
                </RouterLink>
                <button
                  v-if="c.status !== 'suspended'"
                  :disabled="actioningId === c.id"
                  class="rounded-lg px-2.5 py-1 text-xs font-semibold text-amber-600 transition hover:bg-amber-50 disabled:opacity-50"
                  @click="runAction(c, adminSuspendEditorialChannel)"
                >
                  Suspendre
                </button>
                <button
                  v-if="c.status !== 'banned'"
                  :disabled="actioningId === c.id"
                  class="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  @click="runAction(c, adminBanEditorialChannel)"
                >
                  Bannir
                </button>
                <button
                  v-if="c.status !== 'active'"
                  :disabled="actioningId === c.id"
                  class="rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50"
                  @click="runAction(c, adminActivateEditorialChannel)"
                >
                  Activer
                </button>
                <button
                  v-if="c.status !== 'anonymized'"
                  :disabled="actioningId === c.id"
                  class="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                  @click="runAction(c, adminAnonymizeEditorialChannel)"
                >
                  Anonymiser
                </button>
                <button
                  class="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                  @click="confirmDelete = c"
                >
                  Supprimer
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!channels.length">
            <td colspan="6" class="px-5 py-16 text-center text-slate-400">Aucune chaîne trouvée.</td>
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

    <!-- Delete confirm modal -->
    <Teleport to="body">
      <div v-if="confirmDelete" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <h2 class="mb-2 text-lg font-bold text-slate-900">Supprimer la chaîne ?</h2>
          <p class="mb-5 text-sm text-slate-500">
            <strong>{{ confirmDelete.profile?.name ?? `Chaîne #${confirmDelete.id}` }}</strong> et tout son contenu seront définitivement supprimés. Cette action est irréversible.
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
