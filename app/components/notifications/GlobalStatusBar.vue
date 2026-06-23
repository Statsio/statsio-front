<script setup lang="ts">
import { computed } from 'vue'
import { globalStatus } from '@/composables/useGlobalStatusBar'

const status = globalStatus

const barClass = computed(() => {
  const v = status.value?.variant ?? 'info'
  switch (v) {
    case 'error':
      return 'bar-error'
    case 'success':
      return 'bar-success'
    case 'warning':
      return 'bar-warning'
    case 'info':
    default:
      return 'bar-info'
  }
})
</script>

<template>
  <div v-if="status?.visible" :class="['w-full', barClass, 'status-bar']" role="status" aria-live="polite">
    <div class="status-sheen" aria-hidden="true"></div>
    <div class="status-content mx-auto flex max-w-screen-xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-sm font-medium">
      <span>
        <span v-if="status?.title" class="mr-2 font-semibold">{{ status?.title }}</span>
        <span>{{ status?.message }}</span>
      </span>
      <button
        v-if="status?.action"
        type="button"
        class="status-action"
        @click="status.action.onClick"
      >
        {{ status.action.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--status-border);
  background: var(--status-bg);
  box-shadow: 0 18px 56px -46px rgba(15, 23, 42, 0.35);
  color: var(--status-text);
  text-align: center;
}

.status-sheen {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      115deg,
      transparent 0%,
      rgb(255 255 255 / 0.08) 28%,
      rgb(255 255 255 / 0.56) 44%,
      rgb(255 255 255 / 0.9) 50%,
      rgb(255 255 255 / 0.5) 58%,
      transparent 100%
    );
  opacity: 0.82;
  pointer-events: none;
  transform: translateX(-120%);
  animation: statusSheen 4.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.status-bar::after {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 50%, rgb(255 255 255 / 0.8), transparent 34%),
    linear-gradient(90deg, transparent, rgb(255 255 255 / 0.34), transparent);
  content: '';
  opacity: 0.55;
  pointer-events: none;
}

.status-content {
  position: relative;
  z-index: 2;
  text-align: center;
}

.status-action {
  border: 1px solid var(--status-action-border);
  border-radius: 999px;
  background: var(--status-action-bg);
  color: var(--status-action-text);
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  line-height: 1.2;
  padding: 0.2rem 0.6rem;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    opacity 0.16s ease;
}

.status-action:hover {
  background: var(--status-action-hover-bg);
  border-color: var(--status-action-hover-border);
}

.status-action:focus-visible {
  outline: 2px solid var(--status-action-text);
  outline-offset: 3px;
}

@keyframes statusSheen {
  0% {
    transform: translateX(-120%);
  }

  42%,
  100% {
    transform: translateX(120%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .status-sheen {
    animation: none;
    opacity: 0.35;
    transform: none;
  }
}

.bar-info {
  --status-bg: linear-gradient(135deg, color-mix(in srgb, var(--color-primary, #8b5cf6) 7%, white), color-mix(in srgb, var(--color-accent, #3b82f6) 6%, white));
  --status-border: color-mix(in srgb, var(--color-primary, #8b5cf6) 30%, transparent);
  --status-text: #334155;
  --status-action-bg: rgb(255 255 255 / 0.72);
  --status-action-border: color-mix(in srgb, var(--color-primary, #8b5cf6) 30%, transparent);
  --status-action-hover-bg: rgb(255 255 255 / 0.95);
  --status-action-hover-border: color-mix(in srgb, var(--color-primary, #8b5cf6) 45%, transparent);
  --status-action-text: var(--color-primary, #8b5cf6);
}

.bar-error {
  --status-bg: linear-gradient(135deg, color-mix(in srgb, var(--color-error, #e11d48) 7%, white), color-mix(in srgb, var(--color-primary, #8b5cf6) 4%, white));
  --status-border: color-mix(in srgb, var(--color-error, #e11d48) 30%, transparent);
  --status-text: #334155;
  --status-action-bg: rgb(255 255 255 / 0.72);
  --status-action-border: color-mix(in srgb, var(--color-error, #e11d48) 30%, transparent);
  --status-action-hover-bg: rgb(255 255 255 / 0.95);
  --status-action-hover-border: color-mix(in srgb, var(--color-error, #e11d48) 45%, transparent);
  --status-action-text: var(--color-error, #e11d48);
}

.bar-success {
  --status-bg: linear-gradient(135deg, color-mix(in srgb, var(--color-success, #10b981) 8%, white), color-mix(in srgb, var(--color-accent, #3b82f6) 4%, white));
  --status-border: color-mix(in srgb, var(--color-success, #10b981) 30%, transparent);
  --status-text: #334155;
  --status-action-bg: rgb(255 255 255 / 0.72);
  --status-action-border: color-mix(in srgb, var(--color-success, #10b981) 30%, transparent);
  --status-action-hover-bg: rgb(255 255 255 / 0.95);
  --status-action-hover-border: color-mix(in srgb, var(--color-success, #10b981) 45%, transparent);
  --status-action-text: var(--color-success, #10b981);
}

.bar-warning {
  --status-bg: linear-gradient(135deg, color-mix(in srgb, var(--color-warning, #f59e0b) 10%, white), color-mix(in srgb, var(--color-primary, #8b5cf6) 4%, white));
  --status-border: color-mix(in srgb, var(--color-warning, #f59e0b) 30%, transparent);
  --status-text: #334155;
  --status-action-bg: rgb(255 255 255 / 0.72);
  --status-action-border: color-mix(in srgb, var(--color-warning, #f59e0b) 30%, transparent);
  --status-action-hover-bg: rgb(255 255 255 / 0.95);
  --status-action-hover-border: color-mix(in srgb, var(--color-warning, #f59e0b) 45%, transparent);
  --status-action-text: var(--color-warning, #f59e0b);
}
</style>
