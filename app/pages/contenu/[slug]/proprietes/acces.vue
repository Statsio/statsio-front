<script setup lang="ts">
definePageMeta({
  layout: 'content-dashboard',
  middleware: ['auth'],
  ssr: false,
  title: 'Accès & partage',
  robots: 'noindex,nofollow',
})

import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ContentDashboardHeader from '@/components/contents/dashboard/ContentDashboardHeader.vue'
import ContentInviteCollaboratorsModal from '@/components/contents/dashboard/ContentInviteCollaboratorsModal.vue'
import StatsDataSettingsCard from '@/components/statsdata/settings/StatsDataSettingsCard.vue'
import {
  deleteStatsDataDocument,
  getContentCollaborators,
  getContentInvitations,
  removeContentCollaborator,
  revokeContentInvitation,
  updateContentCollaborator,
  type ContentAccessLevel,
  type ContentAccessResource,
  type ContentCollaborator,
  type ContentInvitation,
} from '@/api/studio'
import { useContentDashboard } from '@/composables/useContentDashboard'
import { getNameInitials } from '@/lib/format'
import { getErrorMessage } from '@/lib/http-errors'

const router = useRouter()
const notifications = useAppNotifications()
const { content, isPublishing, publicPath, unpublish, slugOrId } = useContentDashboard()

const isOwner = computed(() => content.value?.access?.is_owner === true)

const isDeleting = ref(false)
const confirmingDelete = ref(false)
const copied = ref(false)

const collaborators = ref<ContentCollaborator[]>([])
const invitations = ref<ContentInvitation[]>([])
const loadingAccess = ref(false)
const inviteModalOpen = ref(false)
const revokingId = ref<number | null>(null)
const removingUserId = ref<number | null>(null)
const savingUserId = ref<number | null>(null)

const LEVELS: ContentAccessLevel[] = ['none', 'read', 'write']
const LEVEL_LABELS: Record<ContentAccessLevel, string> = {
  none: 'Aucun',
  read: 'Lecture',
  write: 'Modif.',
}

const RESOURCES: { key: ContentAccessResource; label: string }[] = [
  { key: 'contenu', label: 'Contenu' },
  { key: 'publication', label: 'Publication' },
  { key: 'sources', label: 'Sources' },
  { key: 'historique', label: 'Historique' },
  { key: 'studio', label: 'Studio' },
]

const shareUrl = computed(() => {
  if (typeof window === 'undefined' || !publicPath.value) {
    return content.value?.slug ? `https://statsio.fr/data/${content.value.slug}` : ''
  }
  return `${window.location.origin}${publicPath.value}`
})

const shareHint = computed(() =>
  content.value?.status === 'published'
    ? 'Lien public : partageable partout, visible dans la recherche Statsio.'
    : 'Contenu non publié : publiez-le pour obtenir un lien partageable.',
)

async function loadAccessLists() {
  if (!isOwner.value || !slugOrId.value) return
  loadingAccess.value = true
  try {
    const [c, i] = await Promise.all([
      getContentCollaborators(slugOrId.value),
      getContentInvitations(slugOrId.value),
    ])
    collaborators.value = c
    invitations.value = i
  } catch {
    /* silencieux */
  } finally {
    loadingAccess.value = false
  }
}

watch(
  () => [isOwner.value, slugOrId.value] as const,
  () => {
    void loadAccessLists()
  },
  { immediate: true },
)

onMounted(() => {
  if (content.value && !isOwner.value) {
    router.replace(`/contenu/${slugOrId.value}/proprietes`)
  }
})

async function copyLink() {
  if (!shareUrl.value) return
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  } catch {
    notifications.error("Le lien n'a pas pu être copié.")
  }
}

async function confirmDelete() {
  const id = content.value?.slug || content.value?.id
  if (!id) return
  isDeleting.value = true
  try {
    await deleteStatsDataDocument(id)
    notifications.success('Contenu supprimé.')
    router.push('/user/contenus')
  } catch {
    notifications.error("Le contenu n'a pas pu être supprimé.")
    isDeleting.value = false
  }
}

async function revoke(invitationId: number) {
  if (!slugOrId.value) return
  revokingId.value = invitationId
  try {
    await revokeContentInvitation(slugOrId.value, invitationId)
    await loadAccessLists()
  } catch (e) {
    notifications.error(getErrorMessage(e, "Impossible d'annuler l'invitation."))
  } finally {
    revokingId.value = null
  }
}

async function removeCollaborator(userId: number) {
  if (!slugOrId.value) return
  removingUserId.value = userId
  try {
    await removeContentCollaborator(slugOrId.value, userId)
    await loadAccessLists()
    notifications.success('Collaborateur retiré.')
  } catch (e) {
    notifications.error(getErrorMessage(e, 'Impossible de retirer le collaborateur.'))
  } finally {
    removingUserId.value = null
  }
}

async function setCollaboratorLevel(
  collab: ContentCollaborator,
  resource: ContentAccessResource,
  level: ContentAccessLevel,
) {
  if (!slugOrId.value) return
  const next = { ...collab.permissions, [resource]: level }
  if (!Object.values(next).some((l) => l === 'read' || l === 'write')) {
    notifications.error('Au moins une permission lecture ou modification est requise.')
    return
  }
  savingUserId.value = collab.user_id
  try {
    const updated = await updateContentCollaborator(slugOrId.value, collab.user_id, next)
    collaborators.value = collaborators.value.map((c) =>
      c.user_id === collab.user_id ? updated : c,
    )
  } catch (e) {
    notifications.error(getErrorMessage(e, 'Impossible de mettre à jour les permissions.'))
  } finally {
    savingUserId.value = null
  }
}
</script>

<template>
  <div>
    <ContentDashboardHeader
      title="Accès & partage"
      subtitle="Lien public, collaborateurs et cycle de vie du contenu."
    />

    <div class="flex flex-col gap-5">
      <StatsDataSettingsCard title="Lien de partage" :description="shareHint">
        <div class="flex flex-wrap items-center gap-2.5">
          <span
            class="min-w-[240px] flex-1 truncate rounded-[10px] border-[1.5px] border-[#18181f]/10 bg-slate-50 px-3.5 py-3 font-mono text-[12px] text-[#18181f]/70"
          >
            {{ shareUrl || 'Aucun lien — le contenu est un brouillon' }}
          </span>
          <button
            type="button"
            :disabled="!shareUrl"
            class="rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] px-5 py-3 text-[11.5px] font-extrabold uppercase tracking-[0.06em] text-white disabled:opacity-40"
            @click="copyLink"
          >
            {{ copied ? 'Copié' : 'Copier' }}
          </button>
        </div>
      </StatsDataSettingsCard>

      <StatsDataSettingsCard
        v-if="isOwner"
        title="Collaborateurs"
        description="Invitez des personnes à consulter ou modifier ce contenu. Les sources et médias ajoutés par un collaborateur sont rattachés à votre compte."
      >
        <div v-if="loadingAccess" class="space-y-3">
          <div v-for="i in 2" :key="i" class="h-16 animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <div v-else class="flex flex-col gap-3">
          <div
            v-if="!collaborators.length"
            class="flex flex-wrap items-center justify-between gap-3"
          >
            <p class="text-sm text-slate-400">Aucun collaborateur pour l’instant.</p>
            <AppButton variant="gradient" size="md" @click="inviteModalOpen = true">
              Inviter
            </AppButton>
          </div>
          <div v-else class="flex justify-end">
            <AppButton variant="gradient" size="md" @click="inviteModalOpen = true">
              Inviter
            </AppButton>
          </div>
          <div
            v-for="collab in collaborators"
            :key="collab.user_id"
            class="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(20,20,30,0.05)]"
          >
            <div class="flex items-center gap-3">
              <AppAvatar
                :src="collab.avatar ?? undefined"
                :initials="getNameInitials(collab.name)"
                background="linear-gradient(135deg, var(--color-primary), var(--color-accent))"
              />
              <div class="min-w-0 flex-1">
                <p class="text-[14px] font-bold text-slate-950">{{ collab.name }}</p>
                <p class="text-[12.5px] text-slate-500">{{ collab.email }}</p>
              </div>
              <AppButton
                variant="ghost"
                size="sm"
                :disabled="removingUserId === collab.user_id"
                @click="removeCollaborator(collab.user_id)"
              >
                {{ removingUserId === collab.user_id ? '…' : 'Retirer' }}
              </AppButton>
            </div>
            <div
              class="mt-3 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-3"
              :class="{ 'opacity-60 pointer-events-none': savingUserId === collab.user_id }"
            >
              <div
                v-for="res in RESOURCES"
                :key="res.key"
                class="flex items-center justify-between gap-2"
              >
                <span class="text-[12px] font-semibold text-slate-600">{{ res.label }}</span>
                <div class="flex gap-0.5 rounded-full bg-slate-100 p-0.5">
                  <button
                    v-for="level in LEVELS"
                    :key="level"
                    type="button"
                    class="rounded-full px-2 py-1 text-[10px] font-bold"
                    :class="
                      collab.permissions[res.key] === level
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-500'
                    "
                    @click="setCollaboratorLevel(collab, res.key, level)"
                  >
                    {{ LEVEL_LABELS[level] }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="invitations.length" class="mt-5 flex flex-col gap-3">
          <p class="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-400">
            Invitations en attente
          </p>
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
            <AppButton
              variant="ghost"
              size="sm"
              :disabled="revokingId === invitation.id"
              @click="revoke(invitation.id)"
            >
              {{ revokingId === invitation.id ? '…' : 'Annuler' }}
            </AppButton>
          </div>
        </div>
      </StatsDataSettingsCard>

      <StatsDataSettingsCard
        v-if="isOwner"
        danger
        title="Zone sensible"
        description="Dépublier retire la page du site mais conserve le contenu et ses sources. La suppression est définitive."
      >
        <div
          v-if="confirmingDelete"
          class="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-red-50 px-[18px] py-4"
        >
          <p class="text-[13.5px] font-semibold text-red-900">
            Confirmer la suppression de « {{ content?.title }} » ?
          </p>
          <div class="flex gap-2.5">
            <button
              type="button"
              class="rounded-[9px] bg-red-600 px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              :disabled="isDeleting"
              @click="confirmDelete"
            >
              {{ isDeleting ? 'Suppression…' : 'Oui, supprimer' }}
            </button>
            <button
              type="button"
              class="rounded-[9px] border border-[#18181f]/[0.14] bg-white px-4 py-2.5 text-[13px] font-bold text-[#18181f]"
              :disabled="isDeleting"
              @click="confirmingDelete = false"
            >
              Annuler
            </button>
          </div>
        </div>

        <div v-else class="flex flex-wrap items-center gap-2.5">
          <button
            v-if="content?.status === 'published'"
            type="button"
            :disabled="isPublishing"
            class="rounded-full border-[1.5px] border-[#18181f]/[0.14] bg-white px-5 py-2.5 text-[12.5px] font-bold text-[#18181f] disabled:opacity-50"
            @click="unpublish"
          >
            {{ isPublishing ? 'Dépublication…' : 'Dépublier' }}
          </button>
          <button
            type="button"
            class="rounded-full border-[1.5px] border-red-300 bg-white px-5 py-2.5 text-[12.5px] font-bold text-red-600 transition-colors hover:bg-red-50"
            @click="confirmingDelete = true"
          >
            Supprimer le contenu
          </button>
        </div>
      </StatsDataSettingsCard>
    </div>

    <ContentInviteCollaboratorsModal
      v-if="slugOrId"
      v-model:open="inviteModalOpen"
      :content-slug="slugOrId"
      @invited="loadAccessLists"
    />
  </div>
</template>
