<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useStudioStore } from '@/stores/studio'

const studio = useStudioStore()

/** Hauteur de la barre du bas (`StudioBottomTabBar`) : le sheet reste ancré au-dessus, jamais par-dessus. */
const TAB_BAR_HEIGHT = 64
const HALF_RATIO = 0.55
const FULL_RATIO = 0.94

/** Hauteur courante en px pendant un drag ; `null` = on suit le palier du store. */
const dragHeight = ref<number | null>(null)
let dragStartY = 0
let dragStartHeight = 0

function availableHeight() {
  return (window.visualViewport?.height ?? window.innerHeight) - TAB_BAR_HEIGHT
}

function snapHeight(snap: 'half' | 'full') {
  return availableHeight() * (snap === 'full' ? FULL_RATIO : HALF_RATIO)
}

const sheetHeight = computed(() => {
  if (dragHeight.value !== null) return dragHeight.value
  if (studio.mobileSheetSnap === 'closed') return 0
  return snapHeight(studio.mobileSheetSnap)
})

function onHandlePointerDown(event: PointerEvent) {
  if (studio.mobileSheetSnap === 'closed') return
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  dragStartY = event.clientY
  dragStartHeight = sheetHeight.value
  dragHeight.value = dragStartHeight
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(event: PointerEvent) {
  if (dragHeight.value === null) return
  const delta = dragStartY - event.clientY
  dragHeight.value = Math.min(availableHeight(), Math.max(0, dragStartHeight + delta))
}

function onPointerUp() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  const height = dragHeight.value ?? 0
  dragHeight.value = null

  const halfPx = snapHeight('half')
  const fullPx = snapHeight('full')
  if (height < halfPx * 0.4) studio.closeMobileSheet()
  else if (height < (halfPx + fullPx) / 2) studio.setMobileSheetSnap('half')
  else studio.setMobileSheetSnap('full')
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-220 ease-out"
      enter-from-class="opacity-0 translate-y-6"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-160 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-6"
    >
      <div
        v-if="studio.mobileSheetSnap !== 'closed'"
        class="fixed inset-x-0 z-40 flex flex-col rounded-t-[20px] border-t border-[var(--studio-line)] bg-white shadow-[0_-8px_32px_rgba(20,20,30,0.18)] md:hidden"
        :style="{
          bottom: `${TAB_BAR_HEIGHT}px`,
          height: `${sheetHeight}px`,
          transition: dragHeight === null ? 'height 0.22s cubic-bezier(0.32,0.72,0,1)' : 'none',
        }"
        role="dialog"
        aria-modal="false"
        aria-label="Panneau de configuration"
      >
        <button
          type="button"
          class="flex shrink-0 touch-none items-center justify-center py-2.5"
          aria-label="Redimensionner le panneau"
          @pointerdown="onHandlePointerDown"
        >
          <span class="h-1.5 w-10 rounded-full bg-[var(--studio-line)]" />
        </button>

        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
