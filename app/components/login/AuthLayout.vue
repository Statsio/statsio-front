<script setup lang="ts">
import LoginHeader from '@/components/login/LoginHeader.vue'
import LoginIntroPanel from '@/components/login/LoginIntroPanel.vue'

withDefaults(
  defineProps<{
    signals: { label: string; value: string; detail: string }[]
    badgeLabel?: string
    title?: string
    description?: string
    formWidthClass?: string
  }>(),
  {
    badgeLabel: 'Espace sécurisé',
    title: 'Connectez-vous à votre espace Statsio.',
    description: 'Retrouvez vos contenus, vos abonnements et vos accès depuis une interface claire, rapide et sécurisée.',
    formWidthClass: '420px',
  },
)
</script>

<template>
  <main class="relative min-h-svh overflow-x-hidden bg-slate-950 text-white">
    <!-- Background gradients -->
    <div
      class="pointer-events-none absolute inset-0"
      aria-hidden="true"
    >
      <div class="absolute left-0 top-0 h-[600px] w-[600px] -translate-x-1/4 -translate-y-1/4 rounded-full bg-accent/15 blur-[120px]" />
      <div class="absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/4 -translate-y-1/3 rounded-full bg-primary/18 blur-[100px]" />
      <div class="absolute bottom-0 left-1/3 h-[400px] w-[400px] translate-y-1/2 rounded-full bg-primary/10 blur-[80px]" />
      <!-- Split: dark top → light bottom -->
      <div class="absolute bottom-0 left-0 right-0 h-[48%] bg-gradient-to-b from-transparent to-slate-100/90" />
    </div>

    <div class="relative container flex min-h-svh flex-col py-5 sm:py-7 lg:py-10">

      <LoginHeader />

      <section class="flex flex-1 items-center py-8 sm:py-10 lg:py-14">
        <div
          class="grid w-full items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_var(--auth-form-width)] lg:gap-14"
          :style="{ '--auth-form-width': formWidthClass }"
        >
          <!-- Intro panel — below the form on mobile, left on desktop -->
          <div class="order-2 lg:order-1">
            <LoginIntroPanel
              :signals="signals"
              :badge-label="badgeLabel"
              :title="title"
              :description="description"
            />
          </div>

          <!-- Form slot — on top on mobile, right on desktop -->
          <div class="order-1 lg:order-2">
            <slot />
          </div>
        </div>
      </section>

    </div>
  </main>
</template>
