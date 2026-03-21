<script setup lang="ts">
defineProps<{
  items: { title: string; description: string; tag: string; icon: string }[]
}>()
</script>

<template>
  <section class="section">
    <div class="container">
      <div class="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p class="eyebrow">Pourquoi Statsio</p>
          <h2 class="text-3xl font-semibold text-slate-900">Une newsroom data-ready</h2>
        </div>
        <button class="btn-secondary">Voir la démo</button>
      </div>
      <div class="mt-8 grid gap-6 lg:grid-cols-3">
        <article
          v-for="item in items"
          :key="item.title"
          class="panel rounded-3xl p-6 transition hover:-translate-y-1"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg">
            {{ item.icon }}
          </div>
          <p class="eyebrow mt-5">{{ item.tag }}</p>
          <h3 class="mt-2 text-xl font-semibold text-slate-900">{{ item.title }}</h3>
          <p class="mt-3 text-sm text-slate-600">{{ item.description }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
