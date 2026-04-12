<script setup lang="ts">
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/solid'
import { storeToRefs } from 'pinia'
import { useAppNotificationsStore } from '@/stores/app-notifications'
import type { AppNotificationVariant } from '@/types/app-notification'

const store = useAppNotificationsStore()
const { items } = storeToRefs(store)

const variantIcon = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
} as const

const variantClasses: Record<AppNotificationVariant, string> = {
  success:
    'border-l-emerald-500 bg-[var(--app-surface)] text-[var(--app-text-default)] shadow-[0_18px_40px_rgba(15,23,42,0.1)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.35)]',
  error:
    'border-l-red-500 bg-[var(--app-surface)] text-[var(--app-text-default)] shadow-[0_18px_40px_rgba(15,23,42,0.1)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.35)]',
  warning:
    'border-l-amber-500 bg-[var(--app-surface)] text-[var(--app-text-default)] shadow-[0_18px_40px_rgba(15,23,42,0.1)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.35)]',
  info:
    'border-l-[var(--color-accent)] bg-[var(--app-surface)] text-[var(--app-text-default)] shadow-[0_18px_40px_rgba(15,23,42,0.1)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.35)]',
}

const iconTone: Record<AppNotificationVariant, string> = {
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-[var(--color-accent)]',
}

const itemRole = (variant: AppNotificationVariant) =>
  variant === 'error' ? 'alert' : 'status'
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex flex-col items-stretch gap-3 p-4 sm:inset-x-auto sm:right-0 sm:top-auto sm:bottom-0 sm:max-w-md sm:items-end"
      aria-label="Notifications temporaires"
      role="region"
    >
      <TransitionGroup
        name="app-notify"
        tag="div"
        class="relative flex w-full flex-col gap-3 sm:items-end"
      >
        <article
          v-for="item in items"
          :key="item.id"
          :role="itemRole(item.variant)"
          :class="[
            'pointer-events-auto flex w-full gap-3 rounded-2xl border border-[var(--app-border)] border-l-4 p-4 sm:max-w-md',
            variantClasses[item.variant],
          ]"
          :aria-atomic="true"
        >
          <component
            :is="variantIcon[item.variant]"
            class="mt-0.5 size-6 shrink-0"
            :class="iconTone[item.variant]"
            aria-hidden="true"
          />
          <div class="min-w-0 flex-1 pt-0.5">
            <p
              v-if="item.title"
              class="font-semibold leading-tight text-[var(--app-text-strong)]"
            >
              {{ item.title }}
            </p>
            <p
              class="text-sm leading-relaxed text-[var(--app-text-default)]"
              :class="item.title ? 'mt-1' : ''"
            >
              {{ item.message }}
            </p>
          </div>
          <button
            type="button"
            class="flex size-9 shrink-0 items-center justify-center rounded-xl text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            aria-label="Fermer la notification"
            @click="store.dismiss(item.id)"
          >
            <XMarkIcon class="size-5" aria-hidden="true" />
          </button>
        </article>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.app-notify-move,
.app-notify-enter-active,
.app-notify-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.app-notify-enter-from {
  opacity: 0;
  transform: translateY(0.75rem) scale(0.98);
}

.app-notify-leave-to {
  opacity: 0;
  transform: translateY(0.35rem) scale(0.98);
}
</style>
