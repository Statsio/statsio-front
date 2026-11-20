<script setup lang="ts">
import { computed } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import DsHighlight from '@/components/ds/DsHighlight.vue'
import ChannelActivity from './ChannelActivity.vue'
import ChannelAvatar from './ChannelAvatar.vue'
import ChannelBanner from './ChannelBanner.vue'
import ChannelFollowButton from './ChannelFollowButton.vue'
import ChannelHeading from './ChannelHeading.vue'
import ChannelMixBar from './ChannelMixBar.vue'
import ChannelStats from './ChannelStats.vue'
import { isNewChannel } from '@/lib/channels-listing'
import type { ChannelCatalogItem } from '@/types/channel-catalog'

/**
 * Carte de chaîne : bannière (image ou tranches aux couleurs de la chaîne),
 * avatar + abonnement, nom, description, chiffres, mix éditorial, activité sur
 * 30 jours et mots-clés (cliquer un mot-clé le cherche).
 */
const props = defineProps<{
  item: ChannelCatalogItem
  to: string
  following: boolean
  followers: number
  query?: string
}>()
const emit = defineEmits<{ follow: []; tag: [tag: string] }>()

const isNew = computed(() => isNewChannel(props.item))
</script>

<template>
  <DsBox as="article" interactive class="chtile">
    <ChannelBanner :item="item" :to="to" />
    <div class="chtile__bd">
      <div class="chtile__head">
        <ChannelAvatar :item="item" />
        <ChannelFollowButton :following="following" :name="item.name" @toggle="emit('follow')" />
      </div>
      <ChannelHeading :item="item" :to="to" :query="query">
        <span v-if="isNew" class="chtile__new"><i aria-hidden="true" />Nouvelle</span>
      </ChannelHeading>
      <p v-if="item.description" class="chtile__desc">
        <DsHighlight :text="item.description" :query="query" />
      </p>
      <ChannelStats
        :followers="followers"
        :publications="item.publications_count"
        :statsdata="item.statsdata_count"
      />
      <ChannelMixBar :item="item" />
      <ChannelActivity :item="item" />
      <div v-if="item.tags.length" class="chtile__tags">
        <button
          v-for="t in item.tags"
          :key="t"
          type="button"
          :aria-label="`Chercher ${t}`"
          @click="emit('tag', t)"
        >
          #<DsHighlight :text="t" :query="query" />
        </button>
      </div>
    </div>
  </DsBox>
</template>

<style scoped>
.chtile {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.chtile__bd {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  padding: 0 18px 18px;
}
.chtile__head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  margin-top: -34px;
}
.chtile__desc {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--ds-muted);
  font-size: 14px;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
.chtile__new {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 7px;
  border: 2px solid var(--ds-ok);
  border-radius: 999px;
  color: var(--ds-ok);
  font: 500 10px/1 var(--ds-num);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.chtile__new i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
.chtile__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
}
.chtile__tags button {
  padding: 3px 8px;
  border: 2px solid var(--ds-divide);
  border-radius: 3px;
  background: var(--ds-surface);
  color: var(--ds-muted);
  font: 600 12px/1.4 var(--ds-ui);
  cursor: pointer;
}
.chtile__tags button:hover {
  border-color: var(--ds-ol);
  color: var(--ds-link);
}
.chtile__tags button:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 2px;
}
</style>
