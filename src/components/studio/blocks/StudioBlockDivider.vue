<script setup lang="ts">
type Payload = { type: 'divider' }

withDefaults(
  defineProps<{
    payload: Payload
    fieldId: string
    editable?: boolean
  }>(),
  { editable: true },
)
</script>

<template>
  <div class="content-block content-block--divider py-2">
    <hr class="border-slate-200" />
  </div>
</template>

