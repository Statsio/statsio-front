import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default defineNuxtPlugin((nuxtApp) => {
  gsap.registerPlugin(ScrollTrigger)

  // Recalculate scroll positions after hydration + layout stabilisation
  nuxtApp.hooks.hook('app:mounted', () => {
    requestAnimationFrame(() => {
      ScrollTrigger.refresh()
    })
  })
})
