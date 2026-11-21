<script setup lang="ts">
import type { ChannelProfileTab } from '@/composables/useChannelProfile'
import type { ChannelEntry } from '@/data/channels'
import DsButton from '@/components/ds/DsButton.vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import ChannelAvatar from '@/components/channels/listing/ChannelAvatar.vue'
import type { DsGlyphKind } from '@/lib/ds/types'

const props = defineProps<{
  tabs: { key: ChannelProfileTab; label: string; count?: number; glyph?: DsGlyphKind }[]
  modelValue: ChannelProfileTab
  channel: ChannelEntry
  showMini: boolean
  isOwner: boolean
  isFollowing: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [ChannelProfileTab]; 'toggle-follow': [] }>()

const avatarItem = {
  get id() {
    return Number(props.channel.slug) || 0
  },
}
</script>

<template>
  <div class="ctabs ds-sticky-bar">
    <div class="ds-max ctabs__row">
      <nav aria-label="Sections de la chaîne">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          :aria-current="modelValue === tab.key ? 'page' : undefined"
          @click="emit('update:modelValue', tab.key)"
        >
          <DsTypeGlyph v-if="tab.glyph" :kind="tab.glyph" :size="14" />
          {{ tab.label }}
          <b v-if="tab.count != null">{{ tab.count }}</b>
        </button>
      </nav>
      <span class="ctabs__mini" :class="{ 'is-on': showMini }">
        <ChannelAvatar
          :item="{
            id: avatarItem.id,
            name: channel.name,
            kind: channel.kind,
            logo_url: channel.logoUrl ?? null,
            custom_color_primary: channel.customColorPrimary ?? null,
            custom_color_secondary: channel.customColorSecondary ?? null,
          }"
          :size="34"
        />
        <b>{{ channel.name }}</b>
        <DsButton
          v-if="!isOwner"
          size="sm"
          :variant="isFollowing ? 'secondary' : 'primary'"
          :aria-pressed="isFollowing"
          @click="emit('toggle-follow')"
        >
          {{ isFollowing ? 'Abonné ✓' : "S'abonner" }}
        </DsButton>
      </span>
    </div>
  </div>
</template>

<style scoped>
.ctabs {
  border-bottom: 2px solid var(--ds-ol);
  background: color-mix(in srgb, var(--ds-bg) 95%, transparent);
  backdrop-filter: blur(8px);
}
.ctabs__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px 18px;
}
.ctabs nav {
  display: flex;
  max-width: 100%;
  gap: 2px;
  overflow-x: auto;
}
.ctabs button {
  position: relative;
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 7px;
  height: 54px;
  padding: 0 14px;
  border: 0;
  background: none;
  color: var(--ds-muted);
  font: 700 14.5px/1 var(--ds-ui);
  white-space: nowrap;
  cursor: pointer;
}
.ctabs button b {
  font: 500 11.5px var(--ds-num);
  opacity: 0.85;
}
.ctabs button:hover {
  color: var(--ds-link);
}
.ctabs button[aria-current='page'] {
  color: var(--ds-text);
}
.ctabs button[aria-current='page']::after {
  content: '';
  position: absolute;
  right: 12px;
  bottom: -2px;
  left: 12px;
  height: 5px;
  border-radius: 2px 2px 0 0;
  background: var(--ds-action);
}
.ctabs__mini {
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 0;
  pointer-events: none;
  transform: translateY(6px);
  transition:
    opacity 0.25s,
    transform 0.25s var(--ds-e-glisse);
}
.ctabs__mini.is-on {
  opacity: 1;
  pointer-events: auto;
  transform: none;
}
.ctabs__mini b {
  font: 800 18px/1 var(--ds-display);
  font-stretch: 92%;
}
@media (max-width: 760px) {
  .ctabs__mini {
    display: none;
  }
}
</style>
