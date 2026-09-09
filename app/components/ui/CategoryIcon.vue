<script setup lang="ts">
import { computed } from 'vue'
import { resolveCategoryIconComponent } from '@/lib/category-icons'

/**
 * Icône d'une catégorie, avec repli sur une pastille de couleur quand aucune
 * icône n'est associée. Remplace les `<span class="rounded-full">` colorés
 * affichés à gauche des noms de catégories (mégamenu, filtres de catalogue…).
 */
const props = withDefaults(
  defineProps<{
    /** Slug ou libellé de la catégorie — résolu via useCategoryIcons. */
    category?: string | null
    /** Nom d'icône explicite (prioritaire sur `category`). */
    iconName?: string | null
    /** Couleur de l'icône et de la pastille de repli. */
    color?: string
    /** Taille de l'icône en pixels. */
    size?: number
    /** Taille de la pastille de repli en pixels. */
    dotSize?: number
    /** Rendu quand aucune icône n'est associée : pastille de couleur ou rien. */
    fallback?: 'dot' | 'none'
  }>(),
  { size: 14, dotSize: 6, color: 'currentColor', fallback: 'dot' },
)

const { ensureCategoryIcons, categoryIconName } = useCategoryIcons()
ensureCategoryIcons()

const resolvedName = computed(() => props.iconName ?? categoryIconName(props.category))
const iconComponent = computed(() => resolveCategoryIconComponent(resolvedName.value))
</script>

<template>
  <component
    :is="iconComponent"
    v-if="iconComponent"
    class="shrink-0"
    :style="{ width: `${size}px`, height: `${size}px`, color }"
    aria-hidden="true"
  />
  <span
    v-else-if="fallback === 'dot'"
    class="shrink-0 rounded-full"
    :style="{ width: `${dotSize}px`, height: `${dotSize}px`, background: color }"
    aria-hidden="true"
  />
</template>
