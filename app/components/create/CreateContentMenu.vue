<script setup lang="ts">
import { ref } from 'vue'
import CreateContentMenuPanel from '@/components/create/CreateContentMenuPanel.vue'
import CreateContentModal from '@/components/create/CreateContentModal.vue'
import { useClickOutside } from '@/composables/useClickOutside'
import { useCreateContentModal } from '@/composables/useCreateContentModal'

withDefaults(
  defineProps<{
    /** Position horizontale du panneau relativement au déclencheur. */
    align?: 'left' | 'right'
    /** Ouverture vers le bas (défaut) ou vers le haut. */
    direction?: 'down' | 'up'
    panelClass?: string
  }>(),
  { align: 'left', direction: 'down', panelClass: '' },
)

const root = ref<HTMLElement | null>(null)
const { menuOpen, type, closeMenu, pick, closeModal } = useCreateContentModal()

useClickOutside(root, closeMenu)

function toggle() {
  menuOpen.value = !menuOpen.value
}
</script>

<template>
  <div ref="root" class="relative">
    <slot :open="menuOpen" :toggle="toggle" />

    <Transition
      enter-active-class="transition duration-150 ease-out motion-reduce:transition-none"
      enter-from-class="translate-y-1 opacity-0"
      leave-active-class="transition duration-100 ease-in motion-reduce:transition-none"
      leave-to-class="translate-y-1 opacity-0"
    >
      <CreateContentMenuPanel
        v-if="menuOpen"
        class="absolute z-[80] w-[290px]"
        :class="[
          align === 'right' ? 'right-0' : 'left-0',
          direction === 'up' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]',
          panelClass,
        ]"
        @select="pick"
      />
    </Transition>

    <CreateContentModal
      v-if="type"
      :open="true"
      :type="type"
      @update:open="(v) => { if (!v) closeModal() }"
      @close="closeModal"
    />
  </div>
</template>
