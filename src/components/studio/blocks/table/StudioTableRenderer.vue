<script setup lang="ts">
defineProps<{
  headers: string[]
  rows: string[][]
}>()
</script>

<template>
  <table class="w-full border-collapse text-left text-sm text-slate-700">
    <thead>
      <tr class="border-b border-slate-200 bg-slate-50">
        <th
          v-for="h in headers"
          :key="h"
          scope="col"
          class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
        >
          {{ h }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, ri) in rows" :key="ri" class="border-b border-slate-100 last:border-0">
        <td v-for="(cell, ci) in row" :key="ci" class="px-4 py-3 text-slate-700">
          {{ cell }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

