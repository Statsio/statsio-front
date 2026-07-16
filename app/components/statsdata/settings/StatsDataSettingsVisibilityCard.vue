<script setup lang="ts">
import StatsDataSettingsCard from './StatsDataSettingsCard.vue'
import type { ContentVisibility } from '@/types/studio'

const visibility = defineModel<ContentVisibility>({ required: true })

const options: { value: ContentVisibility; label: string; description: string }[] = [
  { value: 'public', label: 'Public', description: 'Visible par tout le monde, y compris dans les recherches.' },
  { value: 'protege', label: 'Protégé', description: 'Visible uniquement par les personnes ayant le lien.' },
  { value: 'private', label: 'Privé', description: 'Visible uniquement par vous.' },
]
</script>

<template>
  <StatsDataSettingsCard title="Visibilité" description="Qui peut voir ce contenu.">
    <div class="flex flex-col gap-2.5">
      <div
        v-for="opt in options"
        :key="opt.value"
        role="radio"
        :aria-checked="visibility === opt.value"
        tabindex="0"
        class="flex cursor-pointer items-start gap-3.5 rounded-xl border px-4 py-3.5 transition-colors"
        :class="visibility === opt.value ? 'border-primary bg-primary/5' : 'border-[#18181f]/10 bg-white'"
        @click="visibility = opt.value"
        @keydown.enter="visibility = opt.value"
        @keydown.space.prevent="visibility = opt.value"
      >
        <span
          class="mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2"
          :class="visibility === opt.value ? 'border-primary' : 'border-[#18181f]/25'"
        >
          <span v-if="visibility === opt.value" class="h-[9px] w-[9px] rounded-full bg-primary" />
        </span>
        <span>
          <span class="block text-[13.5px] font-bold text-[#18181f]">{{ opt.label }}</span>
          <span class="mt-0.5 block text-[12.5px] text-[#18181f]/50">{{ opt.description }}</span>
        </span>
      </div>
    </div>
  </StatsDataSettingsCard>
</template>
