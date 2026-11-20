<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'

/**
 * Champ de saisie Bold Outline. `size="lg"` = grande boîte de recherche (64px,
 * ombre bleue) ; `md` = champ standard (44px, ombre violette).
 * Les attributs (type, placeholder, aria-*, role, écouteurs…) sont transmis à
 * l'<input> ; `class` et `style` restent sur le conteneur. Slots `leading` (icône) et `trailing` (kbd, bouton).
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{ size?: 'md' | 'lg' }>(), { size: 'md' })

const model = defineModel<string>({ default: '' })
const attrs = useAttrs()
/** `class` / `style` habillent le conteneur ; tout le reste va à l'<input>. */
const inputAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style')),
)
const wrapperStyle = computed(() => attrs.style as string | undefined)
const input = ref<HTMLInputElement | null>(null)

defineExpose({
  focus: () => input.value?.focus(),
  el: input,
})
</script>

<template>
  <div class="ds-input" :class="[`ds-input--${size}`, attrs.class]" :style="wrapperStyle">
    <span v-if="$slots.leading" class="ds-input__leading" aria-hidden="true"><slot name="leading" /></span>
    <input ref="input" v-model="model" class="ds-input__field" v-bind="inputAttrs" />
    <slot name="trailing" />
  </div>
</template>

<style scoped>
.ds-input {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  height: 44px;
  padding: 0 12px;
  border: 2px solid var(--ds-ol);
  border-radius: 3px;
  background: var(--ds-surface);
  color: var(--ds-text);
  box-shadow: 3px 3px 0 var(--ds-sh);
}
.ds-input:focus-within {
  border-color: var(--ds-focus);
}
.ds-input__leading {
  display: inline-flex;
  flex: none;
  color: var(--ds-link);
}
.ds-input__field {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  background: transparent;
  outline: none;
  color: inherit;
  font: 500 15px var(--ds-ui);
}
.ds-input__field::placeholder {
  color: var(--ds-faint);
  font-weight: 400;
}
.ds-input__field::-webkit-search-cancel-button {
  cursor: pointer;
}

.ds-input--lg {
  height: 64px;
  gap: 12px;
  padding: 0 8px 0 18px;
  border-radius: 4px;
  box-shadow: 6px 6px 0 var(--ds-sh2);
}
.ds-input--lg:focus-within {
  border-color: var(--ds-ol);
  box-shadow:
    6px 6px 0 var(--ds-sh2),
    0 0 0 4px color-mix(in srgb, var(--ds-violet-500) 22%, transparent);
}
.ds-input--lg .ds-input__field {
  font-size: 18px;
}
@media (max-width: 520px) {
  .ds-input--lg {
    height: 58px;
  }
  .ds-input--lg .ds-input__field {
    font-size: 16px;
  }
}
</style>
