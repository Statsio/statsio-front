<script setup lang="ts">
import { computed, ref } from 'vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import { useAuthStore } from '@/stores/auth'
import { useAppNotifications } from '@/composables/useAppNotifications'
import { useMediaLibrary } from '@/composables/useMediaLibrary'
import { updateAvatarFromMedia, deleteAvatar } from '@/api/statsio-account'
import { getUserInitials } from '@/lib/format'

const authStore = useAuthStore()
const notifications = useAppNotifications()
const mediaLibrary = useMediaLibrary()

const busy = ref(false)

const initials = computed(() =>
  getUserInitials(
    authStore.user?.profile?.first_name,
    authStore.user?.profile?.last_name,
    authStore.user?.email?.[0]?.toUpperCase() ?? 'ST',
  ),
)
const hasAvatar = computed(() => Boolean(authStore.user?.profile?.avatar))

function pickAvatar() {
  mediaLibrary.open({
    mode: 'pick',
    directory: 'avatars',
    onSelect: (media) => {
      void applyAvatar(media.id)
    },
  })
}

async function applyAvatar(mediaId: number) {
  busy.value = true
  try {
    const { user } = await updateAvatarFromMedia(mediaId)
    if (authStore.user) Object.assign(authStore.user, user)
    notifications.success('Photo de profil mise à jour.')
  } catch {
    notifications.error("La mise à jour a échoué. Réessayez.")
  } finally {
    busy.value = false
  }
}

async function remove() {
  busy.value = true
  try {
    const { user } = await deleteAvatar()
    if (authStore.user) Object.assign(authStore.user, user)
    notifications.success('Photo de profil supprimée.')
  } catch {
    notifications.error('La suppression a échoué.')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="flex items-center gap-4 border-b border-slate-100 py-4">
    <AppAvatar
      :src="authStore.user?.profile?.avatar ?? undefined"
      :initials="initials"
      size="lg"
      background="linear-gradient(135deg, var(--color-primary), var(--color-accent))"
    />
    <div class="min-w-0 flex-1">
      <div class="text-[13px] font-semibold text-slate-950">Photo de profil</div>
      <div class="mt-0.5 text-[12px] text-slate-400">JPG, PNG ou WebP · 4 Mo max</div>
      <div class="mt-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          :disabled="busy"
          class="rounded-full bg-primary/10 px-3.5 py-1.5 text-[12px] font-bold text-primary transition hover:bg-primary/15 disabled:opacity-50"
          @click="pickAvatar"
        >
          {{ hasAvatar ? 'Changer' : 'Ajouter une photo' }}
        </button>
        <button
          v-if="hasAvatar"
          type="button"
          :disabled="busy"
          class="rounded-full px-3.5 py-1.5 text-[12px] font-bold text-slate-500 transition hover:text-rose-600 disabled:opacity-50"
          @click="remove"
        >
          Retirer
        </button>
      </div>
    </div>
  </div>
</template>
