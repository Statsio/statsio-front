<script setup lang="ts">
</script>

<template>
  <div class="border-b border-slate-200/70 bg-white px-4 py-3.5 sm:px-6 lg:px-8">
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
