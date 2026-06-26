import { onBeforeUnmount, onMounted } from 'vue'
import type { Ref } from 'vue'

export function useClickOutside(
  target: Ref<HTMLElement | null>,
  onOutside: () => void,
  { escapeKey = true }: { escapeKey?: boolean } = {},
) {
  function onDocumentClick(e: MouseEvent) {
    if (e.target instanceof Node && !target.value?.contains(e.target)) {
      onOutside()
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onOutside()
  }

  onMounted(() => {
    document.addEventListener('click', onDocumentClick)
    if (escapeKey) document.addEventListener('keydown', onKeydown)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', onDocumentClick)
    if (escapeKey) document.removeEventListener('keydown', onKeydown)
  })
}
