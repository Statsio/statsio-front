<script setup lang="ts">
const { progress, isLoading } = useLoadingIndicator()

const isVisible = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | null = null

watch(isLoading, (loading) => {
  if (loading) {
    isVisible.value = true
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  } else {
    hideTimer = setTimeout(() => {
      isVisible.value = false
    }, 600)
  }
})
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-500 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isVisible"
      class="pointer-events-none fixed inset-x-0 top-0 z-[300] h-[3px]"
      aria-hidden="true"
      role="progressbar"
      :aria-valuenow="Math.round(progress)"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="loading-bar absolute inset-y-0 left-0 h-full rounded-r-full"
        :style="{ width: `${progress}%` }"
      />
    </div>
  </Transition>
</template>

<style scoped>
.loading-bar {
  background: linear-gradient(90deg, #8b5cf6 0%, #6366f1 45%, #3b82f6 100%);
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
  box-shadow:
    0 0 10px 2px rgba(139, 92, 246, 0.65),
    0 0 24px 4px rgba(99, 102, 241, 0.25);
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
</style>
