<script setup lang="ts">
import StatsDataSettingsCard from './StatsDataSettingsCard.vue'

defineProps<{
  previewUrl: string | null
}>()

const emit = defineEmits<{
  select: [file: File]
  remove: []
}>()

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) emit('select', file)
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
          <label class="inline-block cursor-pointer rounded-[9px] border border-[#18181f]/[0.14] bg-white px-[18px] py-2.5 text-[13px] font-bold text-[#18181f]">
            Choisir un fichier
            <input type="file" accept="image/*" class="hidden" @change="onFileChange" />
          </label>
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
