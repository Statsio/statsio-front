<script setup lang="ts">
</script>

<template>
  <div class="sticky top-44 z-20 border-b border-slate-200/70 bg-white/90 px-4 py-3.5 backdrop-blur-md sm:px-6 lg:top-28 lg:px-8">
    <div class="mx-auto flex max-w-[1240px] flex-col gap-3">
      <div class="flex flex-wrap items-center gap-2.5">
        <slot name="search" />
        <slot name="sort" />
        <slot name="view" />
      </div>
      <slot />
    </div>
  </div>
</template>
