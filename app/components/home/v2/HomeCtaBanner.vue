<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  headline: string
  subtitle: string
  primaryLabel: string
  secondaryLabel: string
  primaryTo: string
  secondaryTo: string
}>()
</script>

<template>
  <section
    class="relative mb-[70px] flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#18181f,#241f33)] px-8 py-12 sm:px-[52px]"
  >
    <div
      class="cta-halo pointer-events-none absolute -right-16 -top-24 h-[280px] w-[280px] rounded-full"
      aria-hidden="true"
    />
    <div class="relative min-w-0 flex-1 sm:min-w-[260px]">
      <h2 class="m-0 max-w-[26ch] text-[28px] font-extrabold tracking-[-0.02em] text-white text-pretty">
        {{ headline }}
      </h2>
      <p class="mt-3 max-w-[48ch] text-[14.5px] text-white/65">
        {{ subtitle }}
      </p>
    </div>
    <div class="relative flex w-full flex-col gap-3 sm:w-auto sm:shrink-0 sm:flex-row sm:flex-wrap">
      <RouterLink
        :to="primaryTo"
        class="w-full rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] px-6 py-[15px] text-center text-[14px] font-extrabold tracking-[0.02em] text-white transition hover:brightness-105 sm:w-auto"
      >
        {{ primaryLabel }}
      </RouterLink>
      <RouterLink
        :to="secondaryTo"
        class="w-full rounded-full border-[1.5px] border-white/25 px-[22px] py-[15px] text-center text-[14px] font-bold text-white transition hover:border-primary hover:text-primary sm:w-auto"
      >
        {{ secondaryLabel }}
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.cta-halo {
  background: radial-gradient(circle, color-mix(in srgb, var(--color-primary) 34%, transparent), transparent 70%);
}
@supports not (color: color-mix(in srgb, red, blue)) {
  .cta-halo { background: radial-gradient(circle, var(--color-primary), transparent 70%); opacity: 0.32; }
}
</style>
