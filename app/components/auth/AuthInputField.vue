<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label?: string
    type?: string
    placeholder?: string
    autocomplete?: string
    error?: string
    disabled?: boolean
  }>(),
  { type: 'text', disabled: false },
)

defineSlots<{ 'label-action'?: () => unknown }>()

const modelValue = defineModel<string>({ required: true })

const showPassword = ref(false)
const isPassword = computed(() => props.type === 'password')
const inputType = computed(() => (isPassword.value && showPassword.value ? 'text' : props.type))
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div v-if="label || $slots['label-action']" class="flex items-center justify-between">
      <label v-if="label" class="select-none text-[13px] font-semibold text-slate-700">{{ label }}</label>
      <slot name="label-action" />
    </div>

    <div class="relative">
      <input
        v-model="modelValue"
        :type="inputType"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        class="w-full rounded-[10px] border-[1.5px] bg-white px-3.5 py-3 text-[14.5px] text-slate-950 outline-none transition duration-150 placeholder:text-slate-950/35 disabled:cursor-not-allowed disabled:opacity-50"
        :class="[
          isPassword ? 'pr-16' : '',
          error
            ? 'border-rose-300 bg-rose-50/60 focus:border-rose-400 focus:ring-4 focus:ring-rose-100'
            : 'border-slate-900/[0.14] hover:border-slate-900/20 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10',
        ]"
      />

      <button
        v-if="isPassword"
        type="button"
        tabindex="-1"
        class="mono absolute right-3.5 top-1/2 -translate-y-1/2 select-none text-[11px] font-semibold text-slate-950/40 transition hover:text-slate-950/70"
        @click="showPassword = !showPassword"
      >
        {{ showPassword ? 'MASQUER' : 'VOIR' }}
      </button>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-0.5"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-0.5"
    >
      <p v-if="error" class="flex items-center gap-1.5 text-xs font-medium text-rose-600">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        {{ error }}
      </p>
    </Transition>
  </div>
</template>
