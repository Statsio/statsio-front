<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  {
    size: 'md',
  }
)

const emit = defineEmits<{
  'update:open': [boolean]
  'close': []
}>()

const handleClose = () => {
  emit('update:open', false)
  emit('close')
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
}

// ─── Accessibilité : piège à focus + restauration (RGAA / WCAG 2.4.3, 2.1.2) ──
const panelRef = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusableElements(): HTMLElement[] {
  if (!panelRef.value) return []
  return Array.from(panelRef.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    handleClose()
    return
  }
  if (e.key !== 'Tab') return

  const items = focusableElements()
  const first = items[0]
  const last = items[items.length - 1]
  if (!first || !last) return

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      previouslyFocused = document.activeElement as HTMLElement | null
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      focusableElements()[0]?.focus()
    } else {
      document.removeEventListener('keydown', onKeydown)
      previouslyFocused?.focus()
      previouslyFocused = null
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="handleClose"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="open"
            ref="panelRef"
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-modal-title"
            class="flex max-h-[90vh] w-full flex-col rounded-2xl bg-white shadow-2xl"
            :class="sizeClasses[size]"
          >
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 id="app-modal-title" class="text-lg font-semibold text-slate-900">{{ title }}</h2>
              <button
                type="button"
                class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                @click="handleClose"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Content -->
            <div class="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <slot />
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="border-t border-slate-200 px-6 py-4">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
