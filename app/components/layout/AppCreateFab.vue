<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getBrandFromPath } from '@/data/brands'
import { useAuthStore } from '@/stores/auth'
import { useClickOutside } from '@/composables/useClickOutside'
import { useCreateContentModal } from '@/composables/useCreateContentModal'
import CreateContentMenuPanel from '@/components/create/CreateContentMenuPanel.vue'
import CreateContentModal from '@/components/create/CreateContentModal.vue'
import DsButton from '@/components/ds/DsButton.vue'
import StudioIcon from '@/components/studio/ui/StudioIcon.vue'

const authStore = useAuthStore()
const route = useRoute()
const fabRef = ref<HTMLElement | null>(null)

const { menuOpen, type, closeMenu, pick, closeModal } = useCreateContentModal()
const currentBrand = computed(() => getBrandFromPath(route.path))

useClickOutside(fabRef, closeMenu)
watch(() => route.fullPath, closeMenu)
</script>

<template>
  <div
    v-if="authStore.isAuthenticated"
    ref="fabRef"
    :data-theme="currentBrand.id"
    class="pointer-events-none fixed bottom-6 right-6 z-50"
  >
    <div class="pointer-events-auto relative flex flex-col items-end gap-3">
      <Transition
        enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-1 opacity-0"
      >
        <CreateContentMenuPanel
          v-if="menuOpen"
          class="mb-1 w-[min(22rem,calc(100vw-3rem))]"
          @select="pick"
        />
      </Transition>

      <DsButton
        :aria-expanded="menuOpen"
        aria-haspopup="menu"
        aria-label="Ouvrir les options de création"
        @click="menuOpen = !menuOpen"
      >
        <StudioIcon :name="menuOpen ? 'x' : 'plus'" :size="16" />
        Créer
      </DsButton>
    </div>
  </div>

  <CreateContentModal
    v-if="type"
    :open="true"
    :type="type"
    @update:open="(v) => { if (!v) closeModal() }"
    @close="closeModal"
  />
</template>
