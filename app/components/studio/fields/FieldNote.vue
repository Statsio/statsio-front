<script setup lang="ts">
// Explanatory grey callout used throughout the inspector and modals.
</script>

<template>
  <div
    class="rounded-[11px] bg-[var(--studio-note)] px-3.5 py-3 text-[12.5px] leading-[1.55] text-[color:color-mix(in_srgb,var(--studio-ink)_60%,transparent)] [text-wrap:pretty]"
  >
    <slot />
  </div>
</template>
