<script setup lang="ts">
import { ref } from 'vue'
import ChannelDashboardSidebar from '@/components/channels/ChannelDashboardSidebar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useChannelDashboard } from '@/composables/useChannelDashboard'

const auth = useAuthStore()
const { channel } = useChannelDashboard()

const sidebarOpen = ref(true)

usePageSeo({ title: 'Dashboard chaîne', robots: 'noindex,nofollow' })

async function logout() {
  await auth.logout()
  await navigateTo('/login')
}
</script>

<template>
  <div class="flex h-screen overflow-hidden text-slate-900">
    <ChannelDashboardSidebar v-if="sidebarOpen" />

    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- Topbar -->
      <header class="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur">
        <div class="flex items-center gap-4">
          <button
            class="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            title="Basculer la sidebar"
            @click="sidebarOpen = !sidebarOpen"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div class="hidden items-center gap-2 sm:flex">
            <span class="font-mono text-sm font-bold tracking-tight text-slate-950">Statsio</span>
            <span class="eyebrow text-primary">Dashboard chaîne</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <AppButton
            v-if="channel"
            variant="outline"
            size="sm"
            as="router-link"
            :to="`/channels/@${channel.profile.handle}`"
          >
            Voir la chaîne publique
          </AppButton>
          <div class="hidden text-right sm:block">
            <p class="text-sm font-semibold text-slate-900">{{ auth.displayName }}</p>
            <p class="text-xs text-slate-400">{{ auth.user?.email }}</p>
          </div>
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            {{ auth.user?.email?.[0]?.toUpperCase() ?? 'U' }}
          </div>
          <button
            class="ml-1 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            @click="logout"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <!-- Contenu -->
      <main
        class="flex-1 overflow-y-auto p-6 lg:p-8"
        style="background: var(--app-body-background); background-size: 32px 32px, 32px 32px, auto, auto;"
      >
        <slot />
      </main>
    </div>
  </div>
</template>
