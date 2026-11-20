<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { StatsDataDocument } from '@/api/studio'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { publicChannelPath } from '@/lib/content-display'

/**
 * Signature du hero StatsData, charte « Tranches » : avatar 24px, « Par <b>Nom</b> ✓ »,
 * « + Suivre » et « Voir le profil → » en liens de la charte.
 * (Les pages article / sondage gardent `ContentCreatorByline`.)
 */
const props = defineProps<{
  doc: StatsDataDocument
  isFollowing?: boolean
  canFollow?: boolean
}>()

defineEmits<{ 'toggle-follow': [] }>()

const basePath = useContentBasePath()
const isChannel = computed(() => props.doc.published_as === 'channel' && !!props.doc.channel)
const name = computed(() => (isChannel.value ? props.doc.channel?.name : props.doc.author?.name) || 'Anonyme')
const logoUrl = computed(() => (isChannel.value ? props.doc.channel?.logo_url : null))
const accent = computed(() => props.doc.channel?.custom_color_primary ?? null)
const initials = computed(
  () =>
    name.value
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?',
)
const profileHref = computed(() => {
  if (!isChannel.value) return null
  if (props.doc.channel?.handle) return publicChannelPath(props.doc.channel.handle, basePath.value)
  return props.doc.channel?.id ? `/channels/${props.doc.channel.id}` : null
})
</script>

<template>
  <div class="sdby">
    <span class="sdby__av" :style="accent && !logoUrl ? { background: accent } : undefined" aria-hidden="true">
      <img v-if="logoUrl" :src="logoUrl" alt="" />
      <template v-else>{{ initials }}</template>
    </span>
    <span>Par <b>{{ name }}</b><span v-if="isChannel" class="sdby__ok" title="Chaîne vérifiée"> ✓</span></span>
    <template v-if="canFollow">
      <span aria-hidden="true">·</span>
      <button type="button" class="sdby__link" :aria-pressed="isFollowing" @click="$emit('toggle-follow')">
        {{ isFollowing ? '✓ Suivi' : '+ Suivre' }}
      </button>
    </template>
    <template v-if="profileHref">
      <span aria-hidden="true">·</span>
      <RouterLink :to="profileHref" class="sdby__link">Voir le profil →</RouterLink>
    </template>
  </div>
</template>

<style scoped>
.sdby {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  color: var(--ds-muted);
  font: 400 14px/1.4 var(--ds-ui);
}
.sdby b {
  color: var(--ds-text);
  font-weight: 700;
}
.sdby__ok {
  color: var(--ds-blue-500);
  font-weight: 700;
}
.sdby__av {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  overflow: hidden;
  border: 2px solid var(--ds-ol);
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ds-violet-500), var(--ds-blue-500));
  color: #fff;
  font: 800 9px/1 var(--ds-ui);
}
.sdby__av img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.sdby__link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--ds-link);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
}
.sdby__link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
