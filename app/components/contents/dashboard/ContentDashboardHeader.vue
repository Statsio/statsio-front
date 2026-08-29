<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    /** Libellé du bouton d'enregistrement. Masqué si absent. */
    saveLabel?: string
    saving?: boolean
    dirty?: boolean
  }>(),
  { subtitle: '', saveLabel: '', saving: false, dirty: true },
)

defineEmits<{ save: [] }>()
</script>

<template>
  <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div class="min-w-0">
      <h1 class="text-[25px] font-extrabold text-slate-950">{{ title }}</h1>
      <p v-if="subtitle" class="mt-1.5 max-w-[560px] text-[13.5px] text-pretty text-slate-500">
        {{ subtitle }}
      </p>
    </div>

    <div v-if="saveLabel || $slots.actions" class="flex shrink-0 items-center gap-2.5">
      <slot name="actions">
        <AppButton
          v-if="saveLabel"
          variant="gradient"
          size="md"
          :disabled="saving || !dirty"
          @click="$emit('save')"
        >
          {{ saving ? 'Enregistrement…' : saveLabel }}
        </AppButton>
      </slot>
    </div>
  </div>
</template>
