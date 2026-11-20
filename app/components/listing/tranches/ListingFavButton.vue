<script setup lang="ts">
/** Bouton « favori » (signet) d'une carte d'article. */
defineProps<{ active: boolean; title: string }>()
const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    class="art-fav"
    :aria-pressed="active"
    :aria-label="`${active ? 'Retirer des favoris' : 'Ajouter aux favoris'} : ${title}`"
    @click.prevent.stop="emit('toggle')"
  >
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3.5 1.5h9v13L8 11l-4.5 3.5z"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>

<style scoped>
.art-fav {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 2px solid var(--ds-divide);
  border-radius: 3px;
  background: var(--ds-surface);
  color: var(--ds-link);
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.art-fav path {
  fill: none;
}
.art-fav:hover {
  border-color: var(--ds-ol);
}
.art-fav[aria-pressed='true'] {
  border-color: var(--ds-ol);
  background: var(--ds-tint);
}
.art-fav[aria-pressed='true'] path {
  fill: currentColor;
}
.art-fav:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 2px;
}
</style>
