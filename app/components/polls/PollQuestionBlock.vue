<script setup lang="ts">
import { computed } from 'vue'
import type { PollQuestion } from '@/data/polls'

const props = withDefaults(
  defineProps<{
    question: PollQuestion
    modelValue: string[]
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const isSingle = computed(() => props.question.selection === 'single')

const updateValue = (optionId: string, checked: boolean) => {
  if (isSingle.value) {
    emit('update:modelValue', checked ? [optionId] : [])
    return
  }

  const nextValue = checked
    ? [...props.modelValue, optionId]
    : props.modelValue.filter((value) => value !== optionId)

  emit('update:modelValue', nextValue)
}
</script>

<template>
  <section class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.35)] sm:p-7">
    <div class="flex flex-col gap-2">
      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        {{ isSingle ? 'Choix unique' : 'Choix multiple' }}
      </p>
      <h2 class="text-2xl font-semibold leading-tight tracking-[-0.03em] text-slate-950">
        {{ question.prompt }}
      </h2>
      <p v-if="question.helper" class="text-sm leading-6 text-slate-500">
        {{ question.helper }}
      </p>
    </div>

    <div class="mt-6 grid gap-4 md:grid-cols-2">
      <label
        v-for="option in question.options"
        :key="option.id"
        class="group flex cursor-pointer flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 transition hover:border-primary/30 hover:bg-white"
        :class="[
          modelValue.includes(option.id) ? 'border-primary bg-primary/5 ring-2 ring-primary/10' : '',
          disabled ? 'cursor-not-allowed opacity-70 hover:border-slate-200 hover:bg-slate-50' : '',
        ]"
      >
        <img v-if="option.image" :src="option.image" :alt="option.label" class="h-40 w-full object-cover" />

        <div class="flex items-start gap-4 p-4">
          <input
            :type="isSingle ? 'radio' : 'checkbox'"
            :name="question.id"
            :checked="modelValue.includes(option.id)"
            :disabled="disabled"
            class="mt-1 h-4 w-4 border-slate-300 text-primary focus:ring-primary/30"
            @change="updateValue(option.id, ($event.target as HTMLInputElement).checked)"
          />

          <span class="flex min-w-0 flex-1 flex-col gap-2">
            <span class="text-base font-semibold text-slate-950">{{ option.label }}</span>
            <span v-if="option.description" class="text-sm leading-6 text-slate-500">
              {{ option.description }}
            </span>
          </span>
        </div>
      </label>
    </div>
  </section>
</template>
