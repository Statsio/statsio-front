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
    'border-emerald-500/30 bg-white/95 text-slate-900 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.15)] backdrop-blur-md',
  error:
    'border-rose-500/30 bg-white/95 text-slate-900 shadow-[0_24px_60px_-15px_rgba(244,63,94,0.15)] backdrop-blur-md',
  warning:
    'border-amber-500/30 bg-white/95 text-slate-900 shadow-[0_24px_60px_-15px_rgba(245,158,11,0.15)] backdrop-blur-md',
  info:
    'border-primary/30 bg-white/95 text-slate-900 shadow-[0_24px_60px_-15px_rgba(59,130,246,0.15)] backdrop-blur-md',
}

const iconTone: Record<AppNotificationVariant, string> = {
  success: 'text-emerald-500',
  error: 'text-rose-500',
  warning: 'text-amber-500',
  info: 'text-primary',
}

const itemRole = (variant: AppNotificationVariant) =>
  variant === 'error' ? 'alert' : 'status'
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed right-0 top-0 z-[200] flex flex-col items-stretch gap-3 p-4 sm:max-w-md sm:items-end"
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
            'pointer-events-auto flex w-full gap-3 rounded-[1.5rem] border p-4 sm:max-w-sm',
            variantClasses[item.variant],
          ]"
          :aria-atomic="true"
        >
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 shadow-sm"
          >
            <component
              :is="variantIcon[item.variant]"
              class="size-6"
              :class="iconTone[item.variant]"
              aria-hidden="true"
            />
          </div>
          <div class="min-w-0 flex-1 pt-1">
            <p v-if="item.title" class="font-bold leading-tight text-slate-950">
              {{ item.title }}
            </p>
            <p
              class="text-sm font-medium leading-relaxed text-slate-600"
              :class="item.title ? 'mt-1' : ''"
            >
              {{ item.message }}
            </p>
          </div>
          <button
            type="button"
            class="flex size-8 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            aria-label="Fermer la notification"
            @click="store.dismiss(item.id)"
          >
            <XMarkIcon class="size-4" aria-hidden="true" />
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
    opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.app-notify-enter-from {
  opacity: 0;
  transform: translateX(2rem) scale(0.95);
}

.app-notify-leave-to {
  opacity: 0;
  transform: translateX(1rem) scale(0.95);
}
</style>
