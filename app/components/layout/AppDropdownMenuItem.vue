<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = withDefaults(
  defineProps<{
    as?: 'router-link' | 'button' | 'a'
    to?: string
    href?: string
    danger?: boolean
    disabled?: boolean
  }>(),
  {
    as: 'router-link',
    to: undefined,
    href: undefined,
    danger: false,
    disabled: false,
  },
)

const componentTag = computed(() => {
  if (props.as === 'router-link') {
    return RouterLink
  }

  return props.as
})

const itemClass = computed(() =>
  props.danger
    ? 'text-rose-600 hover:bg-rose-50'
    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950',
)
</script>

<template>
  <component
    :is="componentTag"
    :to="as === 'router-link' ? to : undefined"
    :href="as === 'a' ? href : undefined"
    :disabled="as === 'button' ? disabled : undefined"
    class="flex w-full items-center justify-between gap-3 rounded-[1rem] px-4 py-3 text-sm font-semibold transition"
    :class="itemClass"
    role="menuitem"
  >
    <span class="flex min-w-0 items-center gap-3">
      <slot name="leading" />
      <span class="min-w-0">
        <slot />
      </span>
    </span>

    <span aria-hidden="true" :class="danger ? 'text-rose-300' : 'text-slate-400'">
      <slot name="trailing">→</slot>
    </span>
  </component>
</template>
