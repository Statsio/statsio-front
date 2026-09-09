/**
 * Précharge la table « catégorie → icône » (voir useCategoryIcons) côté serveur
 * pour que les pastilles de catégorie soient rendues avec la bonne icône dès le
 * SSR, sans décalage d'hydratation. Le résultat est transféré au client via
 * useState.
 */
export default defineNuxtPlugin(async () => {
  const { ensureCategoryIcons } = useCategoryIcons()
  await ensureCategoryIcons()
})
