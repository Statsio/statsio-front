export type HeaderNavItem = {
  label: string
  href: string
  icon: 'articles' | 'stats' | 'polls' | 'channels' | 'remote'
  eyebrow: string
  title: string
  description: string
  featured: {
    title: string
    value: string
    detail: string
  }
  links: string[]
}
