import { onMounted, onUnmounted, type Ref } from 'vue'

type AnimSetup = (gsap: typeof import('gsap').default, ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger) => { revert(): void } | null

export function useScrollAnim(sectionRef: Ref<HTMLElement | null>, setup: AnimSetup) {
  let ctx: { revert(): void } | null = null

  onMounted(async () => {
    if (!sectionRef.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    try {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      gsap.registerPlugin(ScrollTrigger)
      ctx = setup(gsap, ScrollTrigger)
    } catch {
      // GSAP not available — content visible without animation
    }
  })

  onUnmounted(() => {
    ctx?.revert()
    import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }).catch(() => {})
  })
}
