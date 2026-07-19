<script setup lang="ts">
withDefaults(
  defineProps<{
    message: string
    variant?: 'error' | 'success'
  }>(),
  { variant: 'error' },
)
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-1 scale-[0.99]"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="message"
      class="flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm"
      :class="
        variant === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-rose-200 bg-rose-50 text-rose-700'
      "
    >
      <svg
        v-if="variant === 'success'"
        xmlns="http://www.w3.org/2000/svg"
        class="mt-0.5 h-4 w-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75l2.25 2.25 4.5-4.5m5.25 2.25a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        class="mt-0.5 h-4 w-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <span>{{ message }}</span>
    </div>
  </Transition>
</template>
