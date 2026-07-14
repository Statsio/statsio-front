<script setup lang="ts">
import { ref } from 'vue'
import StatsDataSettingsCard from './StatsDataSettingsCard.vue'

defineProps<{
  contentName: string
  isDeleting: boolean
}>()

const emit = defineEmits<{ confirm: [] }>()

const confirming = ref(false)
</script>

<template>
  <StatsDataSettingsCard
    danger
    title="Zone de danger"
    description="La suppression est définitive et retire ce contenu de toutes les statistiques."
  >
    <div v-if="confirming" class="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-red-50 px-[18px] py-4">
      <p class="text-[13.5px] font-semibold text-red-900">Confirmer la suppression de « {{ contentName }} » ?</p>
      <div class="flex gap-2.5">
        <button
          type="button"
          class="rounded-[9px] bg-red-600 px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          :disabled="isDeleting"
          @click="emit('confirm')"
        >
          {{ isDeleting ? 'Suppression…' : 'Oui, supprimer' }}
        </button>
        <button
          type="button"
          class="rounded-[9px] border border-[#18181f]/[0.14] bg-white px-4 py-2.5 text-[13px] font-bold text-[#18181f]"
          :disabled="isDeleting"
          @click="confirming = false"
        >
          Annuler
        </button>
      </div>
    </div>
    <button
      v-else
      type="button"
      class="rounded-[9px] border border-red-300/60 bg-white px-5 py-2.5 text-[13.5px] font-bold text-red-600 transition-colors hover:bg-red-50"
      @click="confirming = true"
    >
      Supprimer ce contenu
    </button>
  </StatsDataSettingsCard>
</template>
