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
 * Lettrine sur le premier caractère du premier paragraphe.
 * Décoration de vue uniquement : le HTML enregistré ne change pas, et ça
 * s'affiche aussi dans un éditeur contenteditable (le Studio), là où
 * `::first-letter` est ignoré.
 */
export function dropCapExtension(enabled: () => boolean) {
  return Extension.create({
    name: 'dropCap',
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey('dropCap'),
          props: {
            decorations(state: unknown) {
              if (!enabled()) return null
              type PmNode = {
                isText: boolean
                isBlock: boolean
                type: { name: string }
                text?: string
              }
              type PmDoc = PmNode & {
                descendants: (fn: (node: PmNode, pos: number) => boolean | void) => void
              }
              const doc = (state as { doc: PmDoc }).doc
              let from = -1
              let to = -1
              let passedFirstBlock = false
              doc.descendants((node, pos) => {
                if (from >= 0) return false
                if (node.isBlock && node.type.name !== 'doc') {
                  if (passedFirstBlock) return false
                  passedFirstBlock = true
                }
                if (!node.isText || !node.text) return
                let i = 0
                while (i < node.text.length && /\s/.test(node.text[i]!)) i++
                if (i >= node.text.length) return
                from = pos + i
                to = pos + i + 1
                return false
              })
              if (from < 0) return null
              return DecorationSet.create(doc as unknown as Parameters<typeof DecorationSet.create>[0], [
                Decoration.inline(from, to, { class: 'drop-cap' }),
              ])
            },
          },
        }),
      ]
    },
  })
}

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
