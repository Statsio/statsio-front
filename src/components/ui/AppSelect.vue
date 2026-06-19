<script setup lang="ts">
import { computed, nextTick, ref, useAttrs, watch } from 'vue'
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
    modelValue: Primitive | Primitive[]
    options: readonly AppSelectOption<Exclude<Primitive, null>>[]
    placeholder?: string
    disabled?: boolean
    size?: 'sm' | 'md'
    ariaLabel?: string
    buttonClass?: string
    panelClass?: string
    optionClass?: string
    multiple?: boolean
    searchable?: boolean
    searchPlaceholder?: string
  }>(),
  {
    placeholder: 'Sélectionner…',
    disabled: false,
    size: 'md',
    ariaLabel: undefined,
    buttonClass: '',
    panelClass: '',
    optionClass: '',
    multiple: false,
    searchable: false,
    searchPlaceholder: 'Rechercher...',
  },
)

const emit = defineEmits<{
  'update:modelValue': [Primitive | Primitive[]]
  change: [Primitive | Primitive[]]
}>()

const attrs = useAttrs()

const rootEl = ref<HTMLElement | null>(null)
const buttonEl = ref<HTMLButtonElement | null>(null)
const listEl = ref<HTMLDivElement | null>(null)
const searchInputEl = ref<HTMLInputElement | null>(null)

const open = ref(false)
const activeIndex = ref<number>(-1)
const searchQuery = ref('')

const selectedValues = computed(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) ? props.modelValue : []
  }
  return props.modelValue != null ? [props.modelValue] : []
})

const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value.trim()) {
    return props.options
  }

  const query = searchQuery.value.toLowerCase().trim()
  return props.options.filter(opt =>
    opt.label.toLowerCase().includes(query)
  )
})

const selectedLabels = computed(() => {
  return selectedValues.value
    .map(val => props.options.find(o => o.value === val)?.label)
    .filter(Boolean)
})

const displayText = computed(() => {
  if (selectedLabels.value.length === 0) {
    return props.placeholder
  }
  if (props.multiple) {
    return selectedLabels.value.join(', ')
  }
  return selectedLabels.value[0] || ''
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
        search: 'rounded-lg px-2 py-1.5 text-xs',
      }
    : {
        button: 'min-h-12 rounded-[1.25rem] px-4 text-sm',
        panel: 'rounded-[1.25rem]',
        option: 'rounded-[1rem] px-3 py-2 text-sm',
        search: 'rounded-[1rem] px-3 py-2 text-sm',
      }
})

function firstEnabledIndex() {
  return filteredOptions.value.findIndex((o) => !o.disabled)
}

function clampToEnabled(start: number, dir: 1 | -1) {
  const len = filteredOptions.value.length
  if (!len) return -1
  let i = start
  for (let step = 0; step < len; step++) {
    const opt = filteredOptions.value[i]
    if (opt && !opt.disabled) return i
    i = (i + dir + len) % len
  }
  return -1
}

async function setOpen(next: boolean) {
  if (props.disabled) return
  open.value = next
  if (next) {
    searchQuery.value = ''
    const seed = firstEnabledIndex()
    activeIndex.value = clampToEnabled(Math.max(0, seed), 1)
    await nextTick()
    if (props.searchable) {
      searchInputEl.value?.focus()
    } else {
      listEl.value?.focus()
    }
    scrollActiveIntoView()
  } else {
    activeIndex.value = -1
    searchQuery.value = ''
    await nextTick()
    buttonEl.value?.focus()
  }
}

function isSelected(value: Primitive): boolean {
  return selectedValues.value.includes(value)
}

function toggleValue(value: Primitive) {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const index = current.indexOf(value)
    if (index >= 0) {
      current.splice(index, 1)
    } else {
      current.push(value)
    }
    emit('update:modelValue', current)
    emit('change', current)
  } else {
    emit('update:modelValue', value)
    emit('change', value)
    void setOpen(false)
  }
}

function selectIndex(i: number) {
  const opt = filteredOptions.value[i]
  if (!opt || opt.disabled) return
  toggleValue(opt.value)
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
    const next = clampToEnabled((activeIndex.value + 1 + filteredOptions.value.length) % filteredOptions.value.length, 1)
    activeIndex.value = next
    scrollActiveIntoView()
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    const prev = clampToEnabled((activeIndex.value - 1 + filteredOptions.value.length) % filteredOptions.value.length, -1)
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
    activeIndex.value = clampToEnabled(Math.max(0, filteredOptions.value.length - 1), -1)
    scrollActiveIntoView()
    return
  }
}

function onSearchKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    listEl.value?.focus()
    onListKeydown(e)
  } else if (e.key === 'Escape') {
    e.preventDefault()
    void setOpen(false)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (activeIndex.value >= 0) {
      selectIndex(activeIndex.value)
    }
  }
}

function removeValue(value: Primitive, e: Event) {
  e.stopPropagation()
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const index = current.indexOf(value)
    if (index >= 0) {
      current.splice(index, 1)
      emit('update:modelValue', current)
      emit('change', current)
    }
  }
}

watch(searchQuery, () => {
  activeIndex.value = clampToEnabled(0, 1)
})

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
      <span class="min-w-0 flex-1">
        <span
          v-if="multiple && selectedLabels.length > 0"
          class="flex flex-wrap gap-1.5"
        >
          <span
            v-for="(label, idx) in selectedLabels"
            :key="idx"
            class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
          >
            {{ label }}
            <button
              type="button"
              class="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-primary/20"
              @click="removeValue(selectedValues[idx], $event)"
            >
              <svg class="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </span>
        </span>
        <span
          v-else
          class="truncate"
          :class="selectedLabels.length === 0 ? 'text-slate-400' : ''"
        >
          {{ displayText }}
        </span>
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
      <div v-if="searchable" class="border-b border-slate-200 p-2">
        <div class="flex items-center gap-2 rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-primary/30 focus-within:bg-white">
          <svg class="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 21l-4.35-4.35M19 10.5a8.5 8.5 0 11-17 0 8.5 8.5 0 0117 0z" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <input
            ref="searchInputEl"
            v-model="searchQuery"
            type="text"
            class="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            :placeholder="searchPlaceholder"
            @keydown="onSearchKeydown"
          />
        </div>
      </div>

      <div
        :id="listboxId"
        ref="listEl"
        class="max-h-72 overflow-y-auto p-1 outline-none"
        role="listbox"
        :aria-multiselectable="multiple ? 'true' : 'false'"
        tabindex="-1"
        @keydown="onListKeydown"
      >
        <div
          v-if="filteredOptions.length === 0"
          class="px-3 py-8 text-center text-sm text-slate-400"
        >
          Aucun résultat trouvé
        </div>
        <button
          v-for="(opt, i) in filteredOptions"
          :key="String(opt.value)"
          type="button"
          role="option"
          class="flex w-full items-center justify-between gap-3 text-left transition"
          :class="[
            sizeClasses.option,
            optionClass,
            opt.disabled ? 'cursor-not-allowed text-slate-300' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
            i === activeIndex ? 'bg-slate-50 text-slate-900' : '',
            isSelected(opt.value) ? 'font-semibold' : 'font-medium',
          ]"
          :aria-selected="isSelected(opt.value) ? 'true' : 'false'"
          :disabled="opt.disabled"
          :data-idx="i"
          @mousemove="activeIndex = i"
          @click="selectIndex(i)"
        >
          <span class="flex min-w-0 flex-1 items-center gap-2">
            <span
              v-if="multiple"
              class="flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition"
              :class="isSelected(opt.value) ? 'border-primary bg-primary' : 'border-slate-300'"
            >
              <svg
                v-if="isSelected(opt.value)"
                class="h-3 w-3 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
              >
                <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span class="truncate">{{ opt.label }}</span>
          </span>
          <svg
            v-if="!multiple && isSelected(opt.value)"
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
