<script setup lang="ts">
import StatsDataSettingsCard from './StatsDataSettingsCard.vue'

const responseDeadline = defineModel<string | null>({ required: true })

function onDateChange(event: Event) {
  const value = (event.target as HTMLInputElement).value
  responseDeadline.value = value || null
}
</script>

<template>
  <StatsDataSettingsCard
    title="Date limite de réponses"
    description="Optionnel — sans date, le sondage reste ouvert indéfiniment."
  >
    <div class="flex items-center gap-3">
      <input
        :value="responseDeadline ?? ''"
        type="date"
        class="rounded-[10px] border border-[#18181f]/[0.14] px-3.5 py-3 text-sm text-[#18181f] transition-colors focus:border-primary focus:outline-none"
        @change="onDateChange"
      />
      <button
        v-if="responseDeadline"
        type="button"
        class="text-xs font-semibold text-[#18181f]/50 transition-colors hover:text-[#18181f]"
        @click="responseDeadline = null"
      >
        Retirer la date limite
      </button>
    </div>
  </StatsDataSettingsCard>
</template>
