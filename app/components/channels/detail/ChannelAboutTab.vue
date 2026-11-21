<script setup lang="ts">
import { computed } from 'vue'
import type { ChannelEntry } from '@/data/channels'
import DsBox from '@/components/ds/DsBox.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import ChannelKindBadge from '@/components/channels/listing/ChannelKindBadge.vue'
import { countryLabel } from '@/lib/channel-detail'
import { formatCompactNumber } from '@/lib/format'

const props = defineProps<{
  channel: ChannelEntry
  categoryLabels: string[]
  createdAtLabel: string | null
  articlesCount: number
  statsDataCount: number
  surveysCount: number
  surveyResponses: number
}>()

const rows = computed(() => {
  const list: { label: string; value: string }[] = []
  if (props.channel.organization?.name)
    list.push({ label: 'Organisation', value: props.channel.organization.name })
  if (props.categoryLabels.length)
    list.push({ label: 'Catégories', value: props.categoryLabels.join(', ') })
  if (props.createdAtLabel) list.push({ label: 'Créée le', value: props.createdAtLabel })
  if (props.channel.country)
    list.push({ label: 'Pays', value: countryLabel(props.channel.country) ?? props.channel.country })
  list.push({ label: 'Abonnés', value: formatCompactNumber(props.channel.followers) })
  list.push({ label: 'Vues cumulées', value: formatCompactNumber(props.channel.viewCount ?? 0) })
  list.push({ label: 'StatsData publiés', value: String(props.statsDataCount) })
  list.push({ label: 'Articles publiés', value: String(props.articlesCount) })
  list.push({ label: 'Sondages publiés', value: String(props.surveysCount) })
  if (props.surveyResponses)
    list.push({ label: 'Réponses aux sondages', value: formatCompactNumber(props.surveyResponses) })
  return list
})
</script>

<template>
  <div class="about">
    <div class="about__prose">
      <DsLabel>À propos · <b>{{ channel.name }}</b></DsLabel>
      <p class="about__lead">
        {{
          channel.longDescription ||
          channel.description ||
          'Aucune description renseignée pour cette chaîne.'
        }}
      </p>
    </div>

    <DsBox as="section" class="about__card" aria-labelledby="fc-h">
      <DsLabel>Fiche</DsLabel>
      <h2 id="fc-h">En bref</h2>
      <div class="about__kind"><ChannelKindBadge :kind="channel.kind" /></div>
      <dl>
        <div v-for="row in rows" :key="row.label">
          <dt>{{ row.label }}</dt>
          <dd>{{ row.value }}</dd>
        </div>
      </dl>
    </DsBox>
  </div>
</template>

<style scoped>
.about {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 44px;
  align-items: start;
  padding-block: 32px 0;
}
.about__prose {
  display: flex;
  max-width: 66ch;
  flex-direction: column;
  gap: 16px;
}
.about__lead {
  margin: 0;
  color: var(--ds-muted);
  font-size: 20px;
  line-height: 1.55;
}
.about__card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 18px 8px;
}
.about__card h2 {
  margin: 0;
  font: 800 23px/1 var(--ds-display);
  font-stretch: 94%;
}
.about__kind {
  display: flex;
}
.about__card dl {
  margin: 0;
}
.about__card div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 2px solid var(--ds-divide);
  font-size: 14px;
}
.about__card div:last-child {
  border-bottom: 0;
}
.about__card dt {
  color: var(--ds-muted);
}
.about__card dd {
  margin: 0;
  font-weight: 700;
  text-align: right;
}
@media (max-width: 1040px) {
  .about {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
