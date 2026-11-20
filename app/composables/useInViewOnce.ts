import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * Appelle `callback` une seule fois, la première fois que `target` entre
 * dans le viewport (seuil 30 %). Sans IntersectionObserver, appelle tout de suite.
 */
export function useInViewOnce(target: Ref<Element | null | undefined>, callback: () => void, threshold = 0.3) {
  let observer: IntersectionObserver | null = null
  let done = false

  const fire = () => {
    if (done) return
    done = true
    observer?.disconnect()
    observer = null
    callback()
  }

  onMounted(() => {
    const el = target.value
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      fire()
      return
    }
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) fire()
      },
      { threshold },
    )
    observer.observe(el)
  })

  onBeforeUnmount(() => observer?.disconnect())
}
