/**
 * Analyse d'une coordonnée géographique tenant sur une seule valeur de colonne —
 * cas fréquent des exports data.gouv (`geo_point_2d = "48.8566, 2.3522"`), du WKT
 * (`POINT(2.3522 48.8566)`) ou du GeoJSON (`[2.3522, 48.8566]`).
 *
 * Renvoie toujours `[latitude, longitude]`, ou `null` si rien d'exploitable.
 */
export type LatLngOrder = 'latlng' | 'lnglat'

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).trim().replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** Ordonne une paire de nombres en `[lat, lng]` et corrige un lat hors bornes. */
function toLatLng(a: unknown, b: unknown, order: LatLngOrder): [number, number] | null {
  const x = num(a)
  const y = num(b)
  if (x === null || y === null) return null
  let [lat, lng] = order === 'lnglat' ? [y, x] : [x, y]
  // Sécurité : une latitude impossible alors que l'autre valeur est plausible → inversion.
  if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) [lat, lng] = [lng, lat]
  return [lat, lng]
}

export function parseLatLng(raw: unknown, order: LatLngOrder = 'latlng'): [number, number] | null {
  if (raw === null || raw === undefined) return null

  // Tableau [lng, lat] (convention GeoJSON).
  if (Array.isArray(raw)) return raw.length >= 2 ? toLatLng(raw[0], raw[1], 'lnglat') : null

  // Objet { lat, lng } / { latitude, longitude } / { x, y }.
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    const lat = num(o.lat ?? o.latitude ?? o.y)
    const lng = num(o.lng ?? o.lon ?? o.long ?? o.longitude ?? o.x)
    return lat !== null && lng !== null ? toLatLng(lat, lng, 'latlng') : null
  }

  const s = String(raw).trim()
  if (!s) return null

  // WKT — POINT(lng lat).
  const wkt = /^point\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)$/i.exec(s)
  if (wkt) return toLatLng(wkt[1], wkt[2], 'lnglat')

  // JSON (tableau ou objet) sérialisé.
  if (s[0] === '[' || s[0] === '{') {
    try {
      return parseLatLng(JSON.parse(s), order)
    } catch {
      /* pas du JSON valide — on retombe sur le découpage texte */
    }
  }

  // "lat, lon" / "lat; lon" / "lat lon" (décimales avec point).
  const nums = s.match(/-?\d+(?:\.\d+)?/g)
  if (nums && nums.length === 2) return toLatLng(nums[0], nums[1], order)

  return null
}
