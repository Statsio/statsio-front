<script setup lang="ts">
import { reactive, watch } from 'vue'
import AccountToggle from '@/components/user/AccountToggle.vue'
import { useAuthStore } from '@/stores/auth'
import { useAppNotifications } from '@/composables/useAppNotifications'
import { updateProfile } from '@/api/statsio-user'
import type { AuthUser, NotificationPreferences } from '@/types/auth'

const authStore = useAuthStore()
const notifications = useAppNotifications()

const DEFAULTS: NotificationPreferences = { articles: true, weekly: true, replies: false, offers: false }

const prefs = reactive<NotificationPreferences>({
  ...DEFAULTS,
  ...authStore.user?.profile?.notification_preferences,
})

watch(
  () => authStore.user?.profile?.notification_preferences,
  (value) => {
    if (value) Object.assign(prefs, value)
  },
)

const ROWS: { key: keyof NotificationPreferences; label: string; desc: string }[] = [
  { key: 'articles', label: 'Nouveaux contenus', desc: 'Des chaînes que vous suivez' },
  { key: 'weekly', label: 'Résumé hebdomadaire', desc: 'Le meilleur de la semaine, chaque lundi' },
  { key: 'replies', label: 'Réponses aux commentaires', desc: 'Quand quelqu’un vous répond' },
  { key: 'offers', label: 'Offres et actualités Statsio', desc: 'Nouveautés produit, occasionnellement' },
]

async function persist() {
  try {
    const result = (await updateProfile({ notification_preferences: { ...prefs } })) as { user?: AuthUser }
    if (result?.user && authStore.user) authStore.user.profile = result.user.profile
  } catch {
    notifications.error("La préférence n'a pas pu être enregistrée.")
  }
}

function toggle(key: keyof NotificationPreferences) {
  prefs[key] = !prefs[key]
  persist()
}
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.05)] sm:p-7">
    <div class="mb-3 text-xs font-bold uppercase tracking-[0.04em] text-slate-400">Notifications par e-mail</div>
    <div
      v-for="row in ROWS"
      :key="row.key"
      class="flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-b-0 last:pb-0"
    >
      <div>
        <div class="text-[14px] font-semibold text-slate-950">{{ row.label }}</div>
        <div class="mt-0.5 text-[12.5px] text-slate-500">{{ row.desc }}</div>
      </div>
      <AccountToggle :model-value="prefs[row.key]" :label="row.label" @update:model-value="toggle(row.key)" />
    </div>
  </section>
</template>
