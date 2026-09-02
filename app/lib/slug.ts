import { stripInlineHtml } from '@/lib/inline-rich-text'

/**
 * Transforme une valeur en segment d'URL sûr : minuscules, sans accents, mots
 * séparés par des tirets. Utilisé pour les slugs de page et pour les URL
 * générées par valeur (fan-out — plan Statsdata v2).
 */
export function slugify(value: string): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Ancre `#id` d'une section au rendu public : générée automatiquement à partir
 * de son titre (slug), stable vis-à-vis des paramètres de page (on slugifie le
 * titre brut, jetons `{{…}}` compris). `undefined` si la section n'a pas de
 * titre → elle n'apparaît pas dans le sommaire.
 */
export function sectionAnchorId(section: { title?: string | null }): string | undefined {
  const plain = stripInlineHtml(section.title)
  return plain ? slugify(plain) || undefined : undefined
}
