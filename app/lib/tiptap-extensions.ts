import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

// Adds CSS text-transform (uppercase/lowercase) as an inline TextStyle attribute
export const TextTransformExtension = Extension.create({
  name: 'textTransformStyle',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        textTransform: {
          default: null,
          parseHTML: (el: HTMLElement) => el.style.textTransform || null,
          renderHTML: (attrs: Record<string, unknown>) =>
            attrs.textTransform ? { style: `text-transform: ${attrs.textTransform}` } : {},
        },
      },
    }]
  },
})

// Adds font-family as an inline TextStyle attribute (applies only to the current selection)
export const FontFamilyExtension = Extension.create({
  name: 'fontFamilyStyle',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontFamily: {
          default: null,
          parseHTML: (el: HTMLElement) => el.style.fontFamily || null,
          renderHTML: (attrs: Record<string, unknown>) =>
            attrs.fontFamily ? { style: `font-family: ${attrs.fontFamily}` } : {},
        },
      },
    }]
  },
})

/**
 * Décoration ProseMirror : surligne visuellement les jetons `{{variable}}` sans
 * toucher au modèle du document. Éditeur uniquement (pas en lecture seule).
 */
export const VariableHighlight = Extension.create({
  name: 'variableHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('variableHighlight'),
        props: {
          decorations(state: unknown) {
            type PmNode = { isText: boolean; text?: string }
            type PmDoc = { descendants: (fn: (node: PmNode, pos: number) => void) => void }
            type PmState = { doc: PmDoc }
            const st = state as PmState
            const decos: Decoration[] = []
            const re = /\{\{.+?\}\}/g
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
