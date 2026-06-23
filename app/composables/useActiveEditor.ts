import { ref } from 'vue'
import type { Editor } from '@tiptap/core'

// Module-level singletons so all components share the same active target
const _editor = ref<Editor | null>(null)
const _input  = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)

export function useActiveEditor() {
  function setActiveEditor(editor: Editor) {
    _editor.value = editor
    _input.value  = null
  }

  function setActiveInput(el: HTMLInputElement | HTMLTextAreaElement) {
    _input.value  = el
    _editor.value = null
  }

  function clearActive() {
    // Only clear if nothing else grabbed focus — delay so mousedown.prevent works
    requestAnimationFrame(() => {
      if (document.activeElement !== _input.value && _editor.value?.isFocused === false) {
        _input.value  = null
        _editor.value = null
      }
    })
  }

  function insertToken(name: string) {
    const token = '{' + '{' + name + '}' + '}'

    // Tiptap editor
    if (_editor.value && !_editor.value.isDestroyed) {
      _editor.value.chain().focus().insertContent(token).run()
      return
    }

    // Regular input / textarea
    const el = _input.value
    if (!el) return
    const start  = el.selectionStart ?? el.value.length
    const end    = el.selectionEnd   ?? el.value.length
    const newVal = el.value.slice(0, start) + token + el.value.slice(end)

    // Native setter so Vue's `:value` binding reads the change via the dispatched event
    const nativeSetter = Object.getOwnPropertyDescriptor(
      el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
      'value',
    )!.set!
    nativeSetter.call(el, newVal)
    el.dispatchEvent(new Event('input',  { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))

    // Restore cursor after the inserted token
    const cursor = start + token.length
    requestAnimationFrame(() => { el.setSelectionRange(cursor, cursor) })
  }

  return { setActiveEditor, setActiveInput, clearActive, insertToken }
}
