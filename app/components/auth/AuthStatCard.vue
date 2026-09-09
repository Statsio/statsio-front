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
  <div
    class="flex items-center gap-3.5 rounded-[14px] border border-white/[0.09] bg-white/[0.06] px-[18px] py-4"
  >
    <div v-if="icon === 'bar'" class="flex h-[30px] flex-none items-end gap-[3px]">
      <span class="h-[40%] w-[5px] rounded-[2px] bg-[#3b82f6]" />
      <span class="h-[70%] w-[5px] rounded-[2px] bg-[#7c3aed]" />
      <span class="h-full w-[5px] rounded-[2px] bg-[#a78bfa]" />
      <span class="h-[55%] w-[5px] rounded-[2px] bg-[#7c3aed]" />
    </div>
    <div
      v-else
      class="h-[30px] w-[30px] flex-none rounded-full"
      style="background: conic-gradient(#a78bfa 0deg 230deg, rgba(255, 255, 255, 0.15) 230deg 360deg)"
    />
    <div class="min-w-0 flex-1">
      <p class="mono truncate text-[15px] font-semibold text-white">{{ value }}</p>
      <p class="mt-0.5 text-[12.5px] leading-snug text-white/50">{{ detail }}</p>
    </div>
  </div>
</template>
