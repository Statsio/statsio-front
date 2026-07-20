<script setup lang="ts">
import { useAttrs, useId } from 'vue'

defineOptions({
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    modelValue: boolean
    disabled?: boolean
    label?: string
    description?: string
    required?: boolean
  }>(),
  {
    disabled: false,
    label: undefined,
    description: undefined,
    required: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [boolean]
}>()

const attrs = useAttrs()

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}

const checkboxId = `checkbox-${useId()}`
</script>

<template>
  <label
    :for="checkboxId"
    class="group flex cursor-pointer items-start gap-3 transition"
    :class="disabled ? 'cursor-not-allowed opacity-60' : 'hover:opacity-90'"
  >
    <div class="relative flex items-center justify-center">
      <input
        :id="checkboxId"
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        :required="required"
        class="peer sr-only"
        v-bind="attrs"
        @change="handleChange"
      />
      <div
        class="flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all peer-focus:ring-2 peer-focus:ring-primary/20"
        :class="
          modelValue
            ? 'border-primary bg-primary'
            : 'border-slate-300 bg-white group-hover:border-slate-400'
        "
      >
        <svg
          v-if="modelValue"
          class="h-3.5 w-3.5 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
        >
          <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
    </div>

    <div v-if="label || description || $slots.default" class="flex-1">
      <div v-if="label" class="text-sm font-semibold leading-6 text-slate-700 group-hover:text-slate-900">
        {{ label }}
        <span v-if="required" class="text-rose-500">*</span>
      </div>
      <slot />
      <p v-if="description" class="mt-1 text-xs leading-5 text-slate-500">
        {{ description }}
      </p>
    </div>
  </label>
</template>
