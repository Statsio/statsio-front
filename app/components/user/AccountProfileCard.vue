<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AccountAvatarUploader from '@/components/user/AccountAvatarUploader.vue'
import { useAuthStore } from '@/stores/auth'
import { useAppNotifications } from '@/composables/useAppNotifications'
import { updateProfile } from '@/api/statsio-user'
import type { AuthUser } from '@/types/auth'

const authStore = useAuthStore()
const notifications = useAppNotifications()

const isEditingName = ref(false)
const isSaving = ref(false)
const form = reactive({
  first_name: authStore.user?.profile?.first_name ?? '',
  last_name: authStore.user?.profile?.last_name ?? '',
})

function startEdit() {
  form.first_name = authStore.user?.profile?.first_name ?? ''
  form.last_name = authStore.user?.profile?.last_name ?? ''
  isEditingName.value = true
}

async function save() {
  isSaving.value = true
  try {
    const result = (await updateProfile({
      first_name: form.first_name || undefined,
      last_name: form.last_name || undefined,
    })) as { user?: AuthUser } | undefined
    if (result?.user && authStore.user) authStore.user.profile = result.user.profile
    isEditingName.value = false
    notifications.success('Profil mis à jour.')
  } catch {
    notifications.error('Une erreur est survenue. Veuillez réessayer.')
  } finally {
    isSaving.value = false
  }
}

const inputClass =
  'rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20'
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(20,20,30,0.05)] sm:p-5">
    <div class="mb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-slate-400">Informations personnelles</div>

    <AccountAvatarUploader />

    <form v-if="isEditingName" class="flex flex-col gap-3 pt-3" @submit.prevent="save">
      <label class="flex flex-col gap-1.5">
        <span class="text-[13px] font-semibold text-slate-700">Prénom</span>
        <input v-model="form.first_name" type="text" :class="inputClass" placeholder="Votre prénom" />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-[13px] font-semibold text-slate-700">Nom</span>
        <input v-model="form.last_name" type="text" :class="inputClass" placeholder="Votre nom" />
      </label>
      <div class="flex gap-2">
        <AppButton type="submit" variant="primary" size="md" :disabled="isSaving">
          {{ isSaving ? 'Enregistrement…' : 'Enregistrer' }}
        </AppButton>
        <AppButton type="button" variant="secondary" size="md" @click="isEditingName = false">Annuler</AppButton>
      </div>
    </form>

    <template v-else>
      <div class="flex items-center justify-between border-b border-slate-100 py-3">
        <div>
          <div class="mb-0.5 text-[11px] text-slate-400">Nom complet</div>
          <div class="text-[13px] font-semibold text-slate-950">{{ authStore.displayName }}</div>
        </div>
        <button type="button" class="text-[12px] font-semibold text-primary" @click="startEdit">Modifier</button>
      </div>
      <div class="flex items-center justify-between border-b border-slate-100 py-3">
        <div>
          <div class="mb-0.5 text-[11px] text-slate-400">Adresse e-mail</div>
          <div class="text-[13px] font-semibold text-slate-950">{{ authStore.user?.email }}</div>
        </div>
      </div>
      <div class="flex items-center justify-between py-3">
        <div>
          <div class="mb-0.5 text-[11px] text-slate-400">Mot de passe</div>
          <div class="text-[13px] font-semibold text-slate-950">••••••••••</div>
        </div>
        <RouterLink to="/forgot-password" class="text-[12px] font-semibold text-primary">Modifier</RouterLink>
      </div>
    </template>
  </section>
</template>
