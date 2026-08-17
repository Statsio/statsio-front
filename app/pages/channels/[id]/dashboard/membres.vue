<script setup lang="ts">
definePageMeta({ layout: 'channel-dashboard', middleware: ['auth'], ssr: false, title: 'Membres de la chaîne', robots: 'noindex,nofollow' })
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ChannelInviteMembersModal from '@/components/channels/ChannelInviteMembersModal.vue'
import {
  getChannelMembers,
  getChannelInvitations,
  revokeChannelInvitation,
  channelRoleLabels,
  type ChannelMember,
  type ChannelInvitation,
} from '@/api/channels'
import { useChannelDashboard } from '@/composables/useChannelDashboard'
import { getNameInitials } from '@/lib/format'

const route = useRoute()
const channelId = computed(() => Number(route.params.id))
const { channel, isLoading, loadError, ensureLoaded } = useChannelDashboard()

const members = ref<ChannelMember[]>([])
const membersLoading = ref(true)
const invitations = ref<ChannelInvitation[]>([])
const inviteModalOpen = ref(false)
const revokingId = ref<number | null>(null)

async function loadMembers() {
  try {
    members.value = await getChannelMembers(channelId.value)
  } catch {}
}

async function loadInvitations() {
  try {
    invitations.value = await getChannelInvitations(channelId.value)
  } catch {}
}

onMounted(async () => {
  await ensureLoaded(channelId.value)
  membersLoading.value = true
  await Promise.all([loadMembers(), loadInvitations()])
  membersLoading.value = false
})

async function onInvited() {
  await loadInvitations()
}

async function revoke(invitationId: number) {
  revokingId.value = invitationId
  try {
    await revokeChannelInvitation(channelId.value, invitationId)
    await loadInvitations()
  } catch {}
  finally { revokingId.value = null }
}
</script>

<template>
  <div class="mx-auto flex max-w-4xl flex-col gap-6">

    <template v-if="isLoading">
      <div class="h-10 w-64 animate-pulse rounded-2xl bg-slate-200" />
      <div class="h-72 animate-pulse rounded-[2rem] bg-slate-100" />
    </template>

    <p v-else-if="loadError" class="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
      {{ loadError }}
    </p>

    <template v-else-if="channel">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-[26px] font-bold text-slate-950">Membres</h1>
          <p class="mt-1.5 text-[14.5px] text-slate-500">L'équipe éditoriale de {{ channel.profile.name }}.</p>
        </div>
        <AppButton variant="primary" size="md" @click="inviteModalOpen = true">+ Inviter un membre</AppButton>
      </div>

      <div class="flex flex-col gap-3">
        <div v-if="membersLoading" class="space-y-3">
          <div v-for="i in 2" :key="i" class="h-16 animate-pulse rounded-[1.5rem] bg-slate-100" />
        </div>
        <template v-else>
          <div
            v-for="member in members"
            :key="member.id"
            class="card-xl flex items-center gap-4 p-5"
          >
            <AppAvatar :src="member.avatar ?? undefined" :initials="getNameInitials(member.name)" background="var(--color-primary)" />
            <div class="min-w-0 flex-1">
              <p class="text-[14.5px] font-bold text-slate-950">{{ member.name }}</p>
              <p class="mt-0.5 text-[12.5px] text-slate-500">{{ member.email }}</p>
            </div>
            <span class="shrink-0 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary">
              {{ channelRoleLabels[member.role] ?? member.role }}
            </span>
          </div>
          <p v-if="!members.length" class="text-sm text-slate-400">Aucun membre trouvé.</p>
        </template>
      </div>

      <!-- Invitations en attente -->
      <div v-if="invitations.length" class="flex flex-col gap-3">
        <p class="eyebrow text-slate-400">Invitations en attente</p>
        <div
          v-for="invitation in invitations"
          :key="invitation.id"
          class="flex items-center gap-4 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-4"
        >
          <div class="min-w-0 flex-1">
            <p class="text-[14.5px] font-semibold text-slate-800">{{ invitation.email }}</p>
            <p class="mt-0.5 text-xs text-slate-400">
              Invité{{ invitation.invited_by_name ? ` par ${invitation.invited_by_name}` : '' }} le {{ new Date(invitation.created_at).toLocaleDateString('fr-FR') }}
            </p>
          </div>
          <span class="shrink-0 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
            {{ channelRoleLabels[invitation.role] ?? invitation.role }}
          </span>
          <AppButton variant="ghost" size="sm" :disabled="revokingId === invitation.id" @click="revoke(invitation.id)">
            {{ revokingId === invitation.id ? '...' : 'Annuler' }}
          </AppButton>
        </div>
      </div>
    </template>

    <ChannelInviteMembersModal
      v-model:open="inviteModalOpen"
      :channel-id="channelId"
      @invited="onInvited"
    />

  </div>
</template>
