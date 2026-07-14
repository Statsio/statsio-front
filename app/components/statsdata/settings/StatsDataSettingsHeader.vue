<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'

defineProps<{
  subtitle: string
  isSaving: boolean
  isSaved: boolean
}>()

defineEmits<{ save: [] }>()
</script>

<template>
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-[#18181f]">Paramètres du contenu</h1>
      <p class="mt-1.5 text-sm text-[#18181f]/55">{{ subtitle }}</p>
    </div>
    <div class="flex items-center gap-2">
      <span v-if="isSaved" class="text-[13px] font-semibold text-emerald-500">Enregistré ✓</span>
      <AppButton variant="primary" size="md" :disabled="isSaving" @click="$emit('save')">
        {{ isSaving ? 'Enregistrement…' : 'Enregistrer' }}
      </AppButton>
    </div>
  </div>
</template>
