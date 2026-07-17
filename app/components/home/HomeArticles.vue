<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useScrollAnim } from '@/composables/useScrollAnim'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'
import ArticleTeaserCard from '@/components/articles/ArticleTeaserCard.vue'
import { fetchPublicArticles } from '@/api/studio'

const { data: featuredArticles } = await useAsyncData('home-articles', () => fetchPublicArticles(), {
  default: () => [],
  transform: (articles) => articles.slice(0, 3),
})

const sectionRef = ref<HTMLElement | null>(null)

useScrollAnim(sectionRef, (gsap) => {
  return gsap.context(() => {
    gsap.from('[data-anim="header"]', {
      y: 16, opacity: 0, duration: 0.55, ease: 'power2.out',
      immediateRender: false,
      scrollTrigger: { trigger: sectionRef.value, start: 'top 88%', once: true },
    })
    gsap.from('[data-anim="card"]', {
      y: 32, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out',
      immediateRender: false,
      scrollTrigger: { trigger: sectionRef.value, start: 'top 82%', once: true },
    })
  }, sectionRef.value)
})
</script>

<template>
  <section ref="sectionRef" class="bg-white">
    <div class="container py-20">
      <div data-anim="header">
        <AppSectionHeader eyebrow="Presse & analyses" title="En ce moment">
          <RouterLink to="/articles" class="text-sm font-semibold text-[var(--color-primary)] transition-opacity hover:opacity-70">
            Tout voir →
          </RouterLink>
        </AppSectionHeader>
      </div>

      <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="article in featuredArticles" :key="article.slug" data-anim="card">
          <ArticleTeaserCard :article="article" />
        </div>
      </div>
    </div>
  </section>
</template>
