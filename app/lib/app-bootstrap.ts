export type AppBootstrapErrorState = {
  title: string
  message: string
  details?: string
}

/** SSR-safe via useState — chaque requête SSR a son propre état. */
export const useBootstrapError = () =>
  useState<AppBootstrapErrorState | null>('bootstrap-error', () => null)

export const setBootstrapError = (error: AppBootstrapErrorState) => {
  useBootstrapError().value = error
}

export const clearBootstrapError = () => {
  useBootstrapError().value = null
}
