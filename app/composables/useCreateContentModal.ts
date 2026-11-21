import { ref } from 'vue'
import type { ContentType } from '@/types/content-creation'

/** État partagé du menu « Créer » et de la modale de création. */
export function useCreateContentModal() {
  const menuOpen = ref(false)
  const type = ref<ContentType | null>(null)

  function closeMenu() {
    menuOpen.value = false
  }

  function pick(next: ContentType) {
    type.value = next
    menuOpen.value = false
  }

  function closeModal() {
    type.value = null
  }

  return { menuOpen, type, closeMenu, pick, closeModal }
}
