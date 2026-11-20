<script setup lang="ts">
withDefaults(defineProps<{ label: string; sub?: string }>(), { sub: '' })

const model = defineModel<boolean>({ default: false })
</script>

<template>
  <div class="st-swr">
    <span class="min-w-0">{{ label }}<small v-if="sub">{{ sub }}</small></span>
    <button
      type="button"
      role="switch"
      class="st-sw"
      :aria-checked="model"
      :aria-label="label"
      @click="model = !model"
    />
  </div>
</template>
