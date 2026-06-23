<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'

defineProps<{
  items: {
    category: string
    title: string
    author: string
    reads: string
    trend: string
  }[]
}>()
</script>

<template>
  <section class="section">
    <div class="container">
      <div class="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p class="eyebrow">Presse & analyses</p>
          <h2 class="text-3xl font-semibold text-slate-900">Articles enrichis par la data</h2>
        </div>
        <AppButton variant="primary">Publier</AppButton>
      </div>
      <div class="mt-8 grid gap-6 lg:grid-cols-3">
        <article v-for="item in items" :key="item.title" class="panel rounded-3xl p-6">
          <div class="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span class="badge mono">{{ item.category }}</span>
            <span class="text-emerald-600">{{ item.trend }}</span>
          </div>
          <h3 class="mt-4 text-xl font-semibold text-slate-900">{{ item.title }}</h3>
          <div class="mt-6 flex items-center justify-between text-sm text-slate-500">
            <span>Par {{ item.author }}</span>
            <span>{{ item.reads }} lectures</span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
