import { Extension } from '@tiptap/core'

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
