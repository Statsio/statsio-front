<script setup lang="ts">
/** Message d'erreur / de succès des formulaires d'auth, Bold Outline. Annoncé aux lecteurs d'écran. */
withDefaults(
  defineProps<{
    message: string
    variant?: 'error' | 'success'
  }>(),
  { variant: 'error' },
)
</script>

<template>
  <Transition name="ds-alert">
    <div
      v-if="message"
      class="ds-alert"
      :class="`ds-alert--${variant}`"
      :role="variant === 'error' ? 'alert' : 'status'"
    >
      <span class="ds-alert__ico" aria-hidden="true">{{ variant === 'success' ? '✓' : '!' }}</span>
      <span>{{ message }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.ds-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 2px solid;
  border-radius: 3px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.45;
}
.ds-alert__ico {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-top: 1px;
  border-radius: 50%;
  color: #fff;
  font: 700 12px/1 var(--ds-ui);
}
.ds-alert--error {
  border-color: #be123c;
  background: #fff1f2;
  color: #9f1239;
  box-shadow: 3px 3px 0 #fda4af;
}
.ds-alert--error .ds-alert__ico {
  background: #be123c;
}
.ds-alert--success {
  border-color: #047857;
  background: #ecfdf5;
  color: #065f46;
  box-shadow: 3px 3px 0 #6ee7b7;
}
.ds-alert--success .ds-alert__ico {
  background: #047857;
}
:root[data-color-scheme='dark'] .ds-alert--error {
  border-color: #fb7185;
  background: #2a1011;
  color: #fecdd3;
  box-shadow: 3px 3px 0 #881337;
}
:root[data-color-scheme='dark'] .ds-alert--success {
  border-color: #34d399;
  background: #052e22;
  color: #a7f3d0;
  box-shadow: 3px 3px 0 #065f46;
}
.ds-alert-enter-active {
  transition:
    opacity 0.2s,
    transform 0.2s var(--ds-e-glisse);
}
.ds-alert-leave-active {
  transition: opacity 0.15s;
}
.ds-alert-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.ds-alert-leave-to {
  opacity: 0;
}
</style>
