import { describe, expect, it } from 'vitest'
import { FontFamilyExtension, TextTransformExtension } from './tiptap-extensions'

interface StyleAttribute {
  default: string | null
  parseHTML: (el: HTMLElement) => string | null
  renderHTML: (attrs: Record<string, unknown>) => Record<string, string>
}

const attributeOf = (extension: typeof TextTransformExtension, attrName: string): StyleAttribute => {
  const [config] = extension.config.addGlobalAttributes!.call(extension as never)
  return config!.attributes[attrName] as StyleAttribute
}

describe('TextTransformExtension', () => {
  it('applies to textStyle by default', () => {
    expect(TextTransformExtension.options.types).toEqual(['textStyle'])
  })

  it('parses the CSS text-transform from an element style', () => {
    const attr = attributeOf(TextTransformExtension, 'textTransform')
    const el = document.createElement('span')
    el.style.textTransform = 'uppercase'

    expect(attr.parseHTML(el)).toBe('uppercase')
    expect(attr.default).toBeNull()
  })

  it('returns null when the element has no text-transform', () => {
    const attr = attributeOf(TextTransformExtension, 'textTransform')
    expect(attr.parseHTML(document.createElement('span'))).toBeNull()
  })

  it('renders a style attribute only when a value is set', () => {
    const attr = attributeOf(TextTransformExtension, 'textTransform')

    expect(attr.renderHTML({ textTransform: 'lowercase' })).toEqual({ style: 'text-transform: lowercase' })
    expect(attr.renderHTML({ textTransform: null })).toEqual({})
  })
})

describe('FontFamilyExtension', () => {
  it('parses the CSS font-family from an element style', () => {
    const attr = attributeOf(FontFamilyExtension, 'fontFamily')
    const el = document.createElement('span')
    el.style.fontFamily = 'Manrope'

    expect(attr.parseHTML(el)).toBe('Manrope')
  })

  it('renders a style attribute only when a value is set', () => {
    const attr = attributeOf(FontFamilyExtension, 'fontFamily')

    expect(attr.renderHTML({ fontFamily: 'JetBrains Mono' })).toEqual({ style: 'font-family: JetBrains Mono' })
    expect(attr.renderHTML({ fontFamily: null })).toEqual({})
  })
})
