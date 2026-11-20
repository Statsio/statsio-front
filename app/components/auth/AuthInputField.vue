<script setup lang="ts">
import { computed, ref, useId } from 'vue'

/**
 * Champ des formulaires d'auth, Bold Outline : contour 2px, ombre décalée,
 * bordure bleue au focus, rouge en erreur. Libellé relié à l'input (for/id),
 * erreur annoncée via aria-describedby. Mot de passe : bouton VOIR / MASQUER.
 */
const props = withDefaults(
  defineProps<{
    label?: string
    type?: string
    placeholder?: string
    autocomplete?: string
    error?: string
    hint?: string
    disabled?: boolean
  }>(),
  { type: 'text', disabled: false },
)

defineSlots<{ 'label-action'?: () => unknown }>()

const modelValue = defineModel<string>({ required: true })

const id = `auth-field-${useId()}`
const showPassword = ref(false)
const isPassword = computed(() => props.type === 'password')
const inputType = computed(() => (isPassword.value && showPassword.value ? 'text' : props.type))
const describedBy = computed(() => {
  const ids = []
  if (props.error) ids.push(`${id}-error`)
  if (props.hint) ids.push(`${id}-hint`)
  return ids.length ? ids.join(' ') : undefined
})
</script>

<template>
  <div class="ds-field">
    <div v-if="label || $slots['label-action']" class="ds-field__top">
      <label v-if="label" :for="id" class="ds-field__label">{{ label }}</label>
      <slot name="label-action" />
    </div>

    <div class="ds-field__box" :class="{ 'is-error': error, 'is-disabled': disabled }">
      <input
        :id="id"
        v-model="modelValue"
        class="ds-field__input"
        :type="inputType"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
      />
      <button
        v-if="isPassword"
        type="button"
        class="ds-field__toggle"
        :aria-pressed="showPassword"
        :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
        @click="showPassword = !showPassword"
      >
        {{ showPassword ? 'Masquer' : 'Voir' }}
      </button>
    </div>

    <p v-if="hint && !error" :id="`${id}-hint`" class="ds-field__hint">{{ hint }}</p>
    <Transition name="ds-field-err">
      <p v-if="error" :id="`${id}-error`" class="ds-field__error">
        <span aria-hidden="true">!</span>{{ error }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.ds-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.ds-field__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.ds-field__label {
  color: var(--ds-text);
  font-size: 14px;
  font-weight: 700;
  user-select: none;
}
.ds-field__box {
  display: flex;
  align-items: center;
  height: 46px;
  border: 2px solid var(--ds-ol);
  border-radius: 3px;
  background: var(--ds-surface);
  box-shadow: 3px 3px 0 var(--ds-sh);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.ds-field__box:focus-within {
  border-color: var(--ds-focus);
  box-shadow:
    3px 3px 0 var(--ds-sh),
    0 0 0 4px color-mix(in srgb, var(--ds-focus) 20%, transparent);
}
.ds-field__box.is-error {
  border-color: #be123c;
  box-shadow: 3px 3px 0 #fda4af;
}
@media (min-width: 1024px) and (max-height: 820px) {
  .ds-field__box {
    height: 42px;
  }
}
.ds-field__box.is-disabled {
  opacity: 0.55;
}
.ds-field__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0 14px;
  border: 0;
  background: transparent;
  outline: none;
  color: var(--ds-text);
  font: 500 15.5px var(--ds-ui);
  color-scheme: inherit;
}
.ds-field__input::placeholder {
  color: var(--ds-faint);
  font-weight: 400;
}
.ds-field__input:disabled {
  cursor: not-allowed;
}
.ds-field__toggle {
  flex: none;
  height: 100%;
  padding: 0 14px;
  border: 0;
  border-left: 2px solid var(--ds-divide);
  background: transparent;
  color: var(--ds-link);
  font: 500 11px/1 var(--ds-num);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
}
.ds-field__toggle:hover {
  background: var(--ds-tint);
}
.ds-field__toggle:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: -4px;
}
.ds-field__hint {
  margin: 0;
  color: var(--ds-faint);
  font: 400 12px/1.45 var(--ds-num);
}
.ds-field__error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #be123c;
  font-size: 13px;
  font-weight: 600;
}
.ds-field__error span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #be123c;
  color: #fff;
  font: 700 11px/1 var(--ds-ui);
}
:root[data-color-scheme='dark'] .ds-field__box.is-error {
  border-color: #fb7185;
  box-shadow: 3px 3px 0 #881337;
}
:root[data-color-scheme='dark'] .ds-field__error {
  color: #fda4af;
}
:root[data-color-scheme='dark'] .ds-field__error span {
  background: #fb7185;
  color: #0f0e14;
}
.ds-field-err-enter-active {
  transition:
    opacity 0.2s,
    transform 0.2s var(--ds-e-glisse);
}
.ds-field-err-enter-from {
  opacity: 0;
  transform: translateY(-3px);
}
</style>
