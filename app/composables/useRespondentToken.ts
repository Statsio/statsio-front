const COOKIE_NAME = 'statsio_respondent_token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * Identifiant anonyme persistant (cookie 1 an) permettant de reconnaître un
 * visiteur non connecté entre deux visites, sans compte — utilisé pour dédupliquer
 * les réponses aux blocs de formulaire publiés (voir app/api/studio-responses.ts).
 */
export function useRespondentToken() {
  const token = useCookie<string>(COOKIE_NAME, { maxAge: COOKIE_MAX_AGE, sameSite: 'lax' })

  if (!token.value) {
    token.value = crypto.randomUUID()
  }

  return token
}
