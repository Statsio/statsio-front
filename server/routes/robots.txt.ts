export default defineEventHandler((event) => {
  const origin = getRequestURL(event).origin

  const disallow = [
    '/admin',
    '/studio',
    '/stats/',
    '/user',
    '/mes-chaines',
    '/contenus',
    '/fil-actus',
    '/channels/*/dashboard',
    '/statsdata/*/proprietes',
    '/integrations/statsdata',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ]

  const lines = [
    'User-agent: *',
    'Allow: /',
    ...disallow.map((path) => `Disallow: ${path}`),
    '',
    `Sitemap: ${origin}/sitemap.xml`,
  ]

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return lines.join('\n')
})
