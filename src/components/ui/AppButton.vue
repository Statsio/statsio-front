<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue'

defineOptions({
  inheritAttrs: false,
})

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'light'
  | 'light-outline'

type ButtonSize = 'sm' | 'md' | 'lg'
type ButtonTag = 'button' | 'a' | 'router-link'
type IconPosition = 'left' | 'right'

const props = withDefaults(
  defineProps<{
    as?: ButtonTag
    variant?: ButtonVariant
    size?: ButtonSize
    iconPosition?: IconPosition
    iconOnly?: boolean
    fullWidth?: boolean
  }>(),
  {
    as: 'button',
    variant: 'primary',
    size: 'md',
    iconPosition: 'left',
    iconOnly: false,
    fullWidth: false,
  },
)

const attrs = useAttrs()
const slots = useSlots()

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-primary)] text-white shadow-[0_12px_20px_rgba(139,92,246,0.24)] hover:brightness-105 focus-visible:outline-[var(--color-primary)]',
  secondary:
    'border border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-slate-300',
  outline:
    'border border-slate-300 bg-transparent text-slate-700 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-slate-300',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-300',
  light:
    'bg-white text-slate-900 shadow-[0_12px_20px_rgba(15,23,42,0.18)] hover:bg-slate-100 focus-visible:outline-white',
  'light-outline':
    'border border-white/30 bg-transparent text-white hover:bg-white/10 focus-visible:outline-white',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-6 px-2 text-[10px] uppercase tracking-[0.2em]',
  md: 'min-h-8 px-5 text-sm',
  lg: 'min-h-13 px-6 text-sm',
}

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: 'w-10 px-0',
  md: 'w-11 px-0',
  lg: 'w-13 px-0',
}

const hasDefaultSlot = computed(() => Boolean(slots.default))
const hasIconSlot = computed(() => Boolean(slots.icon))

const forwardedAttrs = computed(() => {
  const rest = { ...attrs }
  delete rest.class

  return rest
})

const classes = computed(() => [
  'group inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-semibold transition duration-200 ease-out transform-gpu hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none',
  sizeClasses[props.size],
  props.iconOnly ? iconSizeClasses[props.size] : '',
  props.fullWidth ? 'w-full' : '',
  variantClasses[props.variant],
  attrs.class,
])

const resolvedType = computed(() =>
  props.as === 'button' ? ((attrs.type as string | undefined) ?? 'button') : undefined,
)
</script>

<template>
  <component :is="as" :class="classes" :type="resolvedType" v-bind="forwardedAttrs">
    <span
      v-if="hasIconSlot && iconPosition === 'left'"
      aria-hidden="true"
      class="inline-flex text-[1.1em] transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
    >
      <slot name="icon" />
    </span>

    <span v-if="hasDefaultSlot" class="inline-flex items-center">
      <slot />
    </span>

    <span
      v-if="hasIconSlot && iconPosition === 'right'"
      aria-hidden="true"
      class="inline-flex text-[1.1em] transition-transform duration-200 ease-out group-hover:translate-x-0.5"
    >
      <slot name="icon" />
    </span>
  </component>
</template>
