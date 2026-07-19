<script setup lang="ts">
withDefaults(
  defineProps<{
    value: string
    detail: string
    icon?: 'bar' | 'donut'
  }>(),
  { icon: 'bar' },
)
</script>

<template>
  <div class="flex items-center gap-3.5 rounded-2xl bg-white/10 px-4.5 py-4 backdrop-blur-sm">
    <div v-if="icon === 'bar'" class="flex h-7.5 flex-none items-end gap-[3px]">
      <span class="h-[40%] w-[5px] rounded-full bg-white/45" />
      <span class="h-[70%] w-[5px] rounded-full bg-white/65" />
      <span class="h-full w-[5px] rounded-full bg-white" />
      <span class="h-[55%] w-[5px] rounded-full bg-white/65" />
    </div>
    <div
      v-else
      class="h-7.5 w-7.5 flex-none rounded-full"
      style="background: conic-gradient(#fff 0deg 230deg, rgba(255, 255, 255, 0.3) 230deg 360deg)"
    />
    <div class="min-w-0 flex-1">
      <p class="mono truncate text-[15px] font-semibold text-white">{{ value }}</p>
      <p class="mt-0.5 text-[12.5px] leading-snug text-white/60">{{ detail }}</p>
    </div>
  </div>
</template>
