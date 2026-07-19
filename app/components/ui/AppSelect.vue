<script setup lang="ts">
import { computed, nextTick, ref, useAttrs, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'

defineOptions({ inheritAttrs: false })

export type AppSelectOption<T = string> = {
  readonly value: T
  readonly label: string
  readonly disabled?: boolean
}

export type AppSelectGroup<T = string> = {
  readonly label: string
  readonly options: readonly AppSelectOption<T>[]
  readonly collapsible?: boolean
  readonly defaultOpen?: boolean
}

type Primitive = string | number | boolean | null

const props = withDefaults(
  defineProps<{
    modelValue: Primitive | Primitive[]
    options?: readonly AppSelectOption<Exclude<Primitive, null>>[]
    groups?: readonly AppSelectGroup<Exclude<Primitive, null>>[]
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
    teleport?: boolean
  }>(),
  {
    options: () => [],
    groups: undefined,
    placeholder: 'Sélectionner…',
    disabled: false,
    size: 'md',
    ariaLabel: undefined,
    buttonClass: '',
    panelClass: '',
    optionClass: '',
    multiple: false,
    searchable: false,
    searchPlaceholder: 'Rechercher…',
    teleport: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [Primitive | Primitive[]]
  change: [Primitive | Primitive[]]
}>()

const attrs = useAttrs()

const rootEl       = ref<HTMLElement | null>(null)
const buttonEl     = ref<HTMLButtonElement | null>(null)
const listEl       = ref<HTMLDivElement | null>(null)
const searchInputEl = ref<HTMLInputElement | null>(null)

const open        = ref(false)
const activeIndex = ref<number>(-1)
const searchQuery = ref('')

// ── Teleport positioning ──────────────────────────────────────────────────────

const dropStyle = ref<Record<string, string>>({})

async function computeDropStyle() {
  if (!props.teleport || !buttonEl.value) return
  await nextTick()
  const rect = buttonEl.value.getBoundingClientRect()
  dropStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: '9999',
  }
}

// ── Collapsible groups ────────────────────────────────────────────────────────

const groupOpenState = ref<Set<string>>(new Set())

watch(() => props.groups, (groups) => {
  if (!groups) return
  const s = new Set<string>()
  groups.forEach((g) => {
    if (!g.collapsible || g.defaultOpen !== false) s.add(g.label)
  })
  groupOpenState.value = s
}, { immediate: true })

function toggleGroupOpen(label: string) {
  const s = new Set(groupOpenState.value)
  if (s.has(label)) s.delete(label)
  else s.add(label)
  groupOpenState.value = s
}

// ── Flat options for keyboard navigation ──────────────────────────────────────

const flatOptions = computed<readonly AppSelectOption<Exclude<Primitive, null>>[]>(() => {
  if (props.groups) return props.groups.flatMap((g) => g.options)
  return props.options
})

const filteredFlat = computed(() => {
  if (!props.searchable || !searchQuery.value.trim()) return flatOptions.value
  const q = searchQuery.value.toLowerCase().trim()
  return flatOptions.value.filter((o) => o.label.toLowerCase().includes(q))
})

const filteredGroups = computed<readonly AppSelectGroup<Exclude<Primitive, null>>[] | undefined>(() => {
  if (!props.groups) return undefined
  if (!props.searchable || !searchQuery.value.trim()) return props.groups
  const q = searchQuery.value.toLowerCase().trim()
  return props.groups.map((g) => ({ ...g, options: g.options.filter((o) => o.label.toLowerCase().includes(q)) })).filter((g) => g.options.length > 0)
})

// ── Selected state ────────────────────────────────────────────────────────────

const selectedValues = computed(() => {
  if (props.multiple) return Array.isArray(props.modelValue) ? props.modelValue : []
  return props.modelValue != null ? [props.modelValue] : []
})

const selectedLabels = computed(() =>
  selectedValues.value
    .map((val) => flatOptions.value.find((o) => o.value === val)?.label)
    .filter(Boolean),
)

const displayText = computed(() => {
  if (selectedLabels.value.length === 0) return props.placeholder
  if (props.multiple) return selectedLabels.value.join(', ')
  return selectedLabels.value[0] || ''
})

const listboxId = `app-select-${Math.random().toString(16).slice(2)}`

const forwardedAttrs = computed(() => {
  const rest: Record<string, unknown> = { ...(attrs as Record<string, unknown>) }
  delete rest['class']
  delete rest['onChange']
  return rest
})

const sizeClasses = computed(() => props.size === 'sm'
  ? { button: 'min-h-8 rounded-full px-2 text-xs', panel: 'rounded-xl', option: 'rounded-lg px-2 py-1.5 text-xs', search: 'rounded-lg px-2 py-1.5 text-xs' }
  : { button: 'min-h-10 rounded-xl px-3 text-sm', panel: 'rounded-2xl', option: 'rounded-xl px-3 py-2 text-sm', search: 'rounded-xl px-3 py-2 text-sm' },
)

// ── Open / close ──────────────────────────────────────────────────────────────

function firstEnabledIndex() { return filteredFlat.value.findIndex((o) => !o.disabled) }

function clampToEnabled(start: number, dir: 1 | -1) {
  const len = filteredFlat.value.length
  if (!len) return -1
  let i = start
  for (let step = 0; step < len; step++) {
    if (!filteredFlat.value[i]?.disabled) return i
    i = (i + dir + len) % len
  }
  return -1
}

async function setOpen(next: boolean) {
  if (props.disabled) return
  open.value = next
  if (next) {
    searchQuery.value = ''
    activeIndex.value = clampToEnabled(Math.max(0, firstEnabledIndex()), 1)
    await nextTick()
    await computeDropStyle()
    if (props.searchable) searchInputEl.value?.focus()
    else listEl.value?.focus()
    scrollActiveIntoView()
  } else {
    activeIndex.value = -1
    searchQuery.value = ''
    await nextTick()
    buttonEl.value?.focus()
  }
}

function isSelected(value: Primitive): boolean { return selectedValues.value.includes(value) }

function toggleValue(value: Primitive) {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const idx = current.indexOf(value)
    if (idx >= 0) current.splice(idx, 1)
    else current.push(value)
    emit('update:modelValue', current)
    emit('change', current)
  } else {
    emit('update:modelValue', value)
    emit('change', value)
    void setOpen(false)
  }
}

function selectIndex(i: number) {
  const opt = filteredFlat.value[i]
  if (!opt || opt.disabled) return
  toggleValue(opt.value)
}

function scrollActiveIntoView() {
  const el = listEl.value
  if (!el) return
  el.querySelector<HTMLElement>(`[data-idx="${activeIndex.value}"]`)?.scrollIntoView({ block: 'nearest' })
}

function onTriggerKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); void setOpen(true) }
}

function onListKeydown(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === 'Escape') { e.preventDefault(); void setOpen(false); return }
  if (e.key === 'Enter') { e.preventDefault(); if (activeIndex.value >= 0) selectIndex(activeIndex.value); return }
  const len = filteredFlat.value.length
  if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex.value = clampToEnabled((activeIndex.value + 1) % len, 1); scrollActiveIntoView(); return }
  if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex.value = clampToEnabled((activeIndex.value - 1 + len) % len, -1); scrollActiveIntoView(); return }
  if (e.key === 'Home') { e.preventDefault(); activeIndex.value = clampToEnabled(0, 1); scrollActiveIntoView(); return }
  if (e.key === 'End') { e.preventDefault(); activeIndex.value = clampToEnabled(Math.max(0, len - 1), -1); scrollActiveIntoView(); return }
}

function onSearchKeydown(e: KeyboardEvent) {
  if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); listEl.value?.focus(); onListKeydown(e) }
  else if (e.key === 'Escape') { e.preventDefault(); void setOpen(false) }
  else if (e.key === 'Enter') { e.preventDefault(); if (activeIndex.value >= 0) selectIndex(activeIndex.value) }
}

function removeValue(value: Primitive, e: Event) {
  e.stopPropagation()
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const idx = current.indexOf(value)
    if (idx >= 0) { current.splice(idx, 1); emit('update:modelValue', current); emit('change', current) }
  }
}

watch(searchQuery, () => { activeIndex.value = clampToEnabled(0, 1) })

onClickOutside(rootEl, () => { if (open.value && !props.teleport) void setOpen(false) })

// For teleport mode, close on outside click via document listener
function onDocMousedown(e: MouseEvent) {
  if (!props.teleport || !open.value) return
  const target = e.target as Node
  if (buttonEl.value?.contains(target)) return
  const panel = document.getElementById(listboxId + '-panel')
  if (panel?.contains(target)) return
  void setOpen(false)
}
import { onMounted, onBeforeUnmount } from 'vue'
onMounted(() => document.addEventListener('mousedown', onDocMousedown))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocMousedown))
</script>

<template>
  <div ref="rootEl" class="relative" :class="(attrs.class as string | undefined) ?? ''">
    <!-- Trigger -->
    <button
      ref="buttonEl"
      type="button"
      class="flex w-full items-center justify-between gap-2 border border-slate-200 bg-white text-left text-slate-900 outline-none transition
             hover:border-[var(--color-secondary)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10
             disabled:pointer-events-none disabled:opacity-60"
      :class="[sizeClasses.button, buttonClass, open ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/10' : '']"
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
        <span v-if="multiple && selectedLabels.length > 0" class="flex flex-wrap gap-1.5">
          <span
            v-for="(label, idx) in selectedLabels"
            :key="idx"
            class="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--color-primary)]"
          >
            {{ label }}
            <button
              type="button"
              class="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-[var(--color-primary)]/20"
              @click="removeValue(selectedValues[idx], $event)"
            >
              <svg class="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </span>
        </span>
        <span v-else class="truncate font-medium" :class="selectedLabels.length === 0 ? 'text-slate-400 font-normal' : 'text-slate-700'">
          {{ displayText }}
        </span>
      </span>
      <svg
        class="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-150"
        :class="open ? 'rotate-180' : ''"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
      >
        <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <!-- Dropdown — teleported or inline -->
    <Teleport v-if="teleport" to="body">
      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="opacity-0 scale-95 -translate-y-1"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 -translate-y-1"
      >
        <div
          v-if="open"
          :id="listboxId + '-panel'"
          :style="dropStyle"
          class="overflow-hidden border border-[var(--color-secondary)] bg-white shadow-xl shadow-[var(--color-primary)]/10 origin-top"
          :class="[sizeClasses.panel, panelClass]"
        >
          <template v-if="searchable">
            <div class="border-b border-slate-100 p-2">
              <div class="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 focus-within:border-[var(--color-primary)]/30 focus-within:bg-white">
                <svg class="h-3.5 w-3.5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 21l-4.35-4.35M19 10.5a8.5 8.5 0 11-17 0 8.5 8.5 0 0117 0z" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <input ref="searchInputEl" v-model="searchQuery" type="text" class="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none" :placeholder="searchPlaceholder" @keydown="onSearchKeydown" />
              </div>
            </div>
          </template>
          <div :id="listboxId" ref="listEl" class="max-h-72 overflow-y-auto p-1 outline-none" role="listbox" :aria-multiselectable="multiple ? 'true' : 'false'" tabindex="-1" @keydown="onListKeydown">
            <template v-if="filteredGroups">
              <div v-for="group in filteredGroups" :key="group.label">
                <button v-if="group.collapsible" class="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 hover:bg-slate-100 transition-colors sticky top-0 z-10" @click="toggleGroupOpen(group.label)">
                  <svg class="w-2.5 h-2.5 text-slate-400 transition-transform duration-150 shrink-0" :class="groupOpenState.has(group.label) ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                  <span class="truncate">{{ group.label }}</span>
                  <span class="ml-auto font-normal text-slate-400 normal-case tracking-normal">{{ group.options.length }}</span>
                </button>
                <div v-else class="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 sticky top-0 z-10">
                  <span class="truncate">{{ group.label }}</span>
                  <span class="ml-auto font-normal text-slate-400 normal-case tracking-normal">{{ group.options.length }}</span>
                </div>
                <template v-if="!group.collapsible || groupOpenState.has(group.label)">
                  <button
                    v-for="opt in group.options"
                    :key="String(opt.value)"
                    type="button" role="option"
                    class="flex w-full items-center justify-between gap-2 pl-5 pr-3 py-1.5 text-left transition font-medium"
                    :class="[optionClass, isSelected(opt.value) ? 'bg-[var(--color-primary)]/8 text-[var(--color-primary)] font-semibold' : 'text-slate-700 hover:bg-[var(--color-primary)]/6 hover:text-[var(--color-primary)]']"
                    :aria-selected="isSelected(opt.value) ? 'true' : 'false'"
                    :data-idx="flatOptions.indexOf(opt)"
                    @click="toggleValue(opt.value)"
                  >
                    <span class="truncate font-mono text-[11px]">{{ opt.label }}</span>
                    <svg v-if="isSelected(opt.value)" class="h-3 w-3 shrink-0 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  </button>
                </template>
              </div>
            </template>
            <template v-else>
              <div v-if="filteredFlat.length === 0" class="px-3 py-8 text-center text-sm text-slate-400">Aucun résultat</div>
              <button
                v-for="(opt, i) in filteredFlat"
                :key="String(opt.value)"
                type="button" role="option"
                class="flex w-full items-center justify-between gap-3 text-left transition font-medium"
                :class="[sizeClasses.option, optionClass, opt.disabled ? 'cursor-not-allowed text-slate-300' : 'text-slate-700 hover:bg-[var(--color-primary)]/6 hover:text-[var(--color-primary)]', i === activeIndex ? 'bg-[var(--color-primary)]/6 text-[var(--color-primary)]' : '', isSelected(opt.value) ? 'bg-[var(--color-primary)]/8 text-[var(--color-primary)] font-semibold' : '']"
                :aria-selected="isSelected(opt.value) ? 'true' : 'false'"
                :disabled="opt.disabled"
                :data-idx="i"
                @mousemove="activeIndex = i"
                @click="selectIndex(i)"
              >
                <span class="flex min-w-0 flex-1 items-center gap-2">
                  <span v-if="multiple" class="flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition" :class="isSelected(opt.value) ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-slate-300'">
                    <svg v-if="isSelected(opt.value)" class="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  </span>
                  <span class="truncate">{{ opt.label }}</span>
                </span>
                <svg v-if="!multiple && isSelected(opt.value)" class="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </button>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Inline dropdown (no teleport) -->
    <Transition
      v-else
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="open"
        class="absolute z-[9999] mt-1 w-full overflow-hidden border border-[var(--color-secondary)] bg-white shadow-xl shadow-[var(--color-primary)]/10 origin-top"
        :class="[sizeClasses.panel, panelClass]"
        role="presentation"
      >
        <div v-if="searchable" class="border-b border-slate-100 p-2">
          <div class="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 focus-within:border-[var(--color-primary)]/30 focus-within:bg-white">
            <svg class="h-3.5 w-3.5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 21l-4.35-4.35M19 10.5a8.5 8.5 0 11-17 0 8.5 8.5 0 0117 0z" stroke-linecap="round" stroke-linejoin="round" /></svg>
            <input ref="searchInputEl" v-model="searchQuery" type="text" class="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none" :placeholder="searchPlaceholder" @keydown="onSearchKeydown" />
          </div>
        </div>
        <div :id="listboxId" ref="listEl" class="max-h-72 overflow-y-auto p-1 outline-none" role="listbox" :aria-multiselectable="multiple ? 'true' : 'false'" tabindex="-1" @keydown="onListKeydown">
          <template v-if="filteredGroups">
            <div v-for="group in filteredGroups" :key="group.label">
              <button v-if="group.collapsible" class="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 hover:bg-slate-100 transition-colors sticky top-0 z-10" @click="toggleGroupOpen(group.label)">
                <svg class="w-2.5 h-2.5 text-slate-400 transition-transform duration-150 shrink-0" :class="groupOpenState.has(group.label) ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                <span class="truncate">{{ group.label }}</span>
                <span class="ml-auto font-normal text-slate-400 normal-case tracking-normal">{{ group.options.length }}</span>
              </button>
              <div v-else class="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 sticky top-0 z-10">
                <span class="truncate">{{ group.label }}</span>
                <span class="ml-auto font-normal text-slate-400 normal-case tracking-normal">{{ group.options.length }}</span>
              </div>
              <template v-if="!group.collapsible || groupOpenState.has(group.label)">
                <button
                  v-for="(opt, i) in group.options"
                  :key="String(opt.value)"
                  type="button" role="option"
                  class="flex w-full items-center justify-between gap-2 pl-5 pr-3 py-1.5 text-left transition font-medium"
                  :class="[optionClass, isSelected(opt.value) ? 'bg-[var(--color-primary)]/8 text-[var(--color-primary)] font-semibold' : 'text-slate-700 hover:bg-[var(--color-primary)]/6 hover:text-[var(--color-primary)]']"
                  :aria-selected="isSelected(opt.value) ? 'true' : 'false'"
                  :data-idx="flatOptions.indexOf(opt)"
                  @click="toggleValue(opt.value)"
                >
                  <span class="truncate font-mono text-[11px]">{{ opt.label }}</span>
                  <svg v-if="isSelected(opt.value)" class="h-3 w-3 shrink-0 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </button>
              </template>
            </div>
          </template>
          <template v-else>
            <div v-if="filteredFlat.length === 0" class="px-3 py-8 text-center text-sm text-slate-400">Aucun résultat</div>
            <button
              v-for="(opt, i) in filteredFlat"
              :key="String(opt.value)"
              type="button" role="option"
              class="flex w-full items-center justify-between gap-3 text-left transition font-medium"
              :class="[sizeClasses.option, optionClass, opt.disabled ? 'cursor-not-allowed text-slate-300' : 'text-slate-700 hover:bg-[var(--color-primary)]/6 hover:text-[var(--color-primary)]', i === activeIndex ? 'bg-[var(--color-primary)]/6 text-[var(--color-primary)]' : '', isSelected(opt.value) ? 'bg-[var(--color-primary)]/8 text-[var(--color-primary)] font-semibold' : '']"
              :aria-selected="isSelected(opt.value) ? 'true' : 'false'"
              :disabled="opt.disabled"
              :data-idx="i"
              @mousemove="activeIndex = i"
              @click="selectIndex(i)"
            >
              <span class="flex min-w-0 flex-1 items-center gap-2">
                <span v-if="multiple" class="flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition" :class="isSelected(opt.value) ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-slate-300'">
                  <svg v-if="isSelected(opt.value)" class="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </span>
                <span class="truncate">{{ opt.label }}</span>
              </span>
              <svg v-if="!multiple && isSelected(opt.value)" class="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </button>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>
