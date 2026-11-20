<script setup lang="ts">
import { computed } from 'vue'
import { channelKindOf } from '@/lib/channels-listing'
import type { ChannelKind } from '@/types/channel-catalog'

/** Type de chaîne en étiquette mono : rédaction (violet), institution (bleu), indépendant (vert). */
const props = defineProps<{ kind: ChannelKind }>()
const label = computed(() => channelKindOf(props.kind).label)
</script>

<template>
  <span class="chkind" :class="`chkind--${kind}`">{{ label }}</span>
</template>

<style scoped>
.chkind {
  padding: 4px 7px;
  border: 2px solid var(--ds-divide);
  border-radius: 3px;
  color: var(--ds-link);
  font: 500 10px/1 var(--ds-num);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}
.chkind--institution {
  border-color: var(--ds-blue-300);
  color: var(--ds-blue-700);
}
:root[data-color-scheme='dark'] .chkind--institution {
  color: var(--ds-blue-300);
}
.chkind--independant {
  border-color: color-mix(in srgb, var(--ds-ok) 45%, transparent);
  color: var(--ds-ok);
}
</style>
