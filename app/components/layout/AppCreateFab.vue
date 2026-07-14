<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getBrandFromPath } from '@/data/brands'
import { useAuthStore } from '@/stores/auth'
import { useClickOutside } from '@/composables/useClickOutside'
import AppNavIcon from '@/components/layout/AppNavIcon.vue'
import CreateContentModal from '@/components/create/CreateContentModal.vue'
import { CONTENT_CREATION_MENU_ITEMS as menuItems } from '@/data/content-creation-menu'
import type { ContentType } from '@/types/content-creation'

const authStore = useAuthStore()
const route = useRoute()

const isOpen = ref(false)
const fabRef = ref<HTMLElement | null>(null)

const activeModal = ref<ContentType | null>(null)
const modalOpen = computed({ get: () => activeModal.value !== null, set: (v) => { if (!v) activeModal.value = null } })

const currentBrand = computed(() => getBrandFromPath(route.path))
const isTvstats = computed(() => currentBrand.value.id === 'tvstats')

function closeMenu() { isOpen.value = false }
function openModal(id: typeof menuItems[number]['id']) {
  activeModal.value = id
  closeMenu()
}

useClickOutside(fabRef, closeMenu)
watch(() => route.fullPath, closeMenu)
</script>

<template>
  <div v-if="authStore.isAuthenticated" ref="fabRef" class="pointer-events-none fixed bottom-6 right-6 z-50">
    <div class="pointer-events-auto relative flex flex-col items-end gap-3">

      <!-- Dropdown panel -->
      <Transition
        enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
        enter-from-class="translate-y-2 opacity-0 scale-95"
        enter-to-class="translate-y-0 opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
        leave-from-class="translate-y-0 opacity-100 scale-100"
        leave-to-class="translate-y-1 opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          class="mb-1 w-[min(22rem,calc(100vw-3rem))] overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white/96 shadow-[0_32px_80px_-32px_rgba(15,23,42,0.4)] backdrop-blur-xl"
          role="menu"
          aria-label="Créer un contenu"
        >
          <!-- Header -->
          <div class="border-b border-slate-100 px-5 py-3.5">
            <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Créer</p>
          </div>

          <!-- Items -->
          <div class="p-2">
            <button
              v-for="item in menuItems"
              :key="item.id"
              type="button"
              role="menuitem"
              class="group flex w-full items-center gap-3.5 rounded-2xl px-3.5 py-3 text-left transition hover:bg-[var(--color-primary)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
              @click="openModal(item.id)"
            >
              <!-- Icon -->
              <span
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-slate-50 shadow-[0_4px_12px_rgba(15,23,42,0.08)] transition group-hover:shadow-[0_4px_16px_color-mix(in_srgb,var(--color-primary)_18%,transparent)] group-hover:bg-white"
              >
                <AppNavIcon :kind="item.icon" class="h-6 w-6" />
              </span>

              <!-- Text -->
              <span class="min-w-0 flex-1">
                <span class="block text-[13.5px] font-bold text-slate-900">{{ item.label }}</span>
                <span class="mt-0.5 block truncate text-[11.5px] leading-5 text-slate-500">{{ item.description }}</span>
              </span>

              <!-- Arrow -->
              <svg
                class="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[var(--color-primary)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </Transition>

      <!-- FAB Button -->
      <button
        type="button"
        class="group relative flex h-14 items-center overflow-hidden rounded-full font-bold text-white shadow-[0_16px_40px_-12px_color-mix(in_srgb,var(--color-primary)_60%,transparent)] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.98] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 focus-visible:ring-offset-2"
        :class="[
          'bg-[var(--color-primary)]',
          isOpen ? 'pr-5 pl-4' : 'pr-6 pl-4',
        ]"
        :aria-expanded="isOpen"
        aria-haspopup="menu"
        aria-label="Ouvrir les options de création"
        @click="isOpen = !isOpen"
      >
        <!-- Plus / X icon with transition -->
        <span class="relative mr-2.5 flex h-7 w-7 items-center justify-center">
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="rotate-90 opacity-0 scale-50"
            enter-to-class="rotate-0 opacity-100 scale-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="rotate-0 opacity-100 scale-100"
            leave-to-class="-rotate-90 opacity-0 scale-50"
            mode="out-in"
          >
            <!-- X when open -->
            <svg
              v-if="isOpen"
              class="absolute h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <!-- Plus when closed -->
            <svg
              v-else
              class="absolute h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14" />
            </svg>
          </Transition>
        </span>

        <span class="text-sm tracking-wide">Créer</span>
      </button>
    </div>
  </div>

  <!-- Modal (teleported to body via AppStepModal) -->
  <CreateContentModal :type="activeModal ?? 'statsdata'" v-model:open="modalOpen" @close="activeModal = null" />
</template>
