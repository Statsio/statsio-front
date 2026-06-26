<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3/menus'
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
const { setActiveEditor } = useActiveEditor()

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
      bulletList: false,
      orderedList: false,
    }),
    Underline,
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ...(props.readonly ? [] : [VariableHighlight]),
  ],
  editorProps: {
    attributes: { class: 'outline-none' },
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
})

// Container style: font family + size
const containerStyle = computed(() => ({
  fontFamily: props.block.config.fontFamily || undefined,
  fontSize: props.block.config.fontSize ? `${props.block.config.fontSize}px` : undefined,
  backgroundColor: props.block.type === 'callout'
    ? (props.block.config.calloutColor || '#eff6ff')
    : undefined,
}))

const containerClass = computed(() => {
  if (props.block.type === 'quote') return 'border-l-4 border-[var(--color-primary)] pl-4 text-slate-600'
  if (props.block.type === 'callout') return 'rounded-lg'
  return ''
})

// Bubble menu actions
const TEXT_COLORS = [
  { value: 'inherit', label: 'Auto' },
  { value: '#1e293b', label: 'Sombre' },
  { value: '#6b7280', label: 'Gris' },
  { value: '#ef4444', label: 'Rouge' },
  { value: '#f59e0b', label: 'Ambre' },
  { value: '#10b981', label: 'Vert' },
  { value: '#3b82f6', label: 'Bleu' },
  { value: '#8b5cf6', label: 'Violet' },
]

const HIGHLIGHT_COLORS = [
  { value: '', label: 'Aucun' },
  { value: '#fef9c3', label: 'Jaune' },
  { value: '#fce7f3', label: 'Rose' },
  { value: '#ede9fe', label: 'Violet' },
  { value: '#dbeafe', label: 'Bleu' },
  { value: '#dcfce7', label: 'Vert' },
  { value: '#fed7aa', label: 'Orange' },
]

function setColor(color: string) {
  if (color === 'inherit') {
    editor.value?.chain().focus().unsetColor().run()
  } else {
    editor.value?.chain().focus().setColor(color).run()
  }
}

function setHighlight(color: string) {
  if (!color) {
    editor.value?.chain().focus().unsetHighlight().run()
  } else {
    editor.value?.chain().focus().setHighlight({ color }).run()
  }
}
</script>

<template>
  <div
    class="w-full px-3 py-2 cursor-text"
    :class="containerClass"
    :style="containerStyle"
  >
    <!-- Bubble menu: appears on text selection -->
    <BubbleMenu
      v-if="editor"
      :editor="editor"
      :tippy-options="{ duration: 100, placement: 'top', offset: [0, 8] }"
    >
      <div class="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg shadow-xl p-1 text-xs">
        <!-- Bold -->
        <button
          class="w-7 h-7 rounded flex items-center justify-center font-bold transition-colors"
          :class="editor.isActive('bold') ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-100'"
          title="Gras"
          @mousedown.prevent="editor.chain().focus().toggleBold().run()"
        >B</button>

        <!-- Italic -->
        <button
          class="w-7 h-7 rounded flex items-center justify-center italic font-serif transition-colors"
          :class="editor.isActive('italic') ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-100'"
          title="Italique"
          @mousedown.prevent="editor.chain().focus().toggleItalic().run()"
        >I</button>

        <!-- Underline -->
        <button
          class="w-7 h-7 rounded flex items-center justify-center underline transition-colors"
          :class="editor.isActive('underline') ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-100'"
          title="Souligné"
          @mousedown.prevent="editor.chain().focus().toggleUnderline().run()"
        >U</button>

        <!-- Strikethrough -->
        <button
          class="w-7 h-7 rounded flex items-center justify-center line-through transition-colors"
          :class="editor.isActive('strike') ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-100'"
          title="Barré"
          @mousedown.prevent="editor.chain().focus().toggleStrike().run()"
        >S</button>

        <div class="w-px h-5 bg-slate-200 mx-0.5" />

        <!-- Text colors -->
        <div class="flex items-center gap-0.5" title="Couleur du texte">
          <button
            v-for="c in TEXT_COLORS"
            :key="c.value"
            class="w-4 h-4 rounded-full border border-slate-300 transition-transform hover:scale-110"
            :style="{ backgroundColor: c.value === 'inherit' ? 'white' : c.value }"
            :title="c.label"
            @mousedown.prevent="setColor(c.value)"
          >
            <span v-if="c.value === 'inherit'" class="text-[8px] font-bold text-slate-400 flex items-center justify-center leading-none">×</span>
          </button>
        </div>

        <div class="w-px h-5 bg-slate-200 mx-0.5" />

        <!-- Highlight colors -->
        <div class="flex items-center gap-0.5" title="Surlignage">
          <button
            v-for="c in HIGHLIGHT_COLORS"
            :key="c.value"
            class="w-4 h-4 rounded-full border border-slate-300 transition-transform hover:scale-110 relative"
            :style="{ backgroundColor: c.value || 'white' }"
            :title="c.label"
            @mousedown.prevent="setHighlight(c.value)"
          >
            <span v-if="!c.value" class="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-slate-400">×</span>
          </button>
        </div>
      </div>
    </BubbleMenu>

    <!-- Tiptap editor -->
    <EditorContent :editor="editor" />
  </div>
</template>

<style scoped>
:deep(.tiptap) {
  outline: none;
  min-height: 1.5em;

  h1 { font-size: 2em; font-weight: 700; line-height: 1.2; color: #0f172a; }
  h2 { font-size: 1.5em; font-weight: 700; line-height: 1.3; color: #0f172a; }
  h3 { font-size: 1.25em; font-weight: 600; line-height: 1.4; color: #0f172a; }
  p  { line-height: 1.7; color: #374151; }
}

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
