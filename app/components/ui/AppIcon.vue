<script setup lang="ts">
interface Props {
  /** Nom de l'icône emoji à afficher */
  name: keyof typeof iconMap
  /** Taille de l'icône en pixels */
  size?: number
}

const props = withDefaults(defineProps<Props>(), { size: 16 })

const iconMap = {
  // Dossiers & navigation
  folder: '📁',
  file: '📄',
  home: '🏠',
  menu: '☰',
  close: '✕',
  chevronLeft: '‹',
  chevronRight: '›',
  chevronUp: '▲',
  chevronDown: '▼',
  
  // Actions
  add: '+',
  remove: '−',
  edit: '✏️',
  delete: '🗑️',
  save: '💾',
  copy: '📋',
  share: '🔗',
  download: '⬇️',
  upload: '⬆️',
  
  // Feedback
  check: '✓',
  cross: '✗',
  star: '★',
  heart: '❤️',
  warning: '⚠️',
  info: 'ℹ️',
  error: '❌',
  success: '✅',
  
  // Média & contenus
  image: '🖼️',
  video: '🎬',
  audio: '🎵',
  text: '📝',
  link: '🔗',
  chart: '📊',
  data: '📈',
  
  // Social
  user: '👤',
  users: '👥',
  settings: '⚙️',
  search: '🔍',
  filter: '🔽',
  sort: '↕️',
  
  // TV & médias
  tv: '📺',
  play: '▶️',
  pause: '⏸️',
  stop: '⏹️',
  
  // Studio spécifique
  drag: '⋮⋮',
  layout: '⊞',
  block: '▭',
  source: '📡',
  
  // Misc
  clock: '🕐',
  calendar: '📅',
  location: '📍',
  tag: '🏷️',
  bookmark: '🔖',
  lock: '🔒',
  unlock: '🔓',
  external: '↗️',
}

const icon = computed(() => iconMap[props.name] || '?')
</script>

<template>
  <span 
    class="inline-flex items-center justify-center"
    :style="{ fontSize: `${size}px`, lineHeight: '1' }"
    aria-hidden="true"
  >
    {{ icon }}
  </span>
</template>