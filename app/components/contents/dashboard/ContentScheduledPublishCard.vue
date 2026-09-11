<script setup lang="ts">
import StatsDataSettingsCard from '@/components/statsdata/settings/StatsDataSettingsCard.vue'

const scheduledPublishAt = defineModel<string | null>({ required: true })

function onDateChange(event: Event) {
  const value = (event.target as HTMLInputElement).value
  scheduledPublishAt.value = value || null
}
</script>

<template>
  <StatsDataSettingsCard
    title="Date de publication"
    description="Programmer la mise en ligne à une date future. Laisser vide pour publier immédiatement."
  >
    <div class="flex flex-wrap items-center gap-3">
      <input
        :value="scheduledPublishAt ?? ''"
        type="date"
        class="w-44 rounded-[10px] border border-[#18181f]/[0.14] px-3.5 py-3 font-mono text-[12.5px] text-[#18181f] transition-colors focus:border-primary focus:outline-none"
        @change="onDateChange"
      />
      <button
        v-if="scheduledPublishAt"
        type="button"
        class="text-xs font-semibold text-[#18181f]/50 transition-colors hover:text-[#18181f]"
        @click="scheduledPublishAt = null"
      >
        Publier immédiatement
      </button>
    </div>
  </StatsDataSettingsCard>
</template>
