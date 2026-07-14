<script setup lang="ts">
withDefaults(
  defineProps<{
    active: boolean
    activeLabel: string
    inactiveLabel: string
    size?: 'sm' | 'md'
    fullWidth?: boolean
  }>(),
  { size: 'md', fullWidth: false },
)

defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    class="flex items-center gap-2 shrink-0 whitespace-nowrap rounded-[10px] border-[1.5px] font-bold transition-colors"
    :class="[
      active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-[#18181f]/15 bg-white text-[#18181f] hover:border-[#18181f]/25',
      size === 'sm' ? 'px-4 py-2.5 text-[13.5px]' : 'px-[22px] py-3 text-[14px]',
      fullWidth ? 'w-full justify-center' : '',
    ]"
    @click="$emit('toggle')"
  >
    <slot name="icon" />
    {{ active ? activeLabel : inactiveLabel }}
  </button>
</template>
