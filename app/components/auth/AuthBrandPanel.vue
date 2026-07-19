<script setup lang="ts">
withDefaults(
  defineProps<{
    signals?: { label: string; value: string; detail: string }[]
    badgeLabel?: string
    title?: string
    description?: string
  }>(),
  {
    signals: () => [],
    badgeLabel: 'Espace sécurisé',
    title: 'Connectez-vous à votre espace Statsio.',
    description: 'Retrouvez vos contenus, vos abonnements et vos accès depuis une interface claire, rapide et sécurisée.',
  },
)
</script>

<template>
  <div
    class="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,var(--color-primary),var(--color-auth-brand-mid)_55%,var(--color-auth-brand-end))] px-10 py-10 lg:px-12"
  >
    <!-- Decorative blurred circles -->
    <div class="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-white/[0.06]" aria-hidden="true" />
    <div class="pointer-events-none absolute -bottom-36 -left-24 h-[360px] w-[360px] rounded-full bg-white/5" aria-hidden="true" />

    <!-- Logo + back link -->
    <div class="relative z-10 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <img src="@/assets/brand/statsio-white.svg" alt="" class="h-[30px] w-[30px]" />
        <span class="text-[18px] font-bold uppercase tracking-[0.02em] text-white">Statsio</span>
      </div>
      <AuthTopBar />
    </div>

    <!-- Headline + signals -->
    <div class="relative z-10 max-w-[420px]">
      <p v-if="badgeLabel" class="mono mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
        {{ badgeLabel }}
      </p>
      <h1 class="mb-4 text-[30px] font-extrabold leading-[1.25] text-white">{{ title }}</h1>
      <p class="mb-8 text-[15px] leading-relaxed text-white/75">{{ description }}</p>

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

    <p class="relative z-10 text-[12.5px] text-white/50">© {{ new Date().getFullYear() }} Statsio</p>
  </div>
</template>
