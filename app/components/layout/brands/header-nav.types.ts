export type HeaderNavItem = {
  label: string
  href: string
  icon: 'articles' | 'stats' | 'polls' | 'channels' | 'remote' | 'disease' | 'medicine' | 'medical-service'
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
