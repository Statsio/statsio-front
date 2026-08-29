<script setup lang="ts">
import { NuxtLink } from '#components'
import type { RouteLocationRaw } from 'vue-router'

withDefaults(
  defineProps<{
    to?: RouteLocationRaw
    label: string
    /** Path data (viewBox 0 0 24 24) for the icon's <path d="...">. */
    icon?: string
    active?: boolean
    as?: 'link' | 'button'
    disabled?: boolean
    tone?: 'default' | 'danger'
  }>(),
  { active: false, as: 'link', disabled: false, tone: 'default' },
)

const emit = defineEmits<{ click: [MouseEvent] }>()
</script>

<template>
  <component
    :is="as === 'button' ? 'button' : NuxtLink"
    v-bind="as === 'button' ? { type: 'button', disabled } : { to }"
    class="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[14.5px] font-semibold transition"
    :class="
      tone === 'danger'
        ? 'text-rose-600 hover:bg-rose-50 disabled:opacity-60'
        : active
          ? 'bg-primary/10 text-primary'
          : 'text-slate-700 hover:bg-slate-50'
    "
    @click="emit('click', $event)"
  >
    <svg v-if="icon" class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
      <path stroke-linecap="round" stroke-linejoin="round" :d="icon" />
    </svg>
    <span class="flex-1 truncate">{{ label }}</span>
    <slot name="trailing" />
  </component>
</template>
