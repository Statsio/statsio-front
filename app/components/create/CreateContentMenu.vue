<script setup lang="ts">
import { computed, ref } from 'vue'
import CreateContentModal from '@/components/create/CreateContentModal.vue'
import AppNavIcon from '@/components/layout/AppNavIcon.vue'
import { useClickOutside } from '@/composables/useClickOutside'
import { CONTENT_CREATION_MENU_ITEMS } from '@/data/content-creation-menu'
import type { ContentType } from '@/types/content-creation'

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

const open = ref(false)
const activeModal = ref<ContentType | null>(null)
const root = ref<HTMLElement | null>(null)

const modalOpen = computed({
  get: () => activeModal.value !== null,
  set: (v) => {
    if (!v) activeModal.value = null
  },
})

useClickOutside(root, () => (open.value = false))

function pick(type: ContentType) {
  open.value = false
  activeModal.value = type
}
</script>

<template>
  <div ref="root" class="relative">
    <slot :open="open" :toggle="() => (open = !open)" />

    <Transition
      enter-active-class="transition duration-150 ease-out motion-reduce:transition-none"
      enter-from-class="translate-y-1 opacity-0 scale-95"
      leave-active-class="transition duration-100 ease-in motion-reduce:transition-none"
      leave-to-class="translate-y-1 opacity-0 scale-95"
    >
      <div
        v-if="open"
        class="absolute z-[80] w-[290px] overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_18px_44px_rgba(18,18,26,0.18)]"
        :class="[
          align === 'right' ? 'right-0' : 'left-0',
          direction === 'up' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]',
          panelClass,
        ]"
        role="menu"
        aria-label="Créer un contenu"
      >
        <p class="px-2.5 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-400">
          Type de contenu
        </p>
        <button
          v-for="item in CONTENT_CREATION_MENU_ITEMS"
          :key="item.id"
          type="button"
          role="menuitem"
          class="group flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          @click="pick(item.id)"
        >
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-slate-50">
            <AppNavIcon :kind="item.icon" class="h-5 w-5" />
          </span>
          <span class="min-w-0">
            <span class="block text-[13px] font-bold text-slate-900">{{ item.label }}</span>
            <span class="mt-0.5 block text-[11.5px] leading-snug text-slate-500">{{ item.description }}</span>
          </span>
        </button>
      </div>
    </Transition>

    <CreateContentModal
      v-if="activeModal"
      :open="modalOpen"
      :type="activeModal"
      @update:open="modalOpen = $event"
      @close="modalOpen = false"
    />
  </div>
</template>
