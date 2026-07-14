<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    danger?: boolean
  }>(),
  { danger: false },
)
</script>

<template>
  <section
    class="rounded-2xl border bg-white p-7 shadow-[0_1px_3px_rgba(20,20,30,0.06)]"
    :class="danger ? 'border-red-200' : 'border-[#18181f]/[0.06]'"
  >
    <h2 class="text-sm font-bold" :class="danger ? 'text-red-600' : 'text-[#18181f]'">{{ title }}</h2>
    <p v-if="description" class="mt-1.5 text-[13px] text-[#18181f]/50">{{ description }}</p>
    <div class="mt-5">
      <slot />
    </div>
  </section>
</template>
