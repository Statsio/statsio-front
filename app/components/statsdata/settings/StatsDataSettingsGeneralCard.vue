<script setup lang="ts">
import { computed } from 'vue'
import StatsDataSettingsCard from './StatsDataSettingsCard.vue'

const DESCRIPTION_MAX_LENGTH = 240

const name = defineModel<string>('name', { required: true })
const description = defineModel<string>('description', { required: true })

const descriptionCount = computed(() => description.value.length)

function onDescriptionInput(event: Event) {
  description.value = (event.target as HTMLTextAreaElement).value.slice(0, DESCRIPTION_MAX_LENGTH)
}
</script>

<template>
  <StatsDataSettingsCard title="Informations générales">
    <div class="flex flex-col gap-5">
      <div>
        <label class="mb-2 block text-xs font-semibold text-[#18181f]/50">Nom du contenu</label>
        <input
          v-model="name"
          type="text"
          placeholder="Titre du contenu"
          class="w-full rounded-[10px] border border-[#18181f]/[0.14] px-3.5 py-3 text-sm text-[#18181f] transition-colors focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label class="mb-2 block text-xs font-semibold text-[#18181f]/50">Description</label>
        <textarea
          :value="description"
          rows="4"
          placeholder="Décrivez ce contenu en quelques mots"
          class="w-full resize-y rounded-[10px] border border-[#18181f]/[0.14] px-3.5 py-3 text-sm leading-relaxed text-[#18181f] transition-colors focus:border-primary focus:outline-none"
          @input="onDescriptionInput"
        />
        <p class="mt-1.5 text-right text-[11.5px] text-[#18181f]/40">{{ descriptionCount }}/{{ DESCRIPTION_MAX_LENGTH }}</p>
      </div>
    </div>
  </StatsDataSettingsCard>
</template>
