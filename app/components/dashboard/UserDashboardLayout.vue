<script setup lang="ts">
defineProps<{
  errorMessage?: string
}>()
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
    <aside class="flex flex-col gap-6">
      <slot name="sidebar" />
    </aside>

    <div class="flex flex-col gap-6">
      <div
        v-if="errorMessage"
        class="rounded-[1.75rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700"
      >
        {{ errorMessage }}
      </div>

      <slot />
    </div>
  </div>
</template>
