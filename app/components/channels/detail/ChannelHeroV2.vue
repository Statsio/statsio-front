<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChannelEntry } from '@/data/channels'
import type { ChannelPace } from '@/types/channel-catalog'
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsHeading from '@/components/ds/DsHeading.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsSwatch from '@/components/ds/DsSwatch.vue'
import ChannelActivity from '@/components/channels/listing/ChannelActivity.vue'
import ChannelAvatar from '@/components/channels/listing/ChannelAvatar.vue'
import ChannelBanner from '@/components/channels/listing/ChannelBanner.vue'
import ChannelKindBadge from '@/components/channels/listing/ChannelKindBadge.vue'
import ChannelMixBar from '@/components/channels/listing/ChannelMixBar.vue'
import ChannelVerifiedMark from '@/components/channels/listing/ChannelVerifiedMark.vue'
import ChannelShareModal from '@/components/channels/detail/ChannelShareModal.vue'
import { activitySummary } from '@/lib/channels-listing'
import { countryLabel, emphasizeChannelName } from '@/lib/channel-detail'
import { formatCompactNumber } from '@/lib/format'

const props = defineProps<{
  channel: ChannelEntry
  isOwner: boolean
  isFollowing: boolean
  isVerified: boolean
  categoryLabels: string[]
  articlesCount: number
  statsDataCount: number
  surveysCount: number
  surveyResponses: number
  activityDays: number[]
  pace: ChannelPace
  lastPublishedAt: string | null
  listPath?: string
  createdAtLabel: string | null
}>()

const emit = defineEmits<{ 'toggle-follow': [] }>()

const channelId = computed(() => Number(props.channel.slug) || 0)
const bannerItem = computed(() => ({
  id: channelId.value,
  banner_url: props.channel.bannerUrl ?? null,
  custom_color_primary: props.channel.customColorPrimary ?? null,
  custom_color_secondary: props.channel.customColorSecondary ?? null,
}))
const avatarItem = computed(() => ({
  id: channelId.value,
  name: props.channel.name,
  kind: props.channel.kind,
  logo_url: props.channel.logoUrl ?? null,
  custom_color_primary: props.channel.customColorPrimary ?? null,
  custom_color_secondary: props.channel.customColorSecondary ?? null,
}))
const title = computed(() => emphasizeChannelName(props.channel.name))
const publications = computed(
  () => props.articlesCount + props.statsDataCount + props.surveysCount,
)
const mixItem = computed(() => ({
  statsdata_count: props.statsDataCount,
  articles_count: props.articlesCount,
  surveys_count: props.surveysCount,
}))
const activityItem = computed(() => ({
  pace: props.pace,
  activity_days: props.activityDays,
  last_published_at: props.lastPublishedAt,
}))
const rhythm = computed(() => activitySummary(activityItem.value))
const country = computed(() => countryLabel(props.channel.country))
const meta = computed(() =>
  [props.createdAtLabel ? `Créée le ${props.createdAtLabel}` : null, country.value]
    .filter(Boolean)
    .join(' · '),
)
const themeColors = ['var(--ds-context)', 'var(--ds-t1)', 'var(--ds-t2)', 'var(--ds-t4)', 'var(--ds-t5)']
const figures = computed(() => [
  { label: 'Abonnés', value: formatCompactNumber(props.channel.followers) },
  { label: 'Publications', value: formatCompactNumber(publications.value) },
  { label: 'Vues cumulées', value: formatCompactNumber(props.channel.viewCount ?? 0) },
  { label: 'Réponses aux sondages', value: formatCompactNumber(props.surveyResponses) },
])

const isShareOpen = ref(false)
</script>

<template>
  <section class="chero">
    <div class="ds-max">
      <nav class="chero__crumbs" aria-label="Fil d'Ariane">
        <NuxtLink to="/">Accueil</NuxtLink>
        <span aria-hidden="true">/</span>
        <NuxtLink :to="listPath || '/chaines'">Chaînes</NuxtLink>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{{ channel.name }}</span>
      </nav>

      <DsBox class="chero__box">
        <ChannelBanner :item="bannerItem" fluid />
        <div class="chero__body">
          <div class="chero__idt">
            <ChannelAvatar class="chero__av" :item="avatarItem" :size="124" />
            <div class="chero__row">
              <ChannelKindBadge :kind="channel.kind" />
              <ChannelVerifiedMark v-if="isVerified" :size="16" />
              <span class="chero__hdl">{{ channel.handle }}</span>
            </div>
            <DsHeading :level="1" size="display">
              {{ title.lead }}<template v-if="title.accent"> <em>{{ title.accent }}</em></template>
            </DsHeading>
            <p v-if="channel.description" class="chero__ex">{{ channel.description }}</p>
            <div v-if="categoryLabels.length || meta" class="chero__themes">
              <span v-for="(label, i) in categoryLabels" :key="label" class="chero__tag">
                <DsSwatch :color="themeColors[i % themeColors.length]!" :size="9" />{{ label }}
              </span>
              <span v-if="meta" class="chero__meta">{{ meta }}</span>
            </div>
          </div>

          <div class="chero__side">
            <dl class="chero__kpis">
              <div v-for="figure in figures" :key="figure.label">
                <dt>{{ figure.label }}</dt>
                <dd class="ds-tnum">{{ figure.value }}</dd>
              </div>
            </dl>
            <div class="chero__acts">
              <DsButton
                v-if="isOwner"
                variant="secondary"
                :to="`/channels/${channel.slug}/dashboard/profil`"
              >
                Modifier le profil
              </DsButton>
              <DsButton
                v-else
                :variant="isFollowing ? 'secondary' : 'primary'"
                :aria-pressed="isFollowing"
                @click="emit('toggle-follow')"
              >
                {{ isFollowing ? 'Abonné ✓' : "S'abonner" }}
              </DsButton>
              <DsButton variant="secondary" @click="isShareOpen = true">
                <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M8 1.5v9M4.5 5 8 1.5 11.5 5M2.5 9v4.5h11V9"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                Partager
              </DsButton>
            </div>
          </div>

          <div class="chero__pulse">
            <div class="chero__pulse-col">
              <DsLabel>Rythme · <b>{{ rhythm.pace }}</b></DsLabel>
              <ChannelActivity :item="activityItem" hero />
            </div>
            <div v-if="publications" class="chero__pulse-col">
              <DsLabel>Ce que publie la chaîne</DsLabel>
              <ChannelMixBar :item="mixItem" inline />
            </div>
          </div>
        </div>
      </DsBox>
    </div>
    <ChannelShareModal v-model:open="isShareOpen" :channel-name="channel.name" />
  </section>
</template>

<style scoped>
.chero {
  padding-block: 8px 28px;
}
.chero__crumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding-top: 18px;
  color: var(--ds-muted);
  font: 500 12px var(--ds-num);
}
.chero__crumbs a:hover {
  color: var(--ds-link);
}
.chero__box {
  overflow: hidden;
  margin-top: 18px;
}
.chero__body {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: 24px 40px;
  align-items: end;
  padding: 0 30px 26px;
}
.chero__idt {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 14px;
}
.chero__idt :deep(h1) {
  font-size: clamp(44px, 6vw, 86px);
  line-height: 0.88;
  font-stretch: 88%;
}
.chero__av {
  position: relative;
  z-index: 1;
  margin-top: -62px;
  border-width: 3px;
  box-shadow: 5px 5px 0 var(--ds-sh);
  font-size: 42px;
}
.chero__row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: center;
}
.chero__hdl {
  color: var(--ds-muted);
  font: 500 13px var(--ds-num);
}
.chero__ex {
  max-width: 56ch;
  margin: 0;
  color: var(--ds-muted);
  font-size: 17.5px;
}
.chero__themes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
}
.chero__tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ds-link);
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.chero__meta {
  color: var(--ds-faint);
  font: 400 12px var(--ds-num);
}
.chero__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 22px;
}
.chero__kpis {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
  margin: 0;
  padding: 16px 18px;
  border: 2px solid var(--ds-ol);
  border-radius: 5px;
  background: var(--ds-surface);
}
.chero__kpis dt {
  color: var(--ds-muted);
  font: 500 10.5px/1.2 var(--ds-num);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.chero__kpis dd {
  margin: 6px 0 0;
  color: var(--ds-accent);
  font: 800 32px/1 var(--ds-display);
  font-stretch: 110%;
  letter-spacing: -0.02em;
}
.chero__acts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.chero__pulse {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: 18px 40px;
  margin: 0 -30px -26px;
  padding: 16px 30px 18px;
  border-top: 2px solid var(--ds-ol);
  background: var(--ds-tint);
}
.chero__pulse-col {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
}
@media (max-width: 900px) {
  .chero__body {
    grid-template-columns: minmax(0, 1fr);
    padding: 0 20px 22px;
  }
  .chero__pulse {
    grid-template-columns: minmax(0, 1fr);
    margin: 0 -20px -22px;
    padding: 16px 20px;
  }
}
@media (max-width: 640px) {
  .chero__av {
    width: 92px !important;
    height: 92px !important;
    margin-top: -46px;
    font-size: 32px;
  }
}
</style>
