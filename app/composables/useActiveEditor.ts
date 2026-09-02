import { ref, readonly } from 'vue'
import type { Editor } from '@tiptap/core'

/**
 * Décrit le propriétaire de l'éditeur actif — la toolbar l'utilise pour savoir
 * si elle est en mode « bloc de texte » (complet) ou « en-tête de section »
 * (restreint : marques de caractère + variable, pas de listes / couleur / police).
 */
export type ActiveEditorContext =
  | { kind: 'block' }
  | { kind: 'section-header'; sectionId: string; field: 'kicker' | 'title' | 'description' }

// Module-level singletons so all components share the same active target
const _editor = ref<Editor | null>(null)
const _input  = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
const _editorVersion = ref(0)
const _context = ref<ActiveEditorContext>({ kind: 'block' })

function _onTransaction() { _editorVersion.value++ }

export function useActiveEditor() {
  function setActiveEditor(editor: Editor, context: ActiveEditorContext = { kind: 'block' }) {
    if (_editor.value && _editor.value !== editor) {
      try { _editor.value.off('transaction', _onTransaction) } catch {}
    }
    if (_editor.value !== editor) {
      _editor.value = editor
      editor.on('transaction', _onTransaction)
    }
    _context.value = context
    _input.value = null
  }

  function setActiveInput(el: HTMLInputElement | HTMLTextAreaElement) {
    if (_editor.value) {
      try { _editor.value.off('transaction', _onTransaction) } catch {}
    }
    _input.value  = el
    _editor.value = null
  }

  function clearActive() {
    // Only clear if nothing else grabbed focus — delay so mousedown.prevent works
    requestAnimationFrame(() => {
      if (document.activeElement !== _input.value && _editor.value?.isFocused === false) {
        _input.value  = null
        _editor.value = null
        _context.value = { kind: 'block' }
      }
    })
  }

  // Call in onBeforeUnmount of the TextBlock that owns the editor
  function clearActiveEditor(editorInstance?: Editor) {
    if (editorInstance && _editor.value !== editorInstance) return
    if (_editor.value) {
      try { _editor.value.off('transaction', _onTransaction) } catch {}
    }
    _editor.value = null
    _context.value = { kind: 'block' }
  }

  /** Insère du texte brut à la position du curseur de la cible active (éditeur Tiptap ou input/textarea). */
  function insertRaw(text: string) {
    // Tiptap editor
    if (_editor.value && !_editor.value.isDestroyed) {
      _editor.value.chain().focus().insertContent(text).run()
      return
    }

    // Regular input / textarea
    const el = _input.value
    if (!el) return
    const start  = el.selectionStart ?? el.value.length
    const end    = el.selectionEnd   ?? el.value.length
    const newVal = el.value.slice(0, start) + text + el.value.slice(end)

    // Native setter so Vue's `:value` binding reads the change via the dispatched event
    const nativeSetter = Object.getOwnPropertyDescriptor(
      el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
      'value',
    )!.set!
    nativeSetter.call(el, newVal)
    el.dispatchEvent(new Event('input',  { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))

    // Restore cursor after the inserted text
    const cursor = start + text.length
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(cursor, cursor) })
  }

  function insertToken(name: string) {
    insertRaw('{' + '{' + name + '}' + '}')
  }

  return {
    activeEditor: readonly(_editor),
    activeEditorContext: readonly(_context),
    editorVersion: readonly(_editorVersion),
    setActiveEditor,
    setActiveInput,
    clearActive,
    clearActiveEditor,
    insertToken,
    insertRaw,
  }
}
