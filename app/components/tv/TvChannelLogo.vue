<script setup lang="ts">
const props = defineProps<{
  src?: string | null
  name: string
  fallbackBg?: string
  maxInitials?: number
}>()

const failed = ref(false)

const initials = computed(() => {
  const words = props.name.split(' ')
  const n = props.maxInitials ?? 2
  if (words.length > 1) {
    return words.map((w: string) => w[0]).join('').slice(0, n).toUpperCase()
  }
  return props.name.slice(0, n).toUpperCase()
})
</script>

<template>
  <div class="flex items-center justify-center overflow-hidden border border-slate-200 bg-slate-100">
    <img
      v-if="src && !failed"
      :src="src"
      :alt="name"
      class="h-full w-full object-contain"
      loading="lazy"
      @error="failed = true"
    />
    <span
      v-else
      class="flex h-full w-full items-center justify-center text-[9px] font-bold"
      :class="fallbackBg ?? 'text-slate-600'"
    >{{ initials }}</span>
  </div>
</template>
