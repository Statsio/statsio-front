<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppNavIcon from '@/components/layout/AppNavIcon.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const isOpen = ref(false)
const fabRef = ref<HTMLElement | null>(null)

const createItems = computed(() => [
  {
    label: 'Article',
    description: 'Prépare un nouveau format éditorial enrichi.',
    to: '/articles',
    icon: 'articles' as const,
    action: 'Ouvrir',
  },
  {
    label: 'StatsData',
    description: 'Pars d’une base data pour structurer un signal.',
    to: '/statsdata',
    icon: 'stats' as const,
    action: 'Explorer',
  },
  {
    label: 'Sondage',
    description: 'Bientôt disponible dans l’espace créateur.',
    to: '/profile',
    icon: 'polls' as const,
    action: 'Bientôt',
    comingSoon: true,
  },
])

const closeMenu = () => {
  isOpen.value = false
}

const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target

  if (!(target instanceof Node) || !fabRef.value?.contains(target)) {
    closeMenu()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

watch(
  () => route.fullPath,
  () => {
    closeMenu()
  },
)

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div v-if="authStore.isAuthenticated" ref="fabRef" class="pointer-events-none fixed bottom-5 right-5 z-50">
    <div class="pointer-events-auto relative">
      <transition enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
        enter-from-class="translate-y-3 opacity-0" enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
        leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-2 opacity-0">
        <section v-if="isOpen"
          class="absolute right-0 bottom-[calc(100%+1rem)] w-[min(24rem,calc(100vw-2.5rem))] overflow-hidden rounded-[2rem] border border-slate-200 bg-white/95 p-3 shadow-[0_30px_90px_-42px_rgba(15,23,42,0.48)] backdrop-blur"
          aria-label="Créer un contenu">

          <div class="mt-3 grid gap-3">
            <component :is="item.comingSoon ? 'button' : RouterLink" v-for="item in createItems" :key="item.label"
              :to="item.comingSoon ? undefined : item.to" type="button"
              class="group flex w-full items-center gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              :class="item.comingSoon ? 'cursor-default' : ''" @click="item.comingSoon ? undefined : closeMenu()">
              <span
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_16px_30px_-22px_rgba(15,23,42,0.3)]">
                <AppNavIcon :kind="item.icon" class="h-7 w-7" />
              </span>

              <span class="min-w-0 flex-1">
                <span class="flex items-center gap-2 text-base font-semibold text-slate-950">
                  {{ item.label }}
                  <span v-if="item.comingSoon"
                    class="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                    Bientôt
                  </span>
                </span>
                <span class="mt-1 block text-sm leading-6 text-slate-500">{{ item.description }}</span>
              </span>

              <span class="text-sm font-semibold text-primary transition group-hover:translate-x-0.5">
                {{ item.action }}
              </span>
            </component>
          </div>
        </section>
      </transition>

      <AppButton variant="primary" size="lg"
        class="min-h-14 gap-3 px-4 pr-5 shadow-[0_24px_55px_-28px_rgba(139,92,246,0.55)]" :aria-expanded="isOpen"
        aria-haspopup="dialog" aria-label="Ouvrir les options de création" @click="toggleMenu">
        <template #icon>
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </template>
        Créer
      </AppButton>
    </div>
  </div>
</template>
