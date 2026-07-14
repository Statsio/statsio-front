<script setup lang="ts">
import { computed, ref } from 'vue'
import AppNavIcon from '@/components/layout/AppNavIcon.vue'
import CreateContentModal from '@/components/create/CreateContentModal.vue'
import { useClickOutside } from '@/composables/useClickOutside'
import { CONTENT_CREATION_MENU_ITEMS } from '@/data/content-creation-menu'
import type { ContentType } from '@/types/content-creation'

const isOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const activeType = ref<ContentType | null>(null)
const modalOpen = computed({
  get: () => activeType.value !== null,
  set: (v) => { if (!v) activeType.value = null },
})

function openType(id: ContentType) {
  activeType.value = id
  isOpen.value = false
}

useClickOutside(rootRef, () => { isOpen.value = false })
</script>

<template>
  <div ref="rootRef" class="relative">
    <button
      type="button"
      class="whitespace-nowrap rounded-xl bg-[linear-gradient(135deg,#8b5cf6,#3b82f6)] px-[22px] py-[13px] text-[14.5px] font-bold text-white transition hover:brightness-105"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      + Nouveau contenu
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.35)]"
        role="menu"
        aria-label="Type de contenu à créer"
      >
        <button
          v-for="item in CONTENT_CREATION_MENU_ITEMS"
          :key="item.id"
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[var(--color-primary)]/5"
          @click="openType(item.id)"
        >
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-slate-50">
            <AppNavIcon :kind="item.icon" class="h-5 w-5" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-[13px] font-bold text-slate-900">{{ item.label }}</span>
            <span class="block truncate text-[11px] text-slate-500">{{ item.description }}</span>
          </span>
        </button>
      </div>
    </Transition>

    <CreateContentModal :type="activeType ?? 'statsdata'" v-model:open="modalOpen" @close="activeType = null" />
  </div>
</template>
