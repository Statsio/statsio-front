<script setup lang="ts">
import { ref } from 'vue'
import type { HomeFaqItem } from '@/data/brands/home-content.types'

defineProps<{
  eyebrow: string
  title: string
  faqs: HomeFaqItem[]
}>()

const open = ref(0)

function toggle(i: number) {
  open.value = open.value === i ? -1 : i
}
</script>

<template>
  <section class="mx-auto mb-[70px] max-w-[820px]">
    <div class="mb-9 text-center">
      <span class="font-mono text-[10px] font-semibold tracking-[0.09em] text-primary">{{ eyebrow }}</span>
      <h2 class="mt-2.5 text-[28px] font-extrabold tracking-[-0.02em] text-slate-950">
        {{ title }}
      </h2>
    </div>

    <div class="flex flex-col gap-2.5">
      <div
        v-for="(faq, i) in faqs"
        :key="i"
        class="overflow-hidden rounded-[14px] border-[1.5px] border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(20,20,30,0.06)]"
      >
        <button
          type="button"
          class="flex w-full items-center gap-3.5 px-5 py-[18px] text-left"
          :aria-expanded="open === i"
          @click="toggle(i)"
        >
          <span class="flex-1 text-[15px] font-bold tracking-[-0.01em] text-slate-950">{{ faq.q }}</span>
          <span
            class="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#f4f3f8] text-sm text-primary transition-transform"
            :class="open === i ? 'rotate-45' : ''"
          >
            +
          </span>
        </button>
        <div v-if="open === i" class="px-5 pb-5 text-[13.5px] leading-relaxed text-slate-500">
          {{ faq.a }}
        </div>
      </div>
    </div>
  </section>
</template>
