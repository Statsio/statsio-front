<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: ['auth'], ssr: false })
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useAuthStore } from '@/stores/auth'
import { updateProfile } from '@/api/statsio-user'

const authStore = useAuthStore()
const router = useRouter()

const activeSection = ref<'overview' | 'settings'>('overview')

const userInitials = computed(() => {
  const firstName = authStore.user?.profile?.first_name?.[0] ?? ''
  const lastName = authStore.user?.profile?.last_name?.[0] ?? ''
  return `${firstName}${lastName}`.trim() || 'ST'
})

const profileForm = reactive({
  first_name: authStore.user?.profile?.first_name ?? '',
  last_name: authStore.user?.profile?.last_name ?? '',
})

const isSavingProfile = ref(false)
const profileSaved = ref(false)
const profileError = ref<string | null>(null)

async function handleUpdateProfile() {
  isSavingProfile.value = true
  profileError.value = null
  try {
    const result = await updateProfile({
      first_name: profileForm.first_name || undefined,
      last_name: profileForm.last_name || undefined,
    }) as any
    if (result?.user && authStore.user) {
      authStore.user.profile = result.user.profile
    }
    profileSaved.value = true
    setTimeout(() => { profileSaved.value = false }, 2500)
  } catch {
    profileError.value = 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    isSavingProfile.value = false
  }
}

const handleDeleteAccount = () => {
  if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
    alert('Fonctionnalité de suppression de compte à implémenter')
  }
}

const handleCreateChannel = () => {
  router.push('/channels/create')
}

const sidebarItems = [
  { id: 'overview' as const, label: 'Vue générale' },
  { id: 'settings' as const, label: 'Paramètres' },
]
</script>

<template>
  <main class="pb-24 pt-32">
    <section class="section pb-10">
      <div class="container flex flex-col gap-8">
        <div class="flex flex-col gap-4">
          <p class="eyebrow text-primary">Mon compte</p>
          <div class="max-w-4xl">
            <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              Profil
            </h1>
            <p class="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Gérez vos informations personnelles et vos préférences.
            </p>
          </div>
        </div>

        <div class="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside class="flex flex-col gap-4">
            <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
              <div class="flex flex-col items-center gap-4">
                <AppAvatar :initials="userInitials" size="lg" />
                <div class="text-center">
                  <p class="text-lg font-semibold text-slate-950">{{ authStore.displayName }}</p>
                  <p class="text-sm text-slate-500">{{ authStore.user?.email }}</p>
                </div>
              </div>
            </div>

            <nav class="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
              <button
                v-for="item in sidebarItems"
                :key="item.id"
                type="button"
                class="w-full rounded-[1.25rem] px-4 py-3 text-left text-sm font-semibold transition"
                :class="activeSection === item.id
                  ? 'bg-primary text-white'
                  : 'text-slate-700 hover:bg-slate-50'"
                @click="activeSection = item.id"
              >
                {{ item.label }}
              </button>
            </nav>
          </aside>

          <div class="flex flex-col gap-6">
            <!-- Overview -->
            <section v-if="activeSection === 'overview'" class="flex flex-col gap-6">
              <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                <div class="flex items-start justify-between">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Informations</p>
                    <h2 class="mt-2 text-2xl font-semibold text-slate-950">Vos informations personnelles</h2>
                  </div>
                  <AppButton variant="secondary" size="sm" @click="activeSection = 'settings'">
                    Modifier
                  </AppButton>
                </div>

                <div class="mt-6 grid gap-4 sm:grid-cols-2">
                  <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Prénom</p>
                    <p class="mt-2 text-base font-semibold text-slate-950">
                      {{ authStore.user?.profile?.first_name || '—' }}
                    </p>
                  </div>
                  <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nom</p>
                    <p class="mt-2 text-base font-semibold text-slate-950">
                      {{ authStore.user?.profile?.last_name || '—' }}
                    </p>
                  </div>
                  <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 sm:col-span-2">
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Email</p>
                    <p class="mt-2 text-base font-semibold text-slate-950">{{ authStore.user?.email }}</p>
                  </div>
                </div>
              </div>

              <div class="rounded-[2rem] border border-dashed border-primary/30 bg-primary/5 p-8 text-center shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                <div class="mx-auto max-w-md">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Créateur</p>
                  <h3 class="mt-3 text-2xl font-semibold text-slate-950">Créez votre chaîne</h3>
                  <p class="mt-3 text-sm leading-7 text-slate-600">
                    Lancez votre présence éditoriale avec une chaîne personnalisée. Publiez vos contenus, développez votre audience et suivez vos performances.
                  </p>
                  <AppButton variant="primary" size="md" class="mt-6" @click="handleCreateChannel">
                    Créer ma chaîne
                  </AppButton>
                </div>
              </div>
            </section>

            <!-- Settings -->
            <section v-else-if="activeSection === 'settings'" class="flex flex-col gap-6">
              <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Paramètres</p>
                <h2 class="mt-2 text-2xl font-semibold text-slate-950">Mettre à jour mes informations</h2>

                <form class="mt-6 flex flex-col gap-4" @submit.prevent="handleUpdateProfile">
                  <label class="flex flex-col gap-2">
                    <span class="text-sm font-semibold text-slate-700">Prénom</span>
                    <input
                      v-model="profileForm.first_name"
                      type="text"
                      class="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Votre prénom"
                    />
                  </label>

                  <label class="flex flex-col gap-2">
                    <span class="text-sm font-semibold text-slate-700">Nom</span>
                    <input
                      v-model="profileForm.last_name"
                      type="text"
                      class="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Votre nom"
                    />
                  </label>

                  <div class="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                    <p class="text-xs font-semibold text-slate-500 mb-1">Email</p>
                    <p class="text-sm text-slate-700">{{ authStore.user?.email }}</p>
                    <p class="text-xs text-slate-400 mt-1">L'adresse email ne peut pas être modifiée.</p>
                  </div>

                  <p v-if="profileError" class="text-sm text-red-600">{{ profileError }}</p>

                  <div class="mt-2">
                    <AppButton type="submit" variant="primary" size="md" :disabled="isSavingProfile">
                      {{ isSavingProfile ? 'Enregistrement…' : profileSaved ? 'Enregistré ✓' : 'Enregistrer les modifications' }}
                    </AppButton>
                  </div>
                </form>
              </div>

              <div class="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">Zone dangereuse</p>
                <h2 class="mt-2 text-2xl font-semibold text-slate-950">Supprimer mon compte</h2>
                <p class="mt-3 text-sm leading-7 text-slate-600">
                  Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                </p>
                <div class="mt-4">
                  <button
                    type="button"
                    class="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
                    @click="handleDeleteAccount"
                  >
                    Supprimer mon compte
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
