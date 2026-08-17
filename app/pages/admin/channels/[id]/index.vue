<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { getErrorMessage } from '@/lib/http-errors'
import {
  adminGetEditorialChannel,
  adminSuspendEditorialChannel,
  adminBanEditorialChannel,
  adminActivateEditorialChannel,
  adminAnonymizeEditorialChannel,
  adminSyncEditorialChannelBadges,
  adminDeleteEditorialChannel,
  type AdminEditorialChannelDetail,
} from '@/api/admin'
import { channelCategoryLabels, CHANNEL_BADGE_LABELS, type ChannelCategory } from '@/api/channels'
import ChannelBadgeList from '@/components/channels/ChannelBadgeList.vue'

const route = useRoute()
const router = useRouter()

const channel = ref<AdminEditorialChannelDetail | null>(null)
const loading = ref(true)
const actionLoading = ref(false)
const actionError = ref('')
const deleteConfirm = ref(false)
const deleteLoading = ref(false)
const deleteError = ref('')

async function load() {
  channel.value = await adminGetEditorialChannel(Number(route.params.id))
  loading.value = false
}

onMounted(load)

const statusLabels: Record<string, string> = {
  active: 'Active',
  suspended: 'Suspendue',
  banned: 'Bannie',
  anonymized: 'Anonymisée',
}

const statusClasses: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  suspended: 'bg-amber-50 text-amber-700',
  banned: 'bg-red-50 text-red-700',
  anonymized: 'bg-slate-100 text-slate-500',
}

const roleLabels: Record<string, string> = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  redactor: 'Rédacteur',
  guest: 'Invité',
}

function memberName(m: AdminEditorialChannelDetail['management_team'][number]) {
  const name = [m.profile?.first_name, m.profile?.last_name].filter(Boolean).join(' ')
  return name || m.email
}

async function runAction(action: (id: number) => Promise<AdminEditorialChannelDetail>) {
  if (!channel.value) return
  actionLoading.value = true
  actionError.value = ''
  try {
    channel.value = await action(channel.value.id)
  } catch (e) {
    actionError.value = getErrorMessage(e, "L'action a échoué.")
  } finally {
    actionLoading.value = false
  }
}

const badgeLoading = ref(false)
const badgeError = ref('')

async function toggleBadge(slug: string) {
  if (!channel.value) return
  const current = channel.value.badges
  const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]

  badgeLoading.value = true
  badgeError.value = ''
  try {
    channel.value = await adminSyncEditorialChannelBadges(channel.value.id, next)
  } catch (e) {
    badgeError.value = getErrorMessage(e, "Impossible de mettre à jour les badges.")
  } finally {
    badgeLoading.value = false
  }
}

async function doDelete() {
  if (!channel.value) return
  deleteLoading.value = true
  deleteError.value = ''
  try {
    await adminDeleteEditorialChannel(channel.value.id)
    router.push('/admin/channels')
  } catch (e) {
    deleteError.value = getErrorMessage(e, 'Impossible de supprimer cette chaîne.')
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
        <RouterLink to="/admin/channels" class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          Chaînes
        </RouterLink>
        <span class="text-slate-300">/</span>
        <h1 class="text-xl font-bold text-slate-900">{{ channel.profile?.name ?? `Chaîne #${channel.id}` }}</h1>
      </div>
      <RouterLink :to="`/admin/channels/${channel.id}/edit`" class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
        Modifier
      </RouterLink>
    </div>

    <!-- Identité -->
    <div class="mb-4 rounded-2xl border border-slate-200 bg-white p-6">
      <div class="flex gap-6">
        <div v-if="channel.profile?.logo_url" class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <img :src="channel.profile.logo_url" :alt="channel.profile.name" class="h-full w-full object-cover" />
        </div>
        <div v-else class="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-2xl font-bold text-white">
          {{ (channel.profile?.name ?? '?').slice(0, 1).toUpperCase() }}
        </div>
        <div class="flex-1">
          <dl class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt class="text-xs font-medium text-slate-500">Nom</dt>
              <dd class="flex items-center gap-1.5 font-medium text-slate-900">
                {{ channel.profile?.name ?? '—' }}
                <ChannelBadgeList :slugs="channel.badges" :organization="channel.organization" size="sm" />
              </dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-slate-500">Identifiant</dt>
              <dd class="font-mono text-slate-700">@{{ channel.profile?.handle ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-slate-500">Abonnés</dt>
              <dd class="text-slate-700">{{ channel.subscribers_count }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-slate-500">Vues</dt>
              <dd class="text-slate-700">{{ channel.profile?.view_count ?? 0 }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-slate-500">Statut</dt>
              <dd>
                <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="statusClasses[channel.status]">
                  {{ statusLabels[channel.status] ?? channel.status }}
                </span>
              </dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-slate-500">Créée le</dt>
              <dd class="text-slate-700">{{ new Date(channel.created_at).toLocaleDateString('fr-FR') }}</dd>
            </div>
          </dl>
          <div v-if="channel.profile?.description" class="mt-3">
            <dt class="text-xs font-medium text-slate-500">Description</dt>
            <dd class="mt-0.5 text-sm text-slate-600">{{ channel.profile.description }}</dd>
          </div>
          <div v-if="channel.profile?.categories?.length" class="mt-3 flex flex-wrap gap-1.5">
            <span v-for="c in channel.profile.categories" :key="c" class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
              {{ channelCategoryLabels[c as ChannelCategory] ?? c }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Équipe -->
    <div class="mb-4 rounded-2xl border border-slate-200 bg-white p-6">
      <h3 class="mb-4 text-sm font-semibold text-slate-700">Équipe</h3>
      <div v-if="!channel.management_team.length" class="text-sm text-slate-400">Aucun membre.</div>
      <div v-else class="flex flex-col gap-2">
        <div v-for="m in channel.management_team" :key="m.id" class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
          <div>
            <p class="font-medium text-slate-900">{{ memberName(m) }}</p>
            <p class="text-xs text-slate-400">{{ m.email }}</p>
          </div>
          <span class="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            {{ roleLabels[m.pivot.role] ?? m.pivot.role }}
          </span>
        </div>
      </div>
    </div>

    <!-- Modération -->
    <div class="mb-4 rounded-2xl border border-slate-200 bg-white p-6">
      <h3 class="mb-1 text-sm font-semibold text-slate-700">Modération</h3>
      <p class="mb-4 text-xs text-slate-400">Change le statut visible publiquement de la chaîne.</p>
      <p v-if="actionError" class="mb-3 text-sm text-red-600">{{ actionError }}</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-if="channel.status !== 'active'"
          :disabled="actionLoading"
          class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
          @click="runAction(adminActivateEditorialChannel)"
        >
          Activer
        </button>
        <button
          v-if="channel.status !== 'suspended'"
          :disabled="actionLoading"
          class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
          @click="runAction(adminSuspendEditorialChannel)"
        >
          Suspendre
        </button>
        <button
          v-if="channel.status !== 'banned'"
          :disabled="actionLoading"
          class="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          @click="runAction(adminBanEditorialChannel)"
        >
          Bannir
        </button>
        <button
          v-if="channel.status !== 'anonymized'"
          :disabled="actionLoading"
          class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          @click="runAction(adminAnonymizeEditorialChannel)"
        >
          Anonymiser
        </button>
      </div>
    </div>

    <!-- Badges -->
    <div class="mb-4 rounded-2xl border border-slate-200 bg-white p-6">
      <h3 class="mb-1 text-sm font-semibold text-slate-700">Badges</h3>
      <p class="mb-4 text-xs text-slate-400">Signaux de confiance affichés partout où le nom de la chaîne apparaît.</p>
      <p v-if="badgeError" class="mb-3 text-sm text-red-600">{{ badgeError }}</p>
      <div class="flex flex-col gap-2">
        <label
          v-for="(label, slug) in CHANNEL_BADGE_LABELS"
          :key="slug"
          class="flex items-center gap-2.5 text-sm text-slate-700"
        >
          <input
            type="checkbox"
            :checked="channel.badges.includes(slug)"
            :disabled="badgeLoading"
            class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
            @change="toggleBadge(slug)"
          />
          {{ label }}
        </label>
      </div>
    </div>

    <!-- Danger zone -->
    <div class="rounded-2xl border border-red-100 bg-red-50 p-5">
      <h3 class="mb-2 text-sm font-semibold text-red-800">Zone de danger</h3>
      <p class="mb-4 text-sm text-red-700">
        La suppression efface définitivement le profil, les contenus et l'historique d'abonnés de la chaîne.
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
