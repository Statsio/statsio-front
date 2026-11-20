<script setup lang="ts">
import { useStudioToast } from '@/composables/useStudioToast'

const { toast, runAction } = useStudioToast()
</script>

<template>
  <Teleport to="body">
    <div v-if="toast" :key="toast.id" class="st-toast" role="status" aria-live="polite">
      <span>{{ toast.message }}</span>
      <button v-if="toast.actionLabel" type="button" @click="runAction">{{ toast.actionLabel }}</button>
    </div>
  </Teleport>
</template>
