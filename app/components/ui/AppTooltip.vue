<script setup lang="ts">
import { ref, useId } from 'vue'

defineProps<{
  text: string
}>()

const tooltipId = useId()
const visible = ref(false)
</script>

<template>
  <span
    class="relative inline-flex"
    @mouseenter="visible = true"
    @mouseleave="visible = false"
    @focusin="visible = true"
    @focusout="visible = false"
  >
    <span :aria-describedby="tooltipId">
      <slot />
    </span>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <span
        v-if="visible"
        :id="tooltipId"
        role="tooltip"
        class="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#18181f] px-2.5 py-1.5 text-[11.5px] font-semibold text-white shadow-lg"
      >
        {{ text }}
        <span class="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#18181f]" />
      </span>
    </Transition>
  </span>
</template>
