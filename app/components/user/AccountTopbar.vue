<script setup lang="ts">
import { computed } from 'vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppWordmark from '@/components/ui/AppWordmark.vue'
import AccountSearch from '@/components/user/AccountSearch.vue'
import statsioLogo from '@/assets/brand/statsio-logo.svg'
import { useAuthStore } from '@/stores/auth'
import { getUserInitials } from '@/lib/format'

const authStore = useAuthStore()

const initials = computed(() =>
  getUserInitials(
    authStore.user?.profile?.first_name,
    authStore.user?.profile?.last_name,
    authStore.user?.email?.[0]?.toUpperCase() ?? 'ST',
  ),
)
const firstName = computed(
  () => authStore.user?.profile?.first_name || authStore.displayName.split(' ')[0],
)
</script>

<template>
  <div class="flex min-w-0 flex-1 items-center gap-3">
    <NuxtLink to="/" title="Retour au site Statsio" class="group flex shrink-0 items-center gap-2">
      <span
        class="flex h-8 w-8 items-center justify-center rounded-[9px] border-[1.5px] border-slate-200 text-[14px] text-slate-400 transition group-hover:border-primary/40 group-hover:text-primary"
      >
        ←
      </span>
      <img :src="statsioLogo" alt="" class="hidden h-[26px] w-[26px] rounded-[8px] bg-white p-0.5 sm:block" />
      <AppWordmark as="span" class="!hidden !text-[15px] md:!inline" />
    </NuxtLink>

    <span class="hidden h-[26px] w-px bg-slate-200 sm:block" />

    <AccountSearch />

    <div class="ml-auto flex shrink-0 items-center gap-3">
      <NuxtLink
        to="/about"
        class="hidden text-[12.5px] font-semibold text-slate-500 transition hover:text-primary sm:block"
      >
        Aide
      </NuxtLink>
      <NuxtLink
        to="/contact"
        class="hidden text-[12.5px] font-semibold text-slate-500 transition hover:text-primary sm:block"
      >
        Contact
      </NuxtLink>
      <span class="hidden h-[26px] w-px bg-slate-200 sm:block" />
      <div class="flex items-center gap-2">
        <AppAvatar
          :src="authStore.user?.profile?.avatar ?? undefined"
          :initials="initials"
          size="sm"
          background="linear-gradient(135deg, var(--color-primary), var(--color-accent))"
        />
        <span class="hidden text-[12.5px] font-bold text-slate-950 sm:block">{{ firstName }}</span>
      </div>
    </div>
  </div>
</template>
