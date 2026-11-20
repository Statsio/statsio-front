import { onBeforeUnmount, onMounted } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { BLOCK_META } from '@/types/studio'
import { useStudioToast } from '@/composables/useStudioToast'

/**
 * Raccourcis clavier globaux du Studio :
 * Ctrl/Cmd+S enregistrer (même en saisie) · Ctrl+Z / Ctrl+Maj+Z / Ctrl+Y annuler-rétablir ·
 * Ctrl+D dupliquer · Suppr/Retour arrière supprimer · Alt+↑/↓ déplacer · Échap désélectionner.
 * Hors Ctrl+S, inactifs pendant une saisie (input, textarea, contenteditable) ou modale ouverte.
 */
export function useStudioShortcuts(onSave: () => void) {
  const studio = useStudioStore()
  const { show } = useStudioToast()

  function isTyping(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null
    if (!el) return false
    return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)
  }

  function modalOpen(): boolean {
    return !!document.querySelector('[aria-modal="true"]')
  }

  function onKeydown(e: KeyboardEvent) {
    const mod = e.ctrlKey || e.metaKey
    const key = e.key.toLowerCase()
    if (mod && key === 's') {
      e.preventDefault()
      onSave()
      return
    }
    if (e.defaultPrevented || isTyping(e.target) || modalOpen() || studio.isPreview) return

    if (mod && key === 'z') {
      e.preventDefault()
      if (e.shiftKey) studio.redo()
      else studio.undo()
      return
    }
    if (mod && key === 'y') {
      e.preventDefault()
      studio.redo()
      return
    }

    const sel = studio.selectedBlock
    if (mod && key === 'd' && sel && !sel.locked) {
      e.preventDefault()
      if (studio.duplicateBlock(sel.id)) show('Bloc dupliqué')
      return
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && sel && !sel.locked) {
      e.preventDefault()
      const label = BLOCK_META[sel.type]?.label ?? 'Bloc'
      studio.removeBlock(sel.id)
      show(`Bloc « ${label} » supprimé`, 'Annuler', () => studio.undo())
      return
    }
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && sel) {
      e.preventDefault()
      studio.moveBlockWithinZone(sel.id, e.key === 'ArrowUp' ? -1 : 1)
      return
    }
    if (e.key === 'Escape' && (studio.selectedBlockId || studio.selectedSectionId)) {
      studio.selectBlock(null)
      studio.selectSection(null)
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
}
