<script setup lang="ts">
defineProps<{
  channelName: string
  dashboardPath: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-6 py-6 text-center">
    <div class="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
      <svg class="h-10 w-10 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>

    <div class="space-y-2">
      <h3 class="text-xl font-bold text-slate-900">
        {{ channelName }} est en ligne !
      </h3>
      <p class="max-w-sm text-sm leading-relaxed text-slate-500">
        Votre chaîne est créée. Ouvrez son dashboard pour peaufiner votre profil, inviter votre équipe et publier vos premiers contenus.
      </p>
    </div>

    <div class="flex flex-col items-center gap-3 pt-2">
      <NuxtLink
        :to="dashboardPath"
        class="inline-flex items-center gap-2.5 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_color-mix(in_srgb,var(--color-primary)_30%,transparent)] transition hover:-translate-y-0.5 hover:brightness-105"
        @click="emit('close')"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
        Ouvrir le dashboard
      </NuxtLink>

      <button
        type="button"
        class="text-sm font-medium text-slate-500 transition hover:text-slate-700"
        @click="emit('close')"
      >
        Fermer
      </button>
    </div>
  </div>
</template>
