/**
 * Rendu sûr du texte enrichi « inline » des en-têtes de section (sur-titre,
 * titre, description). Le contenu est produit par un éditeur Tiptap restreint
 * (gras / italique / souligné / barré / surlignage / majuscules / interlettrage
 * + jetons `{{…}}`) : pas de listes, pas de couleur de texte, pas de scripts.
 *
 * Ces helpers fonctionnent sans DOM (SSR) — parsing par expressions régulières
 * sur une sortie dont on maîtrise la forme, avec liste blanche stricte en
 * défense en profondeur.
 */

const ALLOWED_TAGS = new Set(['strong', 'b', 'em', 'i', 'u', 's', 'strike', 'mark', 'span', 'br'])
const ALLOWED_STYLE_PROPS = /^(text-transform|letter-spacing|background-color)$/i

const TAG_RE = /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:[^<>"']|"[^"]*"|'[^']*')*)>/g

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Échappe un segment de texte (hors balises) sans casser les entités déjà
 * présentes dans la sortie d'un éditeur Tiptap (`&amp;`, `&#39;`…).
 */
function escapeTextSegment(value: string): string {
  return value
    .replace(/&(?!#\d+;|#x[0-9a-fA-F]+;|[a-zA-Z][a-zA-Z0-9]*;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function safeStyle(attrs: string): string {
  const m = /style\s*=\s*("([^"]*)"|'([^']*)')/i.exec(attrs)
  if (!m) return ''
  const kept: string[] = []
  for (const decl of (m[2] ?? m[3] ?? '').split(';')) {
    const idx = decl.indexOf(':')
    if (idx === -1) continue
    const prop = decl.slice(0, idx).trim().toLowerCase()
    const val = decl.slice(idx + 1).trim()
    if (!ALLOWED_STYLE_PROPS.test(prop)) continue
    if (/[<>"']/.test(val) || /url\s*\(/i.test(val) || /expression/i.test(val)) continue
    kept.push(`${prop}: ${val}`)
  }
  return kept.join('; ')
}

/**
 * Nettoie une chaîne de texte enrichi inline pour un `v-html` : ne garde que les
 * balises de mise en forme autorisées, sans attributs hormis un `style` filtré.
 * Une valeur héritée en texte brut (aucune balise) est simplement échappée.
 */
export function sanitizeInlineHtml(input: string | null | undefined): string {
  const raw = input ?? ''
  if (!raw) return ''
  if (!/[<>]/.test(raw)) return escapeText(raw)

  let out = ''
  let last = 0
  let m: RegExpExecArray | null
  TAG_RE.lastIndex = 0
  while ((m = TAG_RE.exec(raw)) !== null) {
    out += escapeTextSegment(raw.slice(last, m.index))
    last = TAG_RE.lastIndex
    const name = m[1]!.toLowerCase()
    const isClosing = m[0]!.startsWith('</')
    if (name === 'br') { out += '<br>'; continue }
    if (!ALLOWED_TAGS.has(name)) continue
    if (isClosing) { out += `</${name}>`; continue }
    const style = safeStyle(m[2] ?? '')
    out += style ? `<${name} style="${style}">` : `<${name}>`
  }
  out += escapeTextSegment(raw.slice(last))
  return out
}

/** Retire toute balise / entité — pour les ancres, le sommaire, les tests « a un en-tête ». */
export function stripInlineHtml(input: string | null | undefined): string {
  const raw = input ?? ''
  if (!/[<&]/.test(raw)) return raw.trim()
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim()
}

/** Vrai si la valeur ne contient aucun texte visible (`<p></p>`, `<br>`, espaces…). */
export function isBlankInlineHtml(input: string | null | undefined): boolean {
  return stripInlineHtml(input).replace(/\s+/g, '') === ''
}
