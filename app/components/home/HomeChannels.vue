<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useScrollAnim } from '@/composables/useScrollAnim'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'
import ChannelPopularityCard from '@/components/channels/ChannelPopularityCard.vue'
import { getPublicChannels, type Channel } from '@/api/channels'

const channels = ref<Channel[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const result = await getPublicChannels({ sort: 'popular', perPage: 4 })
    channels.value = result.channels
  } catch {
    channels.value = []
  } finally {
    loading.value = false
  }
})

const sectionRef = ref<HTMLElement | null>(null)

useScrollAnim(sectionRef, (gsap) => {
  return gsap.context(() => {
    gsap.from('[data-anim="card"]', {
      y: 20, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out',
      immediateRender: false,
      scrollTrigger: { trigger: sectionRef.value, start: 'top 88%', once: true },
    })
  }, sectionRef.value ?? undefined)
})
</script>

<template>
  <!-- v-show (not v-if) keeps the ref stable across the async channel fetch so the scroll animation can register on mount -->
  <section v-show="!loading && channels.length > 0" ref="sectionRef" class="bg-slate-50">
    <div class="container py-20">
      <AppSectionHeader eyebrow="Éditeurs" title="Chaînes populaires" />

      <div class="mt-10 flex flex-col gap-4 sm:flex-row">
        <div v-for="channel in channels" :key="channel.id" data-anim="card" class="flex flex-1">
          <ChannelPopularityCard :channel="channel" class="flex-1" />
        </div>
      </div>
    </div>
  </section>
</template>
