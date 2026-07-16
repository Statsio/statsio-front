const REGIONAL_INDICATOR_OFFSET = 127397

/** Emoji drapeau à partir d'un code ISO 3166-1 alpha-2 (ex. "FR" → 🇫🇷), sans image ni CDN :
 * chaque lettre est mappée sur son indicateur régional Unicode (A → 🇦, ... Z → 🇿). */
export function isoToFlagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + REGIONAL_INDICATOR_OFFSET))
}
