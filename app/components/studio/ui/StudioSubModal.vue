<script setup lang="ts">
import StudioModal from './StudioModal.vue'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    width?: number
    height?: number
    /** Left-aligned note in the footer. */
    footerNote?: string
    /** Footer confirm button label. */
    doneLabel?: string
  }>(),
  { subtitle: '', width: 680, footerNote: '', doneLabel: 'Terminé' },
)

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <StudioModal
    :title="title"
    :subtitle="subtitle"
    :width="width"
    :height="height"
    @close="emit('close')"
  >
    <div class="flex flex-col gap-5">
      <slot />
    </div>
    <template #footer>
      <span class="text-[12px] leading-[1.45] text-[var(--studio-faint)]">{{ footerNote }}</span>
      <button
        type="button"
        class="studio-gradient shrink-0 whitespace-nowrap rounded-[10px] px-[22px] py-3 text-[13.5px] font-bold text-white"
        @click="emit('close')"
      >
        {{ doneLabel }}
      </button>
    </template>
  </StudioModal>
</template>
