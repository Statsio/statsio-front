<script setup lang="ts">
import statsioLogo from '@/assets/brand/statsio-logo.svg'

withDefaults(
  defineProps<{
    signals?: { label: string; value: string; detail: string }[]
    title?: string
    description?: string
  }>(),
  {
    signals: () => [],
    title: 'Les chiffres qui racontent le monde.',
    description:
      "Articles, données ouvertes et sondages sur l'économie, la santé, l'environnement et la société — mis à jour chaque jour.",
  },
)
</script>

<template>
  <div
    class="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[var(--color-auth-ink)] px-12 py-10"
  >
    <!-- Decorative accent circles -->
    <div
      class="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[rgba(139,92,246,0.12)]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -bottom-36 -left-24 h-[360px] w-[360px] rounded-full bg-[rgba(59,130,246,0.08)]"
      aria-hidden="true"
    />

    <!-- Logo -->
    <NuxtLink to="/" class="relative z-10 flex items-center gap-[9px]">
      <img
        :src="statsioLogo"
        alt="Statsio"
        class="h-[34px] w-[34px] flex-none rounded-[9px] bg-white p-1"
      />
      <span class="whitespace-nowrap text-base font-extrabold tracking-[0.08em]">
        <span class="text-white">STAT</span><span class="text-[#a78bfa]">SIO</span>
      </span>
    </NuxtLink>

    <!-- Headline + signals -->
    <div class="relative z-10 max-w-[420px]">
      <h1 class="mb-4 text-[30px] font-extrabold leading-[1.25] text-white">{{ title }}</h1>
      <p class="mb-8 text-[15px] leading-relaxed text-white/60">{{ description }}</p>

      <div class="flex flex-col gap-3.5">
        <AuthStatCard
          v-for="(signal, i) in signals"
          :key="signal.label"
          :value="signal.value"
          :detail="signal.detail"
          :icon="i % 2 === 0 ? 'bar' : 'donut'"
        />
      </div>
    </div>

    <p class="relative z-10 text-[12.5px] text-white/40">© {{ new Date().getFullYear() }} Statsio</p>
  </div>
</template>
