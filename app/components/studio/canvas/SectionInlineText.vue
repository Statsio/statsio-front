<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Highlight } from '@tiptap/extension-highlight'
import { useActiveEditor } from '@/composables/useActiveEditor'
import { TextTransformExtension, VariableHighlight } from '@/lib/tiptap-extensions'
import { isBlankInlineHtml } from '@/lib/inline-rich-text'

/**
 * Champ éditable en place sur le canevas (sur-titre / titre / description de
 * section). Éditeur Tiptap volontairement restreint : marques de caractère
 * (gras, italique, souligné, barré, surlignage, majuscules, interlettrage) +
 * jetons `{{variable}}`. Pas de listes, ni couleur, ni police, ni saut de ligne
 * (Entrée valide et sort du champ). Contenu émis en HTML inline.
 */
const props = withDefaults(
  defineProps<{
    modelValue: string
    sectionId: string
    field: 'kicker' | 'title' | 'description'
    placeholder?: string
  }>(),
  { placeholder: '' },
)

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const { setActiveEditor, clearActiveEditor } = useActiveEditor()

const empty = ref(isBlankInlineHtml(props.modelValue))
let suppressSave = false
let syncTimer: ReturnType<typeof setTimeout> | null = null

function flush() {
  if (syncTimer) { clearTimeout(syncTimer); syncTimer = null }
  const e = editor.value
  if (!e || e.isDestroyed) return
  const html = e.isEmpty ? '' : e.getHTML()
  emit('update:modelValue', html)
}

const editor = useEditor({
  content: props.modelValue || '',
  editable: true,
  extensions: [
    StarterKit.configure({
      heading: false,
      bulletList: false,
      orderedList: false,
      listItem: false,
      blockquote: false,
      codeBlock: false,
      code: false,
      horizontalRule: false,
    }),
    Underline,
    TextStyle,
    Highlight.configure({ multicolor: true }),
    TextTransformExtension,
    VariableHighlight,
  ],
  editorProps: {
    attributes: { class: 'outline-none' },
    // Entrée = valider (jamais de retour à la ligne dans un en-tête).
    handleKeyDown: (_view, event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        ;(document.activeElement as HTMLElement | null)?.blur()
        return true
      }
      return false
    },
  },
  onCreate: ({ editor: e }) => { empty.value = e.isEmpty },
  onFocus: ({ editor: e }) => {
    setActiveEditor(e as Parameters<typeof setActiveEditor>[0], {
      kind: 'section-header',
      sectionId: props.sectionId,
      field: props.field,
    })
  },
  onBlur: () => flush(),
  onUpdate: ({ editor: e }) => {
    empty.value = e.isEmpty
    if (suppressSave) return
    if (syncTimer) clearTimeout(syncTimer)
    syncTimer = setTimeout(() => {
      emit('update:modelValue', e.isEmpty ? '' : e.getHTML())
      syncTimer = null
    }, 300)
  },
})

// Recopie la valeur du store quand elle change hors édition.
watch(() => props.modelValue, (value) => {
  const e = editor.value
  if (!e || e.isDestroyed || e.isFocused) return
  if ((e.isEmpty ? '' : e.getHTML()) === (value || '')) return
  suppressSave = true
  e.commands.setContent(value || '')
  empty.value = e.isEmpty
  suppressSave = false
})

onBeforeUnmount(() => {
  flush()
  clearActiveEditor(editor.value ?? undefined)
})
</script>

<template>
  <div
    class="studio-inline-edit"
    :class="{ 'studio-inline-edit--empty': empty }"
    :data-placeholder="placeholder"
  >
    <EditorContent :editor="editor" />
  </div>
</template>

<style scoped>
.studio-inline-edit {
  position: relative;
  border-radius: 5px;
  transition: box-shadow 0.12s ease;
}
.studio-inline-edit :deep(.tiptap) {
  outline: none;
  cursor: text;
  min-width: 0;
  overflow-wrap: anywhere;
}
.studio-inline-edit:hover {
  box-shadow: 0 0 0 1px var(--studio-line-strong, #d9d9e3);
}
.studio-inline-edit:focus-within {
  box-shadow: 0 0 0 2px var(--color-primary, #7c3aed);
}
.studio-inline-edit :deep(.tiptap p) {
  margin: 0;
  font: inherit;
  letter-spacing: inherit;
  color: inherit;
}
.studio-inline-edit--empty::before {
  content: attr(data-placeholder);
  position: absolute;
  inset: 0;
  color: var(--studio-faint, #9aa0ae);
  font-weight: inherit;
  pointer-events: none;
}
.studio-inline-edit :deep(.var-token) {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
  border-radius: 4px;
  padding: 1px 5px;
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
  font-weight: 700;
}
</style>
