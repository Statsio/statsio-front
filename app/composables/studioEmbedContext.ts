import type { InjectionKey } from 'vue'
import type { StudioDocumentPage } from '@/types/studio'

/**
 * Fourni par `SdEmbedBlock` autour du `BlockRenderer` d'un bloc réutilisé depuis un
 * autre Statsdata publié (bloc `sd-embed` des articles). Les blocs de données
 * (`useBlockData`) et le bloc `search` s'en servent pour taper l'API publique du
 * **document source** plutôt que celle de l'article courant.
 */
export interface StudioEmbedContext {
  /** Slug du Statsdata source. */
  docSlug: string
  /** Pages du document source (navigation d'un bloc `search` embarqué). */
  pages: StudioDocumentPage[]
  /** Valeurs des paramètres `{{param}}` de la page source (défaut + override auteur). */
  params: Record<string, string>
}

export const STUDIO_EMBED_CONTEXT: InjectionKey<StudioEmbedContext> = Symbol('studioEmbedContext')
