<script setup lang="ts">
import { ref, watch } from 'vue'
import statsioMark from '@/assets/brand/statsio-white.svg'

/**
 * Image de contenu avec visuel de substitution unifié.
 *
 * Quand aucune source n'est fournie (l'auteur n'a pas mis d'image) ou que le
 * chargement échoue, on affiche un fond gris dégradé avec le logo Statsio en
 * blanc — même traitement partout (cartes, hero, sommaires, recherche…).
 *
 * Le composant remplit son conteneur : c'est l'appelant qui gère la taille, le
 * positionnement (`absolute inset-0`…) et l'arrondi via `class`.
 */
const props = withDefaults(
  defineProps<{
    src?: string | null
    alt?: string
    /** Classe appliquée au logo de substitution (taille custom, opacité…). */
    markClass?: string
  }>(),
  { src: null, alt: '', markClass: '' },
)

defineOptions({ inheritAttrs: false })

const failed = ref(false)
watch(
  () => props.src,
  () => {
    failed.value = false
  },
)
</script>

<template>
  <img
    v-if="src && !failed"
    v-bind="$attrs"
    :src="src"
    :alt="alt"
    class="h-full w-full object-cover"
    @error="failed = true"
  />
  <div
    v-else
    v-bind="$attrs"
    role="img"
    :aria-label="alt || 'Statsio'"
    class="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300"
  >
    <img
      :src="statsioMark"
      alt=""
      aria-hidden="true"
      class="w-1/3 min-w-[26px] max-w-[64px] opacity-95 drop-shadow-[0_1px_2px_rgba(15,23,42,0.12)]"
      :class="markClass"
    />
  </div>
</template>
