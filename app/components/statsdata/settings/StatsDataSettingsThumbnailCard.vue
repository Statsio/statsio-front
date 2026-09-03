<script setup lang="ts">
import StatsDataSettingsCard from './StatsDataSettingsCard.vue'
import { useMediaLibrary } from '@/composables/useMediaLibrary'

defineProps<{
  previewUrl: string | null
}>()

const emit = defineEmits<{
  select: [media: { id: number; url: string }]
  remove: []
}>()

const mediaLibrary = useMediaLibrary()

function choose() {
  mediaLibrary.open({
    mode: 'pick',
    directory: 'studio-content-thumbnails',
    onSelect: (media) => emit('select', { id: media.id, url: media.url }),
  })
}
</script>

<template>
  <StatsDataSettingsCard title="Miniature">
    <div class="flex flex-wrap items-start gap-5">
      <div class="relative flex h-[124px] w-[220px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#eaf1fe] font-mono text-[11px] text-primary">
        <img v-if="previewUrl" :src="previewUrl" alt="Miniature" class="h-full w-full object-cover" />
        <span v-else>miniature 16:9</span>
      </div>

      <div class="flex flex-col gap-2.5">
        <p class="max-w-[340px] text-[13px] leading-relaxed text-[#18181f]/55">
          Format recommandé : 1280 × 720, JPG ou PNG, 5 Mo max.
        </p>
        <div class="flex gap-2.5">
          <button
            type="button"
            class="rounded-[9px] border border-[#18181f]/[0.14] bg-white px-[18px] py-2.5 text-[13px] font-bold text-[#18181f]"
            @click="choose"
          >
            {{ previewUrl ? 'Changer l’image' : 'Choisir une image' }}
          </button>
          <button
            v-if="previewUrl"
            type="button"
            class="rounded-[9px] border border-red-200 bg-white px-[18px] py-2.5 text-[13px] font-bold text-red-600 transition-colors hover:bg-red-50"
            @click="emit('remove')"
          >
            Retirer
          </button>
        </div>
      </div>
    </div>
  </StatsDataSettingsCard>
</template>
