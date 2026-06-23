<script setup lang="ts">
import LoginHeader from '@/components/login/LoginHeader.vue'
import LoginIntroPanel from '@/components/login/LoginIntroPanel.vue'

withDefaults(
  defineProps<{
    signals: {
      label: string
      value: string
      detail: string
    }[]
    badgeLabel?: string
    title?: string
    description?: string
    formWidthClass?: string
  }>(),
  {
    badgeLabel: 'Espace sécurisé',
    title: 'Connectez-vous à votre espace Statsio.',
    description:
      'Retrouvez vos contenus, vos abonnements et vos accès depuis une interface claire, rapide et sécurisée.',
    formWidthClass: '420px',
  },
)
</script>

<template>
  <main class="relative min-h-screen overflow-hidden bg-slate-950 text-white">
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.2),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.22),transparent_34%),linear-gradient(180deg,#020617_0%,#0f172a_48%,#e2e8f0_48%,#f8fafc_100%)]"
    />

    <div class="relative container flex min-h-screen flex-col py-5 sm:py-6 lg:py-10">
      <LoginHeader />

      <section class="flex flex-1 items-center py-6 sm:py-8 lg:py-16">
        <div
          class="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_var(--auth-form-width)] lg:gap-12"
          :style="{ '--auth-form-width': formWidthClass }">
          <div class="order-2 lg:order-1">
            <LoginIntroPanel
              :signals="signals"
              :badge-label="badgeLabel"
              :title="title"
              :description="description"
            />
          </div>
          <div class="order-1 lg:order-2">
            <slot />
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
