<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import { Highlight } from '@tiptap/extension-highlight'
import { TextAlign } from '@tiptap/extension-text-align'
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { useStudioStore } from '@/stores/studio'
import { useActiveEditor } from '@/composables/useActiveEditor'
import { TextTransformExtension, FontFamilyExtension } from '@/lib/tiptap-extensions'
import type { StudioBlock } from '@/types/studio'

// ProseMirror decoration plugin — highlights {{variable}} tokens visually
// without modifying the document model
const VariableHighlight = Extension.create({
  name: 'variableHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('variableHighlight'),
        props: {
          decorations(state: unknown) {
            type PmNode = { isText: boolean; text?: string }
            type PmDoc  = { descendants: (fn: (node: PmNode, pos: number) => void) => void }
            type PmState = { doc: PmDoc }
            const st = state as PmState
            const decos: Decoration[] = []
            const re = /\{\{(\w+)\}\}/g
            st.doc.descendants((node: PmNode, pos: number) => {
              if (!node.isText || !node.text) return
              re.lastIndex = 0
              let m: RegExpExecArray | null
              while ((m = re.exec(node.text)) !== null) {
                decos.push(Decoration.inline(pos + m.index, pos + m.index + m[0].length, { class: 'var-token' }))
              }
            })
            return DecorationSet.create(st.doc as unknown as Parameters<typeof DecorationSet.create>[0], decos)
          },
        },
      }),
    ]
  },
})

const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()
const studio = useStudioStore()
const { setActiveEditor, clearActiveEditor } = useActiveEditor()

// Substituted content: {{variable}} → pageParams value
const resolvedContent = computed(() => {
  const raw = props.block.config.content || '<p></p>'
  return raw.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => studio.pageParams[key] ?? match)
})

const hasSubstitution = computed(() => resolvedContent.value !== (props.block.config.content || '<p></p>'))

// Track whether the editor is focused (for studio preview toggle)
const isEditorFocused = ref(false)
// Prevents onUpdate from saving during programmatic setContent calls
let suppressSave = false
let syncTimer: ReturnType<typeof setTimeout> | null = null

const editor = useEditor({
  // Public view: start with substituted content; studio: start with raw template
  content: props.readonly ? resolvedContent.value : (props.block.config.content || '<p></p>'),
  editable: !props.readonly,
  extensions: [
    StarterKit.configure({
      blockquote: false,
      codeBlock: false,
      code: false,
      horizontalRule: false,
    }),
    Underline,
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextTransformExtension,
    FontFamilyExtension,
    ...(props.readonly ? [] : [VariableHighlight]),
  ],
  editorProps: {
    attributes: {
      class: 'outline-none',
      style: 'overflow-wrap: anywhere; word-break: break-word; max-width: 100%;',
    },
    handleClick: props.readonly ? undefined : () => {
      studio.selectBlock(props.block.id)
      return false
    },
  },
  onFocus: ({ editor: e }: { editor: unknown }) => {
    if (!props.readonly) {
      setActiveEditor(e as Parameters<typeof setActiveEditor>[0])
      isEditorFocused.value = true
    }
  },
  onBlur: () => { isEditorFocused.value = false },
  onUpdate: ({ editor }: { editor: { getHTML: () => string } }) => {
    if (suppressSave) return
    if (syncTimer) clearTimeout(syncTimer)
    syncTimer = setTimeout(() => {
      studio.updateBlockConfig(props.block.id, { content: editor.getHTML() })
    }, 300)
  },
})

// Public view: update displayed content when pageParams change after mount
watch(resolvedContent, (c: string) => {
  if (!props.readonly || !editor.value || editor.value.isDestroyed) return
  suppressSave = true
  editor.value.commands.setContent(c)
  suppressSave = false
})

// Studio: when not editing, show substituted preview; when focused, show template with {{badge}}
watch([isEditorFocused, resolvedContent] as const, () => {
  if (props.readonly || !editor.value || editor.value.isDestroyed || !hasSubstitution.value) return
  suppressSave = true
  if (isEditorFocused.value) {
    editor.value.commands.setContent(props.block.config.content || '<p></p>')
  } else {
    editor.value.commands.setContent(resolvedContent.value)
  }
  suppressSave = false
})

// Apply heading level from sidebar
watch(() => props.block.config.headingLevel, (level: 1 | 2 | 3 | undefined) => {
  if (!level || !editor.value || props.block.type !== 'heading') return
  editor.value.chain().selectAll().setHeading({ level }).run()
})

// Apply text align from sidebar
watch(() => props.block.config.textAlign, (align: 'left' | 'center' | 'right' | 'justify' | undefined) => {
  if (!align || !editor.value) return
  editor.value.chain().selectAll().setTextAlign(align).run()
})

onBeforeUnmount(() => {
  if (syncTimer) clearTimeout(syncTimer)
  // Only flush if the block still exists (not being deleted) and editor is alive
  const stillExists = studio.blocks.some((b: StudioBlock) => b.id === props.block.id)
  if (stillExists && editor.value && !editor.value.isDestroyed) {
    studio.updateBlockConfig(props.block.id, { content: editor.value.getHTML() })
  }
  clearActiveEditor(editor.value ?? undefined)
})

// Container style: size, line-height + letter-spacing via CSS variables
// fontFamily is now handled per-selection via FontFamilyExtension (inline mark)
const containerStyle = computed(() => ({
  fontSize: props.block.config.fontSize
    ? (props.readonly
        ? `clamp(0.875rem, ${(props.block.config.fontSize / 1440) * 100}vw, ${props.block.config.fontSize}px)`
        : `${props.block.config.fontSize}px`)
    : undefined,
  '--block-lh': props.block.config.lineHeight ?? 1.7,
  '--block-ls': props.block.config.letterSpacing != null
    ? `${props.block.config.letterSpacing}em`
    : 'normal',
  backgroundColor: props.block.type === 'callout'
    ? (props.block.config.calloutColor || '#eff6ff')
    : undefined,
}))

const containerClass = computed(() => {
  if (props.block.type === 'quote') return 'border-l-4 border-[var(--color-primary)] pl-4 text-slate-600'
  if (props.block.type === 'callout') return 'rounded-lg'
  return ''
})

</script>

<template>
  <div
    class="w-full min-w-0 overflow-hidden px-3 py-2 cursor-text"
    :class="containerClass"
    :style="containerStyle"
  >
    <div style="overflow-wrap: anywhere; word-break: break-word; overflow: hidden; min-width: 0; max-width: 100%;">
      <EditorContent :editor="editor" />
    </div>
  </div>
</template>

<style scoped>
:deep(.tiptap) {
  outline: none;
  min-height: 1.5em;
  overflow-wrap: anywhere;
  word-break: break-word;
  min-width: 0;
  max-width: 100%;
}
:deep(.tiptap h1) { font-size: 2em; font-weight: 700; line-height: 1.2; color: #0f172a; overflow-wrap: anywhere; word-break: break-word; }
:deep(.tiptap h2) { font-size: 1.5em; font-weight: 700; line-height: 1.3; color: #0f172a; overflow-wrap: anywhere; word-break: break-word; }
:deep(.tiptap h3) { font-size: 1.25em; font-weight: 600; line-height: 1.4; color: #0f172a; overflow-wrap: anywhere; word-break: break-word; }
:deep(.tiptap p)  { line-height: var(--block-lh, 1.7); letter-spacing: var(--block-ls, normal); color: #374151; overflow-wrap: anywhere; }
:deep(.tiptap ul) { list-style-type: disc; padding-left: 1.5em; }
:deep(.tiptap ol) { list-style-type: decimal; padding-left: 1.5em; }
:deep(.tiptap li) { line-height: var(--block-lh, 1.7); letter-spacing: var(--block-ls, normal); overflow-wrap: anywhere; }

:deep(.tiptap p.is-empty:first-child::before) {
  content: 'Écrire ici…';
  color: #cbd5e1;
  float: left;
  height: 0;
  pointer-events: none;
}

:deep(.tiptap .var-token) {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
  border-radius: 4px;
  padding: 1px 5px;
  font-family: 'Courier New', monospace;
  font-size: 0.8em;
  font-weight: 700;
  letter-spacing: 0.01em;
}
</style>
