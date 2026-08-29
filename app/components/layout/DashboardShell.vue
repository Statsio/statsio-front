<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Coquille d'application plein écran réutilisable : sidebar fixe (desktop) / tiroir
 * (mobile) + barre supérieure + zone de contenu scrollable. Aucune logique métier —
 * le contenu de la sidebar et de la topbar est passé en slots. Sert l'espace compte
 * (`layouts/account.vue`) et, à terme, le dashboard chaîne.
 *
 * Slots : `sidebar` (reçoit `{ close }`), `topbar` (reçoit `{ toggleSidebar }`), défaut (main).
 */
withDefaults(defineProps<{ sidebarWidth?: string }>(), { sidebarWidth: '264px' })

const route = useRoute()
const sidebarOpen = ref(false)

onMounted(() => {
  sidebarOpen.value = window.innerWidth >= 1024
})

watch(
  () => route.fullPath,
  () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) sidebarOpen.value = false
  },
)

function closeOnMobile() {
  if (typeof window !== 'undefined' && window.innerWidth < 1024) sidebarOpen.value = false
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-[#f4f3f8] text-slate-900">
    <a href="#main-content" class="sr-skip-link">Passer au contenu principal</a>

    <!-- Overlay (mobile) -->
    <Transition
      enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
      leave-to-class="opacity-0"
    >
      <div v-if="sidebarOpen" class="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" @click="sidebarOpen = false" />
    </Transition>

    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-50 flex h-full shrink-0 -translate-x-full flex-col border-r border-slate-200 bg-white transition-transform duration-200 motion-reduce:transition-none lg:static lg:z-auto lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : 'lg:hidden'"
      :style="{ width: sidebarWidth }"
    >
      <slot name="sidebar" :close="closeOnMobile" />
    </aside>

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header
        class="flex h-[62px] shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6"
      >
        <button
          type="button"
          class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          aria-label="Basculer la navigation"
          @click="sidebarOpen = !sidebarOpen"
        >
          <svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <slot name="topbar" :toggle-sidebar="() => (sidebarOpen = !sidebarOpen)" />
      </header>

      <!-- `relative` : contient les éléments en `position:absolute` des pages
           (ex. inputs `sr-only` des color pickers) pour qu'ils n'étirent pas le
           scroll du document et ne laissent pas apparaître le fond sous la coquille. -->
      <main id="main-content" tabindex="-1" class="relative flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
