<script setup lang="ts">
defineProps<{
  moreCount: number
  loading?: boolean
}>()

const emit = defineEmits<{
  load: []
}>()
</script>

<template>
  <div class="mt-7 flex justify-center">
    <button
      type="button"
      class="rounded-full border-[1.5px] border-slate-200 bg-white px-[26px] py-3 text-[13px] font-bold text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-50"
      :disabled="loading"
      @click="emit('load')"
    >
      Afficher {{ moreCount }} de plus
    </button>
  </div>
</template>
