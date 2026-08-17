<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ChannelDashboardSidebar from '@/components/channels/ChannelDashboardSidebar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useChannelDashboard } from '@/composables/useChannelDashboard'
import { resolveChannelColors, channelBannerStyle } from '@/lib/channel-brand'

const auth = useAuthStore()
const { channel, channelInitials } = useChannelDashboard()
const route = useRoute()

const sidebarOpen = ref(false)

// Sur desktop la sidebar est ouverte par défaut ; sur mobile elle reste
// fermée (drawer) tant que l'utilisateur ne l'ouvre pas via le bouton.
onMounted(() => {
  sidebarOpen.value = window.innerWidth >= 1024
})

watch(route, () => {
  if (window.innerWidth < 1024) sidebarOpen.value = false
})

function closeSidebar() {
  if (window.innerWidth < 1024) sidebarOpen.value = false
}

usePageSeo({ title: 'Dashboard chaîne', robots: 'noindex,nofollow' })

const brandColors = computed(() =>
  channel.value
    ? resolveChannelColors(
        String(channel.value.id),
        channel.value.profile?.custom_color_primary,
        channel.value.profile?.custom_color_secondary,
      )
    : { primary: '#8b5cf6', secondary: '#3b82f6' },
)
const avatarFallbackStyle = computed(() => channelBannerStyle(brandColors.value.primary, brandColors.value.secondary))
const headerAccentStyle = computed(() => ({
  background: `linear-gradient(90deg, ${brandColors.value.primary}, ${brandColors.value.secondary})`,
}))

async function logout() {
  await auth.logout()
  await navigateTo('/login')
}
</script>

<template>
  <div class="flex h-screen overflow-hidden text-slate-900">
    <a href="#main-content" class="sr-skip-link">Passer au contenu principal</a>
    <ChannelDashboardSidebar :open="sidebarOpen" @close="closeSidebar" />

    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- Topbar -->
      <header class="relative shrink-0 border-b border-slate-200/70 bg-white/85 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur-md">
        <div class="flex h-[70px] items-center justify-between gap-4 px-5 sm:px-7">
          <div class="flex min-w-0 items-center gap-3">
            <button
              class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              title="Basculer la sidebar"
              @click="sidebarOpen = !sidebarOpen"
            >
              <svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div class="hidden h-6 w-px bg-slate-200 sm:block" />

            <template v-if="channel">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[12px] text-[13px] font-bold text-white"
                :style="channel.profile.logo_url ? undefined : avatarFallbackStyle"
              >
                <img v-if="channel.profile.logo_url" :src="channel.profile.logo_url" alt="" class="h-full w-full object-cover" />
                <span v-else>{{ channelInitials }}</span>
              </div>
              <div class="min-w-0">
                <p class="truncate text-[15px] font-bold leading-tight text-slate-950">{{ channel.profile.name }}</p>
                <p class="mt-0.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">Dashboard chaîne</p>
              </div>
            </template>
            <span v-else class="font-mono text-sm font-bold tracking-tight text-slate-950">Statsio</span>
          </div>

          <div class="flex items-center gap-2 sm:gap-3">
            <AppButton
              v-if="channel"
              variant="outline"
              size="sm"
              as="router-link"
              :to="`/channels/@${channel.profile.handle}`"
              class="!hidden sm:!inline-flex"
            >
              Voir la chaîne publique
            </AppButton>

            <div class="hidden h-6 w-px bg-slate-200 lg:block" />

            <div class="hidden items-center gap-2.5 lg:flex">
              <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] text-xs font-bold text-white">
                {{ auth.user?.email?.[0]?.toUpperCase() ?? 'U' }}
              </div>
              <div class="text-right">
                <p class="text-[13.5px] font-semibold leading-tight text-slate-900">{{ auth.displayName }}</p>
                <p class="text-[11.5px] text-slate-400">{{ auth.user?.email }}</p>
              </div>
            </div>

            <button
              class="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              title="Déconnexion"
              @click="logout"
            >
              <svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="channel" class="h-[3px] w-full" :style="headerAccentStyle" />
      </header>

      <!-- Contenu -->
      <main
        id="main-content"
        tabindex="-1"
        class="flex-1 overflow-y-auto bg-[#eeecf5] p-6 lg:p-8"
      >
        <slot />
      </main>
    </div>
  </div>
</template>
