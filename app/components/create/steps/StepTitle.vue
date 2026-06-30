<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  contentTypeLabel: string
}>()

const emit = defineEmits<{
  'update:modelValue': [string]
}>()
</script>

<template>
  <div class="space-y-6 py-2">
    <div class="space-y-2">
      <label for="content-title" class="block text-sm font-semibold text-slate-700">
        Titre du {{ contentTypeLabel }}
      </label>
      <input
        id="content-title"
        :value="modelValue"
        type="text"
        :placeholder="`Ex : Analyse de l'emploi en France 2024`"
        class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 transition
               focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10"
        autofocus
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <p class="text-sm text-slate-500">
      Ce titre est modifiable à tout moment depuis le studio. Choisissez quelque chose de clair et descriptif.
    </p>
  </div>
</template>
