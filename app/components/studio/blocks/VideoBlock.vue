<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()

const rawUrl  = computed(() => props.block.config.videoUrl ?? '')
const caption = computed(() => props.block.config.videoCaption ?? '')

const PROVIDERS = [
  { name: 'YouTube',     color: 'bg-red-100 text-red-600' },
  { name: 'Vimeo',       color: 'bg-sky-100 text-sky-600' },
  { name: 'Dailymotion', color: 'bg-blue-100 text-blue-600' },
]

const embed = computed<{ url: string; provider: string; color: string } | null>(() => {
  const url = rawUrl.value
  if (!url) return null

  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (yt) return { url: `https://www.youtube.com/embed/${yt[1]}`, ...PROVIDERS[0] }

  const vi = url.match(/vimeo\.com\/(\d+)/)
  if (vi) return { url: `https://player.vimeo.com/video/${vi[1]}`, ...PROVIDERS[1] }

  const dm = url.match(/dailymotion\.com\/video\/([^_?\s]+)/)
  if (dm) return { url: `https://www.dailymotion.com/embed/video/${dm[1]}`, ...PROVIDERS[2] }

  return null
})
</script>

<template>
  <!-- Empty state -->
  <div
    v-if="!rawUrl"
    class="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-14 text-slate-400"
  >
    <svg class="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.328l5.603 3.113z" />
    </svg>
    <span class="text-xs font-medium">Coller un lien YouTube, Vimeo ou Dailymotion →</span>
  </div>

  <!-- Unrecognized URL -->
  <div
    v-else-if="!embed"
    class="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-red-100 bg-red-50 py-10 text-red-400"
  >
    <svg class="w-6 h-6 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
    <span class="text-xs font-medium">Lien non reconnu — utilisez YouTube, Vimeo ou Dailymotion</span>
  </div>

  <!-- Embed -->
  <figure v-else class="w-full">
    <div class="relative w-full overflow-hidden rounded-xl bg-slate-900" style="aspect-ratio: 16/9;">
      <iframe
        :src="embed.url"
        class="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        loading="lazy"
      />
    </div>
    <div class="mt-2 flex items-center gap-2">
      <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider" :class="embed.color">{{ embed.provider }}</span>
      <figcaption v-if="caption" class="text-sm italic text-slate-500">{{ caption }}</figcaption>
    </div>
  </figure>
</template>
