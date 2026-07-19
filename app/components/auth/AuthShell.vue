<script setup lang="ts">
withDefaults(
  defineProps<{
    signals?: { label: string; value: string; detail: string }[]
    badgeLabel?: string
    title?: string
    description?: string
    formWidthClass?: string
  }>(),
  {
    signals: () => [],
    badgeLabel: 'Espace sécurisé',
    title: 'Connectez-vous à votre espace Statsio.',
    description: 'Retrouvez vos contenus, vos abonnements et vos accès depuis une interface claire, rapide et sécurisée.',
    formWidthClass: '420px',
  },
)
</script>

<template>
  <main class="h-full w-full bg-[var(--color-auth-wash)]">
    <div class="flex h-full w-full flex-col lg:flex-row">
      <!-- Brand panel — hidden on small screens, fills remaining space on desktop, never scrolls -->
      <div class="hidden lg:flex lg:h-full lg:flex-1">
        <AuthBrandPanel :signals="signals" :badge-label="badgeLabel" :title="title" :description="description" />
      </div>

      <!-- Form panel — the only scrollable region, so tall forms stay reachable even though the outer layout clips overflow -->
      <div class="flex h-full w-full flex-1 flex-col gap-8 overflow-y-auto px-5 py-8 sm:px-8 sm:py-10 lg:w-[clamp(420px,50vw,720px)] lg:flex-none lg:gap-0 lg:px-10 lg:py-10">
        <AuthTopBar variant="light" class="lg:hidden" />

        <div class="flex flex-1 items-center justify-center">
          <div class="w-full" :style="{ maxWidth: formWidthClass }">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
