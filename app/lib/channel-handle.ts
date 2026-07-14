import { checkHandleAvailability } from '@/api/channels-validation'

export function slugifyHandle(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50)

  return base.length >= 3 ? base : `${base}_chaine`.slice(0, 50)
}

/** Slugifies `name` into a handle and finds an available variant, appending a random suffix on conflict. */
export async function deriveAvailableHandle(name: string): Promise<string> {
  const base = slugifyHandle(name)

  if (await checkHandleAvailability(base)) {
    return base
  }

  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = `${base}_${Math.floor(1000 + Math.random() * 9000)}`.slice(0, 50)
    if (await checkHandleAvailability(candidate)) {
      return candidate
    }
  }

  throw new Error("Impossible de générer un identifiant disponible pour cette chaîne.")
}
