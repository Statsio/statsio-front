<script setup lang="ts">
/**
 * Titre de la charte (Anybody, chasse variable). Un `<em>` dans le slot prend
 * la couleur d'accent (mots mis en avant : « Que voulez-vous <em>savoir ?</em> »).
 * - `display` : H1 de hero ; `xl` : titre de section ; `lg` : titre de panneau ;
 *   `md` : titre de carte / encart.
 */
withDefaults(
  defineProps<{
    level?: 1 | 2 | 3 | 4
    size?: 'display' | 'xl' | 'lg' | 'md'
  }>(),
  { level: 2, size: 'xl' },
)
</script>

<template>
  <component :is="`h${level}`" class="ds-h" :class="`ds-h--${size}`">
    <slot />
  </component>
</template>

<style scoped>
.ds-h {
  margin: 0;
  color: var(--ds-text);
  font-family: var(--ds-display);
  font-weight: 800;
  text-wrap: balance;
}
.ds-h :deep(em) {
  font-style: normal;
  color: var(--ds-accent);
}
.ds-h--display {
  font-size: clamp(46px, 6.8vw, 96px);
  line-height: 0.9;
  font-stretch: 92%;
  letter-spacing: -0.03em;
}
.ds-h--xl {
  font-size: clamp(32px, 4.4vw, 56px);
  line-height: 0.96;
  font-stretch: 90%;
  letter-spacing: -0.02em;
}
.ds-h--lg {
  font-size: clamp(28px, 3.2vw, 42px);
  line-height: 1;
  font-stretch: 90%;
}
.ds-h--md {
  font-size: clamp(24px, 2.6vw, 32px);
  line-height: 1.04;
  font-stretch: 90%;
}
</style>
