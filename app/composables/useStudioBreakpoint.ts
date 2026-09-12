import { useBreakpoints } from '@vueuse/core'

/** Seuil mobile du Studio, aligné sur le `md` Tailwind (768px). */
const breakpoints = useBreakpoints({ md: 768 })

export function useStudioBreakpoint() {
  const isMobile = breakpoints.smaller('md')
  const isDesktop = breakpoints.greaterOrEqual('md')
  return { isMobile, isDesktop }
}
