<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  dotColorRgb: string
}>()

const dotGridStyle = computed(() => ({
  backgroundImage: `radial-gradient(circle, rgba(${props.dotColorRgb},0.08) 1px, transparent 1px)`,
  backgroundSize: '28px 28px',
}))
</script>

<template>
  <!--
    -mt-44 lg:-mt-28 cancels the layout's <main class="pt-44 lg:pt-28"> (app/layouts/default.vue)
    so this section's background bleeds all the way under the translucent fixed header. The real
    content offset comes back from pt-44 lg:pt-40 below. Keep both files' breakpoint pairs in sync.
  -->
  <section class="relative -mt-44 overflow-hidden bg-white lg:-mt-28">
    <div
      class="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-[var(--color-primary)]/[0.07] blur-3xl"
      aria-hidden="true"
    />
    <div class="pointer-events-none absolute inset-0" :style="dotGridStyle" aria-hidden="true" />

    <div class="container relative pb-16 pt-44 lg:pb-24 lg:pt-40">
      <div class="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div class="space-y-6">
          <slot name="content" />
        </div>

        <div data-anim="card" class="card-xl p-6">
          <slot name="card" />
        </div>
      </div>
    </div>
  </section>
</template>
