<script setup lang="ts">
withDefaults(
  defineProps<{
    kind: 'articles' | 'stats' | 'polls' | 'channels' | 'remote' | 'disease' | 'medicine' | 'medical-service'
    class?: string
  }>(),
  {
    class: 'h-[22px] w-[22px]',
  },
)
</script>

<template>
  <svg
    v-if="kind === 'articles'"
    viewBox="0 0 24 24"
    :class="$props.class"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 6.5C5 5.67 5.67 5 6.5 5H14L19 10V17.5C19 18.33 18.33 19 17.5 19H6.5C5.67 19 5 18.33 5 17.5V6.5Z"
      class="fill-secondary"
    />
    <path d="M14 5L19 10H15.5C14.67 10 14 9.33 14 8.5V5Z" class="fill-primary" />
    <path d="M8 11.25H15.25M8 14.25H13" class="stroke-accent" stroke-width="1.7" stroke-linecap="round" />
  </svg>

  <svg
    v-else-if="kind === 'stats'"
    viewBox="0 0 24 24"
    :class="$props.class"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="4.5" y="12" width="3.5" height="7" rx="1" class="fill-accent" transform="rotate(-18 4.5 12)" />
    <rect
      x="10.25"
      y="8.75"
      width="3.5"
      height="10.25"
      rx="1"
      class="fill-primary"
      transform="rotate(-18 10.25 8.75)"
    />
    <rect x="16" y="5.5" width="3.5" height="13.5" rx="1" class="fill-accent" transform="rotate(-18 16 5.5)" />
  </svg>

  <svg
    v-else-if="kind === 'polls'"
    viewBox="0 0 24 24"
    :class="$props.class"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 12L12 4C7.58 4 4 7.58 4 12H12Z" class="fill-primary" />
    <path d="M12 12L4 12C4 16.42 7.58 20 12 20V12Z" class="fill-secondary" />
    <path d="M12 12L17.66 6.34C16.21 4.89 14.21 4 12 4V12Z" class="fill-accent" />
  </svg>

  <svg
    v-else-if="kind === 'remote'"
    viewBox="0 0 24 24"
    :class="$props.class"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="8" y="3" width="8" height="18" rx="3" class="fill-secondary" />
    <circle cx="12" cy="7" r="1.5" class="fill-primary" />
    <rect x="10" y="10" width="4" height="4" rx="1.2" class="fill-primary" />
    <circle cx="10.25" cy="16.75" r="1" class="fill-accent" />
    <circle cx="13.75" cy="16.75" r="1" class="fill-accent" />
    <path d="M10.2 12H13.8M12 10.2V13.8" class="stroke-secondary" stroke-width="1.2" stroke-linecap="round" />
  </svg>

  <!-- Disease / Maladies — virus cell with surrounding particles -->
  <svg v-else-if="kind === 'disease'" viewBox="0 0 24 24" :class="$props.class" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="5.5" class="fill-secondary" />
    <circle cx="12" cy="4.5" r="2" class="fill-primary" />
    <circle cx="19.5" cy="12" r="2" class="fill-primary" />
    <circle cx="12" cy="19.5" r="2" class="fill-primary" />
    <circle cx="4.5" cy="12" r="2" class="fill-primary" />
    <circle cx="7.4" cy="7.4" r="1.4" class="fill-accent" />
    <circle cx="16.6" cy="7.4" r="1.4" class="fill-accent" />
    <circle cx="7.4" cy="16.6" r="1.4" class="fill-accent" />
    <circle cx="16.6" cy="16.6" r="1.4" class="fill-accent" />
  </svg>

  <!-- Medicine / Médicaments — horizontal capsule pill -->
  <svg v-else-if="kind === 'medicine'" viewBox="0 0 24 24" :class="$props.class" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 10C4 7.79 5.79 6 8 6H12V18H8C5.79 18 4 16.21 4 14V10Z" class="fill-secondary" />
    <path d="M12 6H16C18.21 6 20 7.79 20 10V14C20 16.21 18.21 18 16 18H12V6Z" class="fill-primary" />
    <circle cx="8.5" cy="12" r="1.5" class="fill-accent" />
  </svg>

  <!-- Medical Service / Services médicaux — cross on rounded square -->
  <svg v-else-if="kind === 'medical-service'" viewBox="0 0 24 24" :class="$props.class" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="4" class="fill-secondary" />
    <rect x="10.5" y="6.5" width="3" height="11" rx="1" class="fill-primary" />
    <rect x="6.5" y="10.5" width="11" height="3" rx="1" class="fill-primary" />
  </svg>

  <svg v-else viewBox="0 0 24 24" :class="$props.class" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="8" r="2.5" class="fill-accent" />
    <circle cx="17" cy="6.5" r="2" class="fill-primary" />
    <circle cx="15.5" cy="16.5" r="2.5" class="fill-secondary" />
    <path
      d="M8.9 8.4L15.1 6.9M8.5 9.8L14.1 15M16.7 8.3L16 14"
      class="stroke-primary"
      stroke-width="1.6"
      stroke-linecap="round"
    />
  </svg>
</template>
