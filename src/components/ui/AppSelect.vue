<script setup lang="ts">
import { computed, nextTick, ref, useAttrs } from 'vue'
import { onClickOutside } from '@vueuse/core'

defineOptions({
  inheritAttrs: false,
})

export type AppSelectOption<T = string> = {
  readonly value: T
  readonly label: string
  readonly disabled?: boolean
}

type Primitive = string | number | boolean | null

const props = withDefaults(
  defineProps<{
    modelValue: Primitive
    options: readonly AppSelectOption<Exclude<Primitive, null>>[]
    placeholder?: string
    disabled?: boolean
    size?: 'sm' | 'md'
    ariaLabel?: string
    buttonClass?: string
    panelClass?: string
    optionClass?: string
  }>(),
  {
    placeholder: 'Sélectionner…',
    disabled: false,
    size: 'md',
    ariaLabel: undefined,
    buttonClass: '',
    panelClass: '',
    optionClass: '',
  },
)

const emit = defineEmits<{
  'update:modelValue': [Primitive]
  change: [Primitive]
}>()

const attrs = useAttrs()

const rootEl = ref<HTMLElement | null>(null)
const buttonEl = ref<HTMLButtonElement | null>(null)
const listEl = ref<HTMLDivElement | null>(null)

const open = ref(false)
const activeIndex = ref<number>(-1)

const selectedIndex = computed(() => {
  if (props.modelValue == null) return -1
  return props.options.findIndex((o) => o.value === props.modelValue)
})

const selectedLabel = computed(() => {
  const idx = selectedIndex.value
  if (idx < 0) return ''
  return props.options[idx]?.label ?? ''
})

const listboxId = `app-select-${Math.random().toString(16).slice(2)}`

const forwardedAttrs = computed(() => {
  const rest: Record<string, unknown> = { ...(attrs as Record<string, unknown>) }
  delete rest['class']
  delete rest['onChange']
  return rest
})

const sizeClasses = computed(() => {
  return props.size === 'sm'
    ? {
        button: 'min-h-8 rounded-full px-2 text-xs',
        panel: 'rounded-xl',
        option: 'rounded-lg px-2 py-1.5 text-xs',
      }
    : {
        button: 'min-h-12 rounded-[1.25rem] px-4 text-sm',
        panel: 'rounded-[1.25rem]',
        option: 'rounded-[1rem] px-3 py-2 text-sm',
      }
})

function firstEnabledIndex() {
  return props.options.findIndex((o) => !o.disabled)
}

function clampToEnabled(start: number, dir: 1 | -1) {
  const len = props.options.length
  if (!len) return -1
  let i = start
  for (let step = 0; step < len; step++) {
    const opt = props.options[i]
    if (opt && !opt.disabled) return i
    i = (i + dir + len) % len
  }
  return -1
}

async function setOpen(next: boolean) {
  if (props.disabled) return
  open.value = next
  if (next) {
    const seed = selectedIndex.value >= 0 ? selectedIndex.value : firstEnabledIndex()
    activeIndex.value = clampToEnabled(Math.max(0, seed), 1)
    await nextTick()
    listEl.value?.focus()
    scrollActiveIntoView()
  } else {
    activeIndex.value = -1
    await nextTick()
    buttonEl.value?.focus()
  }
}

function selectIndex(i: number) {
  const opt = props.options[i]
  if (!opt || opt.disabled) return
  emit('update:modelValue', opt.value)
  emit('change', opt.value)
  void setOpen(false)
}

function scrollActiveIntoView() {
  const el = listEl.value
  if (!el) return
  const item = el.querySelector<HTMLElement>(`[data-idx="${activeIndex.value}"]`)
  item?.scrollIntoView({ block: 'nearest' })
}

function onTriggerKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    void setOpen(true)
  }
}

function onListKeydown(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    void setOpen(false)
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    if (activeIndex.value >= 0) selectIndex(activeIndex.value)
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    const next = clampToEnabled((activeIndex.value + 1 + props.options.length) % props.options.length, 1)
    activeIndex.value = next
    scrollActiveIntoView()
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    const prev = clampToEnabled((activeIndex.value - 1 + props.options.length) % props.options.length, -1)
    activeIndex.value = prev
    scrollActiveIntoView()
    return
  }
  if (e.key === 'Home') {
    e.preventDefault()
    activeIndex.value = clampToEnabled(0, 1)
    scrollActiveIntoView()
    return
  }
  if (e.key === 'End') {
    e.preventDefault()
    activeIndex.value = clampToEnabled(Math.max(0, props.options.length - 1), -1)
    scrollActiveIntoView()
    return
  }
}

onClickOutside(rootEl, () => {
  if (open.value) void setOpen(false)
})
</script>

<template>
  <div ref="rootEl" class="relative" :class="(attrs.class as string | undefined) ?? ''">
    <button
      ref="buttonEl"
      type="button"
      class="flex w-full items-center justify-between gap-3 border border-slate-200 bg-slate-50 text-left text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:pointer-events-none disabled:opacity-60"
      :class="[sizeClasses.button, buttonClass]"
      :disabled="disabled"
      :aria-label="ariaLabel"
      aria-haspopup="listbox"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="listboxId"
      v-bind="forwardedAttrs"
      @click="setOpen(!open)"
      @keydown="onTriggerKeydown"
    >
      <span class="min-w-0 flex-1 truncate" :class="modelValue == null ? 'text-slate-400' : ''">
        {{ modelValue == null ? placeholder : selectedLabel }}
      </span>
      <svg class="h-4 w-4 shrink-0 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <div
      v-if="open"
      class="absolute z-[9999] mt-2 w-full overflow-hidden border border-slate-200 bg-white shadow-[0_24px_70px_-54px_rgba(15,23,42,0.55)]"
      :class="[sizeClasses.panel, panelClass]"
      role="presentation"
    >
      <div
        :id="listboxId"
        ref="listEl"
        class="max-h-72 overflow-y-auto p-1 outline-none"
        role="listbox"
        tabindex="-1"
        @keydown="onListKeydown"
      >
        <button
          v-for="(opt, i) in options"
          :key="String(opt.value)"
          type="button"
          role="option"
          class="flex w-full items-center justify-between gap-3 text-left transition"
          :class="[
            sizeClasses.option,
            optionClass,
            opt.disabled ? 'cursor-not-allowed text-slate-300' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
            i === activeIndex ? 'bg-slate-50 text-slate-900' : '',
            opt.value === modelValue ? 'font-semibold' : 'font-medium',
          ]"
          :aria-selected="opt.value === modelValue ? 'true' : 'false'"
          :disabled="opt.disabled"
          :data-idx="i"
          @mousemove="activeIndex = i"
          @click="selectIndex(i)"
        >
          <span class="min-w-0 flex-1 truncate">{{ opt.label }}</span>
          <svg
            v-if="opt.value === modelValue"
            class="h-4 w-4 shrink-0 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

