import type { StatsDataDocument } from '@/api/studio'
import { contentPropertiesPath, getStatusMeta, publicContentPath } from '@/lib/content-display'
import { formatShortDate } from '@/lib/format'
import type { ContentManageMeta } from '@/types/content-card'

export interface ManageOwnerContext {
  /** Résout le libellé du propriétaire (« Nom · Chaîne » / « Prénom · Perso ») — dépend du contexte (auth, chaînes). */
  resolveOwner: (doc: StatsDataDocument) => { kind: 'perso' | 'chaine'; label: string }
}

/**
 * Métadonnées d'édition d'un contenu, pour les cartes en `mode="manage"`.
 * Extrait la logique jadis dupliquée entre `useMyStudioContents` et `useChannelContents`.
 */
export function contentManageMeta(doc: StatsDataDocument, ctx: ManageOwnerContext): ContentManageMeta {
  const type = doc.type ?? 'statsdata'
  const status = getStatusMeta(doc.status, doc.visibility)
  const owner = ctx.resolveOwner(doc)

  return {
    statusLabel: status.label,
    statusBg: status.bg,
    statusColor: status.color,
    live: status.live,
    ownerKind: owner.kind,
    ownerLabel: owner.label,
    date: formatShortDate(doc.updated_at ?? doc.created_at),
    viewsCount: doc.views_count ?? 0,
    studioPath: `/studio/${type}/${doc.slug ?? doc.id}`,
    propertiesPath: contentPropertiesPath(type, doc.slug),
    publicPath: status.live && doc.slug ? publicContentPath(type, doc.slug) : null,
  }
}
