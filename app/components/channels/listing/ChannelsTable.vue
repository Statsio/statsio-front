<script setup lang="ts">
import DsBox from '@/components/ds/DsBox.vue'
import DsHighlight from '@/components/ds/DsHighlight.vue'
import ChannelActivity from './ChannelActivity.vue'
import ChannelAvatar from './ChannelAvatar.vue'
import ChannelFollowButton from './ChannelFollowButton.vue'
import ChannelKindBadge from './ChannelKindBadge.vue'
import ChannelVerifiedMark from './ChannelVerifiedMark.vue'
import { formatCatalogCount } from '@/lib/catalog-format'
import type { ChannelCatalogItem } from '@/types/channel-catalog'

/** Vue « liste » : un vrai tableau (en-têtes de colonne), défilant à l'horizontale sur mobile. */
defineProps<{
  items: ChannelCatalogItem[]
  query?: string
  linkOf: (item: ChannelCatalogItem) => string
  themeLabel: (slug: string) => string
  isFollowing: (item: ChannelCatalogItem) => boolean
  followersOf: (item: ChannelCatalogItem) => number
}>()
const emit = defineEmits<{ follow: [item: ChannelCatalogItem] }>()
</script>

<template>
  <DsBox class="chtbl">
    <table class="chtbl__t">
      <thead>
        <tr>
          <th scope="col">Chaîne</th>
          <th scope="col">Type</th>
          <th scope="col" class="r">Abonnés</th>
          <th scope="col" class="r">Publications</th>
          <th scope="col">Rythme</th>
          <th scope="col"><span class="sr-only">Abonnement</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>
            <div class="chtbl__main">
              <ChannelAvatar :item="item" :size="42" />
              <span class="chtbl__txt">
                <span class="chtbl__name">
                  <NuxtLink :to="linkOf(item)"
                    ><DsHighlight :text="item.name" :query="query"
                  /></NuxtLink>
                  <ChannelVerifiedMark v-if="item.verified" :size="16" />
                </span>
                <span class="chtbl__sub">
                  @{{ item.handle
                  }}<template v-if="item.categories.length">
                    · {{ item.categories.map(themeLabel).join(', ') }}</template
                  >
                </span>
              </span>
            </div>
          </td>
          <td><ChannelKindBadge :kind="item.kind" /></td>
          <td class="r ds-tnum">{{ formatCatalogCount(followersOf(item)) }}</td>
          <td class="r ds-tnum">{{ formatCatalogCount(item.publications_count) }}</td>
          <td><ChannelActivity :item="item" compact /></td>
          <td>
            <ChannelFollowButton
              :following="isFollowing(item)"
              :name="item.name"
              @toggle="emit('follow', item)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </DsBox>
</template>

<style scoped>
.chtbl {
  overflow-x: auto;
}
.chtbl__t {
  width: 100%;
  min-width: 820px;
  border-collapse: collapse;
}
.chtbl__t th {
  padding: 12px 14px;
  border-bottom: 2px solid var(--ds-ol);
  background: var(--ds-tint);
  color: var(--ds-muted);
  font: 500 10.5px var(--ds-num);
  letter-spacing: 0.1em;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}
.chtbl__t td {
  padding: 12px 14px;
  border-bottom: 2px solid var(--ds-divide);
  font-size: 14px;
  vertical-align: middle;
}
.chtbl__t .r {
  text-align: right;
}
.chtbl__t tbody tr:last-child td {
  border-bottom: 0;
}
.chtbl__t tbody tr:hover {
  background: var(--ds-tint);
}
.chtbl__main {
  display: flex;
  align-items: center;
  gap: 12px;
}
.chtbl__main :deep(.chav) {
  box-shadow: none;
}
.chtbl__txt {
  min-width: 0;
}
.chtbl__name {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.chtbl__name a {
  color: var(--ds-text);
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
}
.chtbl__name a:hover {
  color: var(--ds-link);
}
.chtbl__name a:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 2px;
}
.chtbl__sub {
  display: block;
  color: var(--ds-faint);
  font: 400 12px/1.4 var(--ds-num);
}
</style>
