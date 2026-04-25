<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'

defineProps<{
  documentId: string
  documentSlug: string
}>()

const emit = defineEmits<{
  'move-to-trash': []
}>()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

onClickOutside(dropdownRef, () => {
  isOpen.value = false
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const handleMoveToTrash = () => {
  isOpen.value = false
  emit('move-to-trash')
}
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <button
      type="button"
      class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      @click.stop="toggleDropdown"
      aria-label="Actions"
    >
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
      </svg>
    </button>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 top-full z-10 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
      >
        <router-link
          :to="documentSlug ? `/statsdata/${documentSlug}` : '/statsdata'"
          class="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
          @click="isOpen = false"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Voir
        </router-link>

        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50"
          @click="handleMoveToTrash"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Mettre à la corbeille
        </button>
      </div>
    </Transition>
  </div>
</template>
