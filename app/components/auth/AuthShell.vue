<script setup lang="ts">
import statsioLogo from '@/assets/brand/statsio-logo.svg'

withDefaults(
  defineProps<{
    signals?: { label: string; value: string; detail: string }[]
    title?: string
    description?: string
    formWidthClass?: string
  }>(),
  {
    signals: () => [],
    title: 'Les chiffres qui racontent le monde.',
    description:
      "Articles, données ouvertes et sondages sur l'économie, la santé, l'environnement et la société — mis à jour chaque jour.",
    formWidthClass: '420px',
  },
)
</script>

<template>
  <main class="h-full w-full bg-[var(--color-auth-wash)]">
    <div class="flex h-full w-full flex-col lg:flex-row">
      <!-- Brand panel — hidden on small screens, fills remaining space on desktop, never scrolls -->
      <div class="hidden lg:flex lg:h-full lg:flex-1 lg:min-w-0">
        <AuthBrandPanel :signals="signals" :title="title" :description="description" />
      </div>

      <!-- Form panel — fixed width on desktop, the only scrollable region -->
      <div class="flex h-full w-full flex-1 flex-col gap-8 overflow-y-auto px-5 py-8 sm:px-8 sm:py-10 lg:w-[520px] lg:flex-none lg:gap-0 lg:px-10 lg:py-10">
        <div class="flex items-center justify-between gap-4 lg:hidden">
          <NuxtLink to="/" class="flex items-center gap-2">
            <img :src="statsioLogo" alt="Statsio" class="h-7 w-7 flex-none rounded-[7px]" />
            <AppWordmark as="span" class="!text-[15px]" />
          </NuxtLink>
          <AuthTopBar variant="light" />
        </div>

        <div class="flex flex-1 items-center justify-center">
          <div class="w-full" :style="{ maxWidth: formWidthClass }">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
