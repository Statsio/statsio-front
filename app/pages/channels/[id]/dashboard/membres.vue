<script setup lang="ts">
definePageMeta({ layout: 'channel-dashboard', middleware: ['auth'], ssr: false, title: 'Membres de la chaîne', robots: 'noindex,nofollow' })
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ChannelDashboardHeader from '@/components/channels/dashboard/ChannelDashboardHeader.vue'
import ChannelInviteMembersModal from '@/components/channels/ChannelInviteMembersModal.vue'
import {
  getChannelMembers,
  getChannelInvitations,
  revokeChannelInvitation,
  channelRoleLabels,
  type ChannelMember,
  type ChannelInvitation,
} from '@/api/channels'
import { getNameInitials } from '@/lib/format'

const route = useRoute()
const channelId = computed(() => Number(route.params.id))

const members = ref<ChannelMember[]>([])
const membersLoading = ref(true)
const invitations = ref<ChannelInvitation[]>([])
const inviteModalOpen = ref(false)
const revokingId = ref<number | null>(null)

async function loadMembers() {
  try {
    members.value = await getChannelMembers(channelId.value)
  } catch {
    /* silencieux */
  }
}

async function loadInvitations() {
  try {
    invitations.value = await getChannelInvitations(channelId.value)
  } catch {
    /* silencieux */
  }
}

onMounted(async () => {
  membersLoading.value = true
  await Promise.all([loadMembers(), loadInvitations()])
  membersLoading.value = false
})

async function revoke(invitationId: number) {
  revokingId.value = invitationId
  try {
    await revokeChannelInvitation(channelId.value, invitationId)
    await loadInvitations()
  } catch {
    /* silencieux */
  } finally {
    revokingId.value = null
  }
}
</script>

<template>
  <div>
    <ChannelDashboardHeader title="Membres" subtitle="L'équipe éditoriale de la chaîne et ses rôles.">
      <template #actions>
        <AppButton variant="gradient" size="md" @click="inviteModalOpen = true">Inviter un membre</AppButton>
      </template>
    </ChannelDashboardHeader>

    <div class="flex flex-col gap-3">
      <div v-if="membersLoading" class="space-y-3">
        <div v-for="i in 2" :key="i" class="h-16 animate-pulse rounded-2xl bg-slate-100" />
      </div>
      <template v-else>
        <div
          v-for="member in members"
          :key="member.id"
          class="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(20,20,30,0.05)]"
        >
          <AppAvatar
            :src="member.avatar ?? undefined"
            :initials="getNameInitials(member.name)"
            background="linear-gradient(135deg, var(--color-primary), var(--color-accent))"
          />
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

    <div v-if="invitations.length" class="mt-6 flex flex-col gap-3">
      <p class="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-400">Invitations en attente</p>
      <div
        v-for="invitation in invitations"
        :key="invitation.id"
        class="flex items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4"
      >
        <div class="min-w-0 flex-1">
          <p class="text-[14px] font-semibold text-slate-800">{{ invitation.email }}</p>
          <p class="mt-0.5 text-xs text-slate-400">
            Invité{{ invitation.invited_by_name ? ` par ${invitation.invited_by_name}` : '' }} le
            {{ new Date(invitation.created_at).toLocaleDateString('fr-FR') }}
          </p>
        </div>
        <span class="shrink-0 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
          {{ channelRoleLabels[invitation.role] ?? invitation.role }}
        </span>
        <AppButton variant="ghost" size="sm" :disabled="revokingId === invitation.id" @click="revoke(invitation.id)">
          {{ revokingId === invitation.id ? '…' : 'Annuler' }}
        </AppButton>
      </div>
    </div>

    <ChannelInviteMembersModal v-model:open="inviteModalOpen" :channel-id="channelId" @invited="loadInvitations" />
  </div>
</template>
