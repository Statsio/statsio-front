// Tailwind color name -> badge classes. Mirrors the color names seeded in tv_categories.color (DB).
export const CATEGORY_COLOR_CLASS: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-100 text-blue-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  violet: 'bg-violet-100 text-violet-700',
  purple: 'bg-purple-100 text-purple-700',
  pink: 'bg-pink-100 text-pink-700',
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  lime: 'bg-lime-100 text-lime-700',
  green: 'bg-green-100 text-green-700',
  teal: 'bg-teal-100 text-teal-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  sky: 'bg-sky-100 text-sky-700',
}

export const CATEGORY_COLOR_FALLBACK = 'bg-slate-100 text-slate-700'

// Program.type (free-text genre from the EPG feed) -> DB color name, best-effort match against the
// seeded tv_categories labels (see database/migrations/2026_06_23_000002_create_tv_categories_table.php).
const CATEGORY_COLOR_BY_LABEL: Record<string, string> = {
  Fiction: 'violet',
  Série: 'purple',
  Film: 'indigo',
  Informations: 'blue',
  Information: 'blue',
  Documentaire: 'cyan',
  Reportage: 'teal',
  Sport: 'green',
  Divertissement: 'yellow',
  'Talk-show': 'orange',
  Téléréalité: 'red',
  Musique: 'pink',
  Jeunesse: 'lime',
  Animation: 'lime',
  Magazine: 'slate',
  Météo: 'sky',
}

export function categoryBadgeClass(label: string | null | undefined): string {
  if (!label) return CATEGORY_COLOR_FALLBACK
  const colorName = CATEGORY_COLOR_BY_LABEL[label]
  return (colorName && CATEGORY_COLOR_CLASS[colorName]) || CATEGORY_COLOR_FALLBACK
}

// border-l-{color} (not border-{color}) so only the left accent is tinted; the rest of the
// border keeps the neutral slate-200 also applied on the element.
const CATEGORY_BORDER_CLASS: Record<string, string> = {
  slate: 'border-l-slate-400',
  blue: 'border-l-blue-400',
  indigo: 'border-l-indigo-400',
  violet: 'border-l-violet-400',
  purple: 'border-l-purple-400',
  pink: 'border-l-pink-400',
  red: 'border-l-red-400',
  orange: 'border-l-orange-400',
  yellow: 'border-l-yellow-400',
  lime: 'border-l-lime-400',
  green: 'border-l-green-400',
  teal: 'border-l-teal-400',
  cyan: 'border-l-cyan-400',
  sky: 'border-l-sky-400',
}

export const CATEGORY_BORDER_FALLBACK = 'border-l-slate-300'

export function categoryBorderClass(label: string | null | undefined): string {
  if (!label) return CATEGORY_BORDER_FALLBACK
  const colorName = CATEGORY_COLOR_BY_LABEL[label]
  return (colorName && CATEGORY_BORDER_CLASS[colorName]) || CATEGORY_BORDER_FALLBACK
}

export const BROADCAST_TYPE_LABELS: Record<string, { label: string; class: string }> = {
  inedit: { label: 'Inédit', class: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  rediffusion: { label: 'Rediffusion', class: 'bg-slate-100 text-slate-600 border-slate-200' },
  direct: { label: 'Direct', class: 'bg-red-100 text-red-700 border-red-200' },
  replay: { label: 'Replay', class: 'bg-blue-100 text-blue-700 border-blue-200' },
  exclusivite: { label: 'Exclusivité', class: 'bg-violet-100 text-violet-700 border-violet-200' },
}

// Plain-text mention indicator (no pill background) used on the schedule programme cards —
// distinct from BROADCAST_TYPE_LABELS, which renders a filled badge elsewhere (broadcast detail pages).
export const MENTION_TEXT_STYLE: Record<string, { label: string; textClass: string; dotClass: string; showDot: boolean }> = {
  direct: { label: 'Direct', textClass: 'text-red-600', dotClass: 'bg-red-600', showDot: true },
  inedit: { label: 'Inédit', textClass: 'text-emerald-700', dotClass: 'bg-emerald-700', showDot: true },
  rediffusion: { label: 'Rediffusion', textClass: 'text-slate-500', dotClass: '', showDot: false },
  replay: { label: 'Replay', textClass: 'text-slate-500', dotClass: '', showDot: false },
  exclusivite: { label: 'Exclusivité', textClass: 'text-violet-600', dotClass: 'bg-violet-600', showDot: true },
}

// Hex accent per DB color name, used to tint the diagonal-stripe programme thumbnail placeholder.
const CATEGORY_ACCENT_HEX: Record<string, string> = {
  slate: '#64748b', blue: '#3b82f6', indigo: '#6366f1', violet: '#8b5cf6', purple: '#a855f7',
  pink: '#ec4899', red: '#ef4444', orange: '#f97316', yellow: '#eab308', lime: '#84cc16',
  green: '#22c55e', teal: '#14b8a6', cyan: '#06b6d4', sky: '#0ea5e9',
}

const CATEGORY_ACCENT_FALLBACK = '#94a3b8'

export function categoryThumbnailGradient(label: string | null | undefined): string {
  const colorName = label ? CATEGORY_COLOR_BY_LABEL[label] : undefined
  const hex = (colorName && CATEGORY_ACCENT_HEX[colorName]) || CATEGORY_ACCENT_FALLBACK
  return `repeating-linear-gradient(135deg, ${hex}29 0px, ${hex}29 8px, ${hex}0f 8px, ${hex}0f 16px)`
}
