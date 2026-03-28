<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAccessibilityPreferences } from '@/composables/useAccessibilityPreferences'

const props = defineProps<{
  items: {
    type: string
    title: string
    meta: string
    cta: string
    variant?: 'default' | 'special' | 'live'
  }[]
}>()

const activeIndex = ref(0)
let rotationTimer: ReturnType<typeof setInterval> | null = null
const ROTATION_DELAY = 6800
const { reducedMotion } = useAccessibilityPreferences()

const activeItem = computed(() => props.items[activeIndex.value] ?? null)

const stopRotation = () => {
  if (!rotationTimer) return

  clearInterval(rotationTimer)
  rotationTimer = null
}

const startRotation = () => {
  stopRotation()

  if (props.items.length <= 1 || reducedMotion.value) return

  rotationTimer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % props.items.length
  }, ROTATION_DELAY)
}

const restartRotation = () => {
  startRotation()
}

const goTo = (index: number) => {
  activeIndex.value = index
  restartRotation()
}

onMounted(() => {
  startRotation()
})

watch(reducedMotion, (isReduced) => {
  if (isReduced) {
    stopRotation()
    return
  }

  startRotation()
})

onBeforeUnmount(() => {
  stopRotation()
})
</script>

<template>
  <section
    class="fixed inset-x-0 top-0 z-50 border-b border-[color:var(--color-primary)]/12 bg-[color:var(--color-secondary)]/92 text-slate-900 backdrop-blur-xl"
    @mouseenter="stopRotation"
    @mouseleave="restartRotation"
  >
    <div class="container flex min-h-14 items-center gap-4 py-1">
      <div
        class="hidden rounded-full border border-[color:var(--color-primary)]/15 bg-white/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-600 md:block"
      >
        {{ activeItem?.type ?? 'En avant' }}
      </div>

      <div class="relative min-w-0 flex-1 overflow-hidden">
        <Transition name="promo-swap" mode="out-in">
          <div
            v-if="activeItem"
            :key="`${activeIndex}-${activeItem.title}`"
            class="flex min-w-0 flex-col gap-1 rounded-2xl px-3 py-2 transition-all duration-500 md:flex-row md:items-center md:gap-3"
          >
            <p class="truncate text-sm font-semibold text-slate-900 md:text-[15px]">
              {{ activeItem.title }}
            </p>
            <p class="hidden text-xs text-slate-600 md:block">
              {{ activeItem.meta }}
            </p>
            <a
              href="#"
              class="hidden text-xs font-semibold uppercase tracking-[0.22em] text-slate-800 transition hover:text-[color:var(--color-primary)] lg:inline-flex"
            >
              {{ activeItem.cta }}
            </a>
          </div>
        </Transition>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-for="(item, index) in items"
          :key="item.title"
          type="button"
          :aria-label="`Voir la mise en avant ${index + 1}`"
          :class="[
            'h-2 rounded-full transition-all duration-300',
            index === activeIndex
              ? 'w-8 bg-[color:var(--color-primary)]'
              : 'w-2 bg-slate-400/55 hover:bg-slate-500/70',
          ]"
          @click="goTo(index)"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.promo-swap-enter-active,
.promo-swap-leave-active {
  transition:
    opacity 700ms ease,
    transform 700ms ease,
    filter 700ms ease;
}

.promo-swap-enter-from,
.promo-swap-leave-to {
  opacity: 0;
  transform: translateY(12px);
  filter: blur(12px);
}
</style>
