<script setup lang="ts">
import { ref } from 'vue'
import VariablePickerModal from '@/components/studio/VariablePickerModal.vue'

withDefaults(defineProps<{ context?: string; pageId?: string }>(), { context: '' })

const emit = defineEmits<{ pick: [token: string] }>()

const open = ref(false)

function onPick(token: string) {
  emit('pick', token)
  open.value = false
}
</script>

<template>
  <button
    type="button"
    class="flex h-[34px] shrink-0 items-center gap-1.5 rounded-[9px] bg-[var(--studio-tag)] px-2.5 text-[var(--studio-tag-ink)] transition-opacity hover:opacity-80"
    title="Insérer une variable dynamique"
    @mousedown.prevent
    @click="open = true"
  >
    <span class="font-mono text-[12px] font-semibold">{ }</span>
  </button>

  <VariablePickerModal
    v-if="open"
    :context="context"
    :page-id="pageId"
    @pick="onPick"
    @close="open = false"
  />
</template>
