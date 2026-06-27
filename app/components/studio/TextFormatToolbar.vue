<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useActiveEditor } from '@/composables/useActiveEditor'
import { useStudioStore } from '@/stores/studio'
import { TEXT_BLOCK_TYPES } from '@/types/studio'

const { activeEditor, editorVersion } = useActiveEditor()
const studio = useStudioStore()
const toolbarRef = ref<HTMLElement | null>(null)

const selectedBlock = computed(() =>
  studio.blocks.find(b => b.id === studio.selectedBlockId),
)

// Only show when a text block is selected and has an active editor
const show = computed(() =>
  !!selectedBlock.value &&
  TEXT_BLOCK_TYPES.includes(selectedBlock.value.type) &&
  activeEditor.value !== null,
)

// ── Popover management ────────────────────────────────────────────────────────

type Popover = 'color' | 'highlight' | 'spacing' | 'align' | 'list' | null
const openPopover = ref<Popover>(null)

function togglePopover(name: Exclude<Popover, null>) {
  openPopover.value = openPopover.value === name ? null : name
}

function handleOutsideMousedown(e: MouseEvent) {
  if (toolbarRef.value && !toolbarRef.value.contains(e.target as Node)) {
    openPopover.value = null
  }
}

onMounted(() => document.addEventListener('mousedown', handleOutsideMousedown))
onUnmounted(() => document.removeEventListener('mousedown', handleOutsideMousedown))

// ── Font family (inline mark — applies only to current selection) ─────────────

const FONT_OPTIONS = [
  { label: 'Défaut', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, sans-serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Impact', value: 'Impact, sans-serif' },
  { label: 'Palatino', value: '"Palatino Linotype", serif' },
]

// Read the font at the current cursor/selection from the editor marks
const currentFontFamily = computed(() => {
  editorVersion.value
  return activeEditor.value?.getAttributes('textStyle').fontFamily ?? ''
})

function setFontFamily(value: string) {
  const editor = activeEditor.value
  if (!editor) return
  if (value) {
    editor.chain().focus().setMark('textStyle', { fontFamily: value }).run()
  } else {
    editor.chain().focus().setMark('textStyle', { fontFamily: null }).removeEmptyTextStyle().run()
  }
}

// ── Font size (block-level) ───────────────────────────────────────────────────

const currentFontSize = computed(() => selectedBlock.value?.config.fontSize ?? 16)

function adjustFontSize(delta: number) {
  if (!selectedBlock.value) return
  const next = Math.max(8, Math.min(200, currentFontSize.value + delta))
  studio.updateBlockConfig(selectedBlock.value.id, { fontSize: next })
}

function onFontSizeInput(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value)
  if (!isNaN(val) && val >= 8 && val <= 200 && selectedBlock.value) {
    studio.updateBlockConfig(selectedBlock.value.id, { fontSize: val })
  }
}

// ── Inline marks (track editorVersion to stay reactive to editor state) ───────

const isBold      = computed(() => { editorVersion.value; return activeEditor.value?.isActive('bold')      ?? false })
const isItalic    = computed(() => { editorVersion.value; return activeEditor.value?.isActive('italic')    ?? false })
const isUnderline = computed(() => { editorVersion.value; return activeEditor.value?.isActive('underline') ?? false })
const isStrike    = computed(() => { editorVersion.value; return activeEditor.value?.isActive('strike')    ?? false })
const isUppercase = computed(() => { editorVersion.value; return activeEditor.value?.getAttributes('textStyle').textTransform === 'uppercase' })
const isBulletList   = computed(() => { editorVersion.value; return activeEditor.value?.isActive('bulletList')   ?? false })
const isOrderedList  = computed(() => { editorVersion.value; return activeEditor.value?.isActive('orderedList')  ?? false })
const currentAlign   = computed(() => { editorVersion.value; return selectedBlock.value?.config.textAlign ?? 'left' })

function toggleBold()      { activeEditor.value?.chain().focus().toggleBold().run() }
function toggleItalic()    { activeEditor.value?.chain().focus().toggleItalic().run() }
function toggleUnderline() { activeEditor.value?.chain().focus().toggleUnderline().run() }
function toggleStrike()    { activeEditor.value?.chain().focus().toggleStrike().run() }

function toggleUppercase() {
  const editor = activeEditor.value
  if (!editor) return
  const current = editor.getAttributes('textStyle').textTransform
  editor.chain().focus().setMark('textStyle', { textTransform: current === 'uppercase' ? null : 'uppercase' }).run()
}

function setAlign(align: 'left' | 'center' | 'right' | 'justify') {
  if (!selectedBlock.value) return
  activeEditor.value?.chain().focus().setTextAlign(align).run()
  studio.updateBlockConfig(selectedBlock.value.id, { textAlign: align })
}

function toggleBulletList()  { activeEditor.value?.chain().focus().toggleBulletList().run() }
function toggleOrderedList() { activeEditor.value?.chain().focus().toggleOrderedList().run() }

// ── Text color ────────────────────────────────────────────────────────────────

const TEXT_COLORS = [
  '#000000', '#374151', '#6b7280', '#9ca3af',
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ec4899', '#ffffff', '#1e293b',
]

const currentColor = computed(() => {
  editorVersion.value
  return activeEditor.value?.getAttributes('textStyle').color ?? ''
})

function setColor(color: string) {
  if (!color) activeEditor.value?.chain().focus().unsetColor().run()
  else activeEditor.value?.chain().focus().setColor(color).run()
  openPopover.value = null
}

// ── Highlight ─────────────────────────────────────────────────────────────────

const HIGHLIGHT_COLORS = [
  '#fef9c3', '#fce7f3', '#ede9fe', '#dbeafe',
  '#dcfce7', '#fed7aa', '#fecaca', '#e0f2fe',
]

const currentHighlight = computed(() => {
  editorVersion.value
  return activeEditor.value?.getAttributes('highlight').color ?? ''
})

function setHighlight(color: string) {
  if (!color) activeEditor.value?.chain().focus().unsetHighlight().run()
  else activeEditor.value?.chain().focus().setHighlight({ color }).run()
  openPopover.value = null
}

// ── Spacing (block-level) ─────────────────────────────────────────────────────

const currentLetterSpacing = computed(() => selectedBlock.value?.config.letterSpacing ?? 0)
const currentLineHeight    = computed(() => selectedBlock.value?.config.lineHeight    ?? 1.7)

function adjustLetterSpacing(delta: number) {
  if (!selectedBlock.value) return
  const next = Math.round((currentLetterSpacing.value + delta) * 100) / 100
  studio.updateBlockConfig(selectedBlock.value.id, { letterSpacing: next })
}

function onLetterSpacingInput(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value)
  if (!isNaN(val) && selectedBlock.value) {
    studio.updateBlockConfig(selectedBlock.value.id, { letterSpacing: val })
  }
}

function adjustLineHeight(delta: number) {
  if (!selectedBlock.value) return
  const next = Math.max(0.5, Math.round((currentLineHeight.value + delta) * 10) / 10)
  studio.updateBlockConfig(selectedBlock.value.id, { lineHeight: next })
}

function onLineHeightInput(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value)
  if (!isNaN(val) && val > 0 && selectedBlock.value) {
    studio.updateBlockConfig(selectedBlock.value.id, { lineHeight: val })
  }
}

// ── Copy format ───────────────────────────────────────────────────────────────

interface CapturedFormat {
  bold: boolean; italic: boolean; underline: boolean; strike: boolean
  color?: string; highlight?: string; textTransform?: string
  fontFamily?: string; fontSize?: number
}

const copiedFormat = ref<CapturedFormat | null>(null)
const isCopyMode   = ref(false)

function handleCopyFormat() {
  if (isCopyMode.value && copiedFormat.value) {
    // Apply the captured format to current selection
    const editor = activeEditor.value
    const f = copiedFormat.value
    if (editor) {
      const c = editor.chain().focus()
      if (f.bold)      c.setBold();      else c.unsetBold()
      if (f.italic)    c.setItalic();    else c.unsetItalic()
      if (f.underline) c.setUnderline(); else c.unsetUnderline()
      if (f.strike)    c.setStrike();    else c.unsetStrike()
      if (f.color)     c.setColor(f.color); else c.unsetColor()
      if (f.highlight) c.setHighlight({ color: f.highlight }); else c.unsetHighlight()
      c.setMark('textStyle', {
        textTransform: f.textTransform ?? null,
        fontFamily:    f.fontFamily    ?? null,
      }).run()
    }
    if (selectedBlock.value && f.fontSize !== undefined) {
      studio.updateBlockConfig(selectedBlock.value.id, { fontSize: f.fontSize })
    }
    isCopyMode.value   = false
    copiedFormat.value = null
    return
  }

  // Capture current format
  const editor = activeEditor.value
  if (!editor) return
  copiedFormat.value = {
    bold:          editor.isActive('bold'),
    italic:        editor.isActive('italic'),
    underline:     editor.isActive('underline'),
    strike:        editor.isActive('strike'),
    color:         editor.getAttributes('textStyle').color,
    highlight:     editor.getAttributes('highlight').color,
    textTransform: editor.getAttributes('textStyle').textTransform,
    fontFamily:    editor.getAttributes('textStyle').fontFamily,
    fontSize:      selectedBlock.value?.config.fontSize,
  }
  isCopyMode.value = true
}
</script>

<template>
  <div
    v-if="show"
    ref="toolbarRef"
    class="inline-flex items-center h-10 px-3 bg-white/95 backdrop-blur-sm border border-[var(--color-secondary)] shadow-lg shadow-[var(--color-primary)]/10 rounded-2xl gap-0.5 flex-shrink-0 select-none"
  >
    <!-- Font family -->
    <AppSelect
      :model-value="currentFontFamily"
      :options="FONT_OPTIONS"
      size="sm"
      teleport
      button-class="!h-7 !rounded-lg !border-[var(--color-secondary)] !w-32 !min-h-0 !text-xs !text-slate-700"
      @update:model-value="setFontFamily($event as string)"
    />

    <div class="w-px h-5 bg-[var(--color-secondary)] mx-1.5 flex-shrink-0" />

    <!-- Font size -->
    <button
      class="w-6 h-7 flex items-center justify-center text-slate-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/8 rounded-lg text-sm font-medium flex-shrink-0 transition-colors"
      @mousedown.prevent="adjustFontSize(-1)"
    >−</button>
    <input
      type="number"
      :value="currentFontSize"
      min="8"
      max="200"
      class="w-10 h-7 text-center text-xs border border-[var(--color-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 [appearance:textfield] flex-shrink-0 text-slate-700"
      @change="onFontSizeInput"
    />
    <button
      class="w-6 h-7 flex items-center justify-center text-slate-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/8 rounded-lg text-sm font-medium flex-shrink-0 transition-colors"
      @mousedown.prevent="adjustFontSize(1)"
    >+</button>

    <div class="w-px h-5 bg-[var(--color-secondary)] mx-1.5 flex-shrink-0" />

    <!-- Text color -->
    <div class="relative flex-shrink-0">
      <button
        class="w-7 h-7 flex flex-col items-center justify-center rounded-lg transition-colors"
        :class="openPopover === 'color' ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'hover:bg-[var(--color-primary)]/8'"
        title="Couleur du texte"
        @mousedown.prevent="togglePopover('color')"
      >
        <span class="text-xs font-bold text-slate-700 leading-none">A</span>
        <span class="w-4 h-1 rounded-full mt-0.5" :style="{ backgroundColor: currentColor || '#374151' }" />
      </button>
      <div
        v-if="openPopover === 'color'"
        class="absolute top-full left-0 mt-1.5 z-50 bg-white border border-[var(--color-secondary)] rounded-xl shadow-2xl shadow-[var(--color-primary)]/10 p-2.5"
        style="min-width: 128px"
      >
        <div class="grid grid-cols-4 gap-1.5 mb-2">
          <button
            v-for="c in TEXT_COLORS"
            :key="c"
            class="w-6 h-6 rounded-lg border-2 hover:scale-110 transition-transform"
            :style="{ backgroundColor: c }"
            :class="currentColor === c ? 'border-[var(--color-primary)] scale-110' : 'border-transparent'"
            @mousedown.prevent="setColor(c)"
          />
        </div>
        <button
          class="w-full text-[11px] text-slate-400 hover:text-[var(--color-primary)] transition-colors mt-0.5"
          @mousedown.prevent="setColor('')"
        >↺ Réinitialiser</button>
      </div>
    </div>

    <!-- Highlight -->
    <div class="relative flex-shrink-0">
      <button
        class="w-7 h-7 flex flex-col items-center justify-center rounded-lg transition-colors"
        :class="openPopover === 'highlight' ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'hover:bg-[var(--color-primary)]/8'"
        title="Surlignage"
        @mousedown.prevent="togglePopover('highlight')"
      >
        <span class="text-xs font-bold leading-none" :style="{ backgroundColor: currentHighlight || 'transparent', padding: '0 2px', borderRadius: '4px' }">A</span>
        <span class="w-4 h-1 rounded-full mt-0.5" :style="{ backgroundColor: currentHighlight || '#fef9c3' }" />
      </button>
      <div
        v-if="openPopover === 'highlight'"
        class="absolute top-full left-0 mt-1.5 z-50 bg-white border border-[var(--color-secondary)] rounded-xl shadow-2xl shadow-[var(--color-primary)]/10 p-2.5"
        style="min-width: 112px"
      >
        <div class="grid grid-cols-4 gap-1.5 mb-2">
          <button
            v-for="c in HIGHLIGHT_COLORS"
            :key="c"
            class="w-6 h-6 rounded-lg border-2 hover:scale-110 transition-transform"
            :style="{ backgroundColor: c }"
            :class="currentHighlight === c ? 'border-[var(--color-primary)] scale-110' : 'border-transparent'"
            @mousedown.prevent="setHighlight(c)"
          />
        </div>
        <button
          class="w-full text-[11px] text-slate-400 hover:text-[var(--color-primary)] transition-colors mt-0.5"
          @mousedown.prevent="setHighlight('')"
        >↺ Supprimer</button>
      </div>
    </div>

    <div class="w-px h-5 bg-[var(--color-secondary)] mx-1.5 flex-shrink-0" />

    <!-- Bold -->
    <button
      class="w-7 h-7 flex items-center justify-center rounded-lg font-bold text-sm transition-colors flex-shrink-0"
      :class="isBold ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' : 'text-slate-500 hover:bg-[var(--color-primary)]/8 hover:text-[var(--color-primary)]'"
      title="Gras (Ctrl+B)"
      @mousedown.prevent="toggleBold"
    >B</button>

    <!-- Italic -->
    <button
      class="w-7 h-7 flex items-center justify-center rounded-lg italic font-serif text-sm transition-colors flex-shrink-0"
      :class="isItalic ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' : 'text-slate-500 hover:bg-[var(--color-primary)]/8 hover:text-[var(--color-primary)]'"
      title="Italique (Ctrl+I)"
      @mousedown.prevent="toggleItalic"
    >I</button>

    <!-- Underline -->
    <button
      class="w-7 h-7 flex items-center justify-center rounded-lg underline text-sm transition-colors flex-shrink-0"
      :class="isUnderline ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' : 'text-slate-500 hover:bg-[var(--color-primary)]/8 hover:text-[var(--color-primary)]'"
      title="Souligné (Ctrl+U)"
      @mousedown.prevent="toggleUnderline"
    >U</button>

    <!-- Strikethrough -->
    <button
      class="w-7 h-7 flex items-center justify-center rounded-lg line-through text-sm transition-colors flex-shrink-0"
      :class="isStrike ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' : 'text-slate-500 hover:bg-[var(--color-primary)]/8 hover:text-[var(--color-primary)]'"
      title="Barré"
      @mousedown.prevent="toggleStrike"
    >S</button>

    <div class="w-px h-5 bg-[var(--color-secondary)] mx-1.5 flex-shrink-0" />

    <!-- Text transform (uppercase) -->
    <button
      class="h-7 px-2 flex items-center justify-center rounded-lg text-xs font-medium transition-colors flex-shrink-0"
      :class="isUppercase ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' : 'text-slate-500 hover:bg-[var(--color-primary)]/8 hover:text-[var(--color-primary)]'"
      title="Majuscules"
      @mousedown.prevent="toggleUppercase"
    >aA</button>

    <div class="w-px h-5 bg-[var(--color-secondary)] mx-1.5 flex-shrink-0" />

    <!-- Alignment dropdown -->
    <div class="relative flex-shrink-0">
      <button
        class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
        :class="openPopover === 'align' ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-slate-500 hover:bg-[var(--color-primary)]/8 hover:text-[var(--color-primary)]'"
        title="Alignement"
        @mousedown.prevent="togglePopover('align')"
      >
        <!-- Shows current alignment icon -->
        <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <template v-if="currentAlign === 'center'">
            <line x1="2" y1="4" x2="14" y2="4"/><line x1="4" y1="7" x2="12" y2="7"/>
            <line x1="2" y1="10" x2="14" y2="10"/><line x1="5" y1="13" x2="11" y2="13"/>
          </template>
          <template v-else-if="currentAlign === 'right'">
            <line x1="2" y1="4" x2="14" y2="4"/><line x1="6" y1="7" x2="14" y2="7"/>
            <line x1="2" y1="10" x2="14" y2="10"/><line x1="7" y1="13" x2="14" y2="13"/>
          </template>
          <template v-else-if="currentAlign === 'justify'">
            <line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="7" x2="14" y2="7"/>
            <line x1="2" y1="10" x2="14" y2="10"/><line x1="2" y1="13" x2="14" y2="13"/>
          </template>
          <template v-else>
            <line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="7" x2="10" y2="7"/>
            <line x1="2" y1="10" x2="14" y2="10"/><line x1="2" y1="13" x2="9" y2="13"/>
          </template>
        </svg>
      </button>
      <div
        v-if="openPopover === 'align'"
        class="absolute top-full left-0 mt-1.5 z-50 bg-white border border-[var(--color-secondary)] rounded-xl shadow-2xl shadow-[var(--color-primary)]/10 p-1 flex flex-col gap-0.5"
      >
        <button
          v-for="a in [
            { v: 'left',    label: 'Gauche',   d1: [2,4,14,4], d2: [2,7,10,7], d3: [2,10,14,10], d4: [2,13,9,13] },
            { v: 'center',  label: 'Centre',   d1: [2,4,14,4], d2: [4,7,12,7], d3: [2,10,14,10], d4: [5,13,11,13] },
            { v: 'right',   label: 'Droite',   d1: [2,4,14,4], d2: [6,7,14,7], d3: [2,10,14,10], d4: [7,13,14,13] },
            { v: 'justify', label: 'Justifié', d1: [2,4,14,4], d2: [2,7,14,7], d3: [2,10,14,10], d4: [2,13,14,13] },
          ]"
          :key="a.v"
          class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors w-full text-left"
          :class="currentAlign === a.v ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold' : 'text-slate-600 hover:bg-slate-50'"
          @mousedown.prevent="setAlign(a.v as 'left'|'center'|'right'|'justify'); openPopover = null"
        >
          <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <line :x1="a.d1[0]" :y1="a.d1[1]" :x2="a.d1[2]" :y2="a.d1[3]"/>
            <line :x1="a.d2[0]" :y1="a.d2[1]" :x2="a.d2[2]" :y2="a.d2[3]"/>
            <line :x1="a.d3[0]" :y1="a.d3[1]" :x2="a.d3[2]" :y2="a.d3[3]"/>
            <line :x1="a.d4[0]" :y1="a.d4[1]" :x2="a.d4[2]" :y2="a.d4[3]"/>
          </svg>
          {{ a.label }}
        </button>
      </div>
    </div>

    <div class="w-px h-5 bg-[var(--color-secondary)] mx-1.5 flex-shrink-0" />

    <!-- List dropdown -->
    <div class="relative flex-shrink-0">
      <button
        class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
        :class="(isBulletList || isOrderedList || openPopover === 'list') ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-slate-500 hover:bg-[var(--color-primary)]/8 hover:text-[var(--color-primary)]'"
        title="Listes"
        @mousedown.prevent="togglePopover('list')"
      >
        <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="3.5" cy="4.5" r="1" fill="currentColor" stroke="none"/>
          <circle cx="3.5" cy="8" r="1" fill="currentColor" stroke="none"/>
          <circle cx="3.5" cy="11.5" r="1" fill="currentColor" stroke="none"/>
          <line x1="6" y1="4.5" x2="13" y2="4.5"/>
          <line x1="6" y1="8" x2="13" y2="8"/>
          <line x1="6" y1="11.5" x2="13" y2="11.5"/>
        </svg>
      </button>
      <div
        v-if="openPopover === 'list'"
        class="absolute top-full left-0 mt-1.5 z-50 bg-white border border-[var(--color-secondary)] rounded-xl shadow-2xl shadow-[var(--color-primary)]/10 p-1 flex flex-col gap-0.5"
      >
        <button
          class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors w-full text-left"
          :class="isBulletList ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold' : 'text-slate-600 hover:bg-slate-50'"
          @mousedown.prevent="toggleBulletList(); openPopover = null"
        >
          <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="3.5" cy="4.5" r="1" fill="currentColor" stroke="none"/>
            <circle cx="3.5" cy="8" r="1" fill="currentColor" stroke="none"/>
            <circle cx="3.5" cy="11.5" r="1" fill="currentColor" stroke="none"/>
            <line x1="6" y1="4.5" x2="13" y2="4.5"/>
            <line x1="6" y1="8" x2="13" y2="8"/>
            <line x1="6" y1="11.5" x2="13" y2="11.5"/>
          </svg>
          Liste à puces
        </button>
        <button
          class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors w-full text-left"
          :class="isOrderedList ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold' : 'text-slate-600 hover:bg-slate-50'"
          @mousedown.prevent="toggleOrderedList(); openPopover = null"
        >
          <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <text x="1.5" y="6" font-size="4.5" fill="currentColor" stroke="none" font-family="monospace">1.</text>
            <text x="1.5" y="9.5" font-size="4.5" fill="currentColor" stroke="none" font-family="monospace">2.</text>
            <text x="1.5" y="13" font-size="4.5" fill="currentColor" stroke="none" font-family="monospace">3.</text>
            <line x1="7" y1="4.5" x2="13" y2="4.5"/>
            <line x1="7" y1="8" x2="13" y2="8"/>
            <line x1="7" y1="11.5" x2="13" y2="11.5"/>
          </svg>
          Liste numérotée
        </button>
      </div>
    </div>

    <div class="w-px h-5 bg-[var(--color-secondary)] mx-1.5 flex-shrink-0" />

    <!-- Spacing popup -->
    <div class="relative flex-shrink-0">
      <button
        class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
        :class="openPopover === 'spacing' ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-slate-500 hover:bg-[var(--color-primary)]/8 hover:text-[var(--color-primary)]'"
        title="Espacement"
        @mousedown.prevent="togglePopover('spacing')"
      >
        <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="8" y1="2" x2="8" y2="14"/>
          <polyline points="5,5 8,2 11,5"/>
          <polyline points="5,11 8,14 11,11"/>
          <line x1="2" y1="7" x2="14" y2="7"/>
          <line x1="2" y1="9" x2="14" y2="9"/>
        </svg>
      </button>
      <div
        v-if="openPopover === 'spacing'"
        class="absolute top-full right-0 mt-1.5 z-50 bg-white border border-[var(--color-secondary)] rounded-xl shadow-2xl shadow-[var(--color-primary)]/10 p-3"
        style="min-width: 200px"
      >
        <!-- Letter spacing -->
        <div class="mb-3">
          <label class="block text-xs font-medium text-slate-600 mb-1.5">Espacement des lettres (em)</label>
          <div class="flex items-center gap-1.5">
            <button
              class="w-6 h-6 flex items-center justify-center rounded-lg border border-[var(--color-secondary)] text-slate-500 hover:bg-[var(--color-primary)]/8 hover:text-[var(--color-primary)] text-sm flex-shrink-0 transition-colors"
              @mousedown.prevent="adjustLetterSpacing(-0.01)"
            >−</button>
            <input
              type="number"
              :value="currentLetterSpacing.toFixed(2)"
              step="0.01"
              min="-0.1"
              max="1"
              class="flex-1 h-6 text-center text-xs border border-[var(--color-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 [appearance:textfield]"
              @change="onLetterSpacingInput"
            />
            <button
              class="w-6 h-6 flex items-center justify-center rounded-lg border border-[var(--color-secondary)] text-slate-500 hover:bg-[var(--color-primary)]/8 hover:text-[var(--color-primary)] text-sm flex-shrink-0 transition-colors"
              @mousedown.prevent="adjustLetterSpacing(0.01)"
            >+</button>
          </div>
        </div>

        <!-- Line height -->
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">Interligne</label>
          <div class="flex items-center gap-1.5">
            <button
              class="w-6 h-6 flex items-center justify-center rounded-lg border border-[var(--color-secondary)] text-slate-500 hover:bg-[var(--color-primary)]/8 hover:text-[var(--color-primary)] text-sm flex-shrink-0 transition-colors"
              @mousedown.prevent="adjustLineHeight(-0.1)"
            >−</button>
            <input
              type="number"
              :value="currentLineHeight.toFixed(1)"
              step="0.1"
              min="0.5"
              max="5"
              class="flex-1 h-6 text-center text-xs border border-[var(--color-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 [appearance:textfield]"
              @change="onLineHeightInput"
            />
            <button
              class="w-6 h-6 flex items-center justify-center rounded-lg border border-[var(--color-secondary)] text-slate-500 hover:bg-[var(--color-primary)]/8 hover:text-[var(--color-primary)] text-sm flex-shrink-0 transition-colors"
              @mousedown.prevent="adjustLineHeight(0.1)"
            >+</button>
          </div>
        </div>
      </div>
    </div>

    <div class="w-px h-5 bg-[var(--color-secondary)] mx-1.5 flex-shrink-0" />

    <!-- Copy format -->
    <button
      class="h-7 px-2 flex items-center gap-1 rounded-lg text-xs transition-colors flex-shrink-0"
      :class="isCopyMode ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30' : 'text-slate-500 hover:bg-[var(--color-primary)]/8 hover:text-[var(--color-primary)]'"
      :title="isCopyMode ? 'Coller la mise en forme (cliquez à nouveau)' : 'Copier la mise en forme'"
      @mousedown.prevent="handleCopyFormat"
    >
      <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M3 13 L11 5 L13 3 L13 5 L11 5"/>
        <path d="M11 5 L13 3"/>
        <path d="M3 13 L5 15 L7 13" stroke-linejoin="round"/>
        <line x1="4" y1="12" x2="6" y2="14"/>
      </svg>
      <span>{{ isCopyMode ? 'Coller' : 'Copier' }}</span>
    </button>
  </div>
</template>
