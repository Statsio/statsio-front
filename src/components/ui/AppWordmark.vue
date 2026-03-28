<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineOptions({
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    prefix?: string
    suffix?: string
    as?: 'p' | 'span' | 'div'
  }>(),
  {
    prefix: 'Stats',
    suffix: 'io',
    as: 'p',
  },
)

const attrs = useAttrs()

const forwardedAttrs = computed(() => {
  const rest = { ...attrs }
  delete rest.class

  return rest
})

const classes = computed(() => ['text-primary text-xl font-bold uppercase font-mono', attrs.class])
</script>

<template>
  <component :is="as" :class="classes" v-bind="forwardedAttrs">
    {{ prefix }}<span class="text-accent">{{ suffix }}</span>
  </component>
</template>
