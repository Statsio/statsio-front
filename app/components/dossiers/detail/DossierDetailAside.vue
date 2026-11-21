<script setup lang="ts">
import { computed } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsHeading from '@/components/ds/DsHeading.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsMeta from '@/components/ds/DsMeta.vue'
import DsPie from '@/components/ds/DsPie.vue'
import DsSwatch from '@/components/ds/DsSwatch.vue'
import { publicChannelPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { compositionText, dossierTypePie } from '@/lib/dossiers-listing'
import { compositionShare, type DossierChannelRow } from '@/lib/dossier-detail'
import type { DossierContentCounts, DossierContentType } from '@/types/dossier'

const props = defineProps<{
  counts: DossierContentCounts
  total: number
  formats: number
  following: boolean
  channels: DossierChannelRow[]
}>()

const emit = defineEmits<{ follow: []; 'set-type': [type: DossierContentType] }>()

const basePath = useContentBasePath()
const shares = computed(() => compositionShare(props.counts))
const pie = computed(() => dossierTypePie(props.counts))
const caption = computed(() => compositionText(props.counts))
</script>

<template>
  <aside class="dd-side" aria-label="Repères du dossier">
    <DsBox v-if="shares.length" as="section" class="dd-sbx" aria-labelledby="dd-comp">
      <DsLabel>Composition</DsLabel>
      <DsHeading id="dd-comp" :level="2" size="md">
        {{ total }} contenu{{ total > 1 ? 's' : '' }}, {{ formats }} format{{ formats > 1 ? 's' : '' }}
      </DsHeading>
      <div class="dd-comp">
        <DsPie :segments="pie" :size="108" :label="`Composition : ${caption}`" />
        <ul>
          <li v-for="part in shares" :key="part.value">
            <DsSwatch :color="part.color" :size="10" />
            <button type="button" @click="emit('set-type', part.value)">{{ part.label }}</button>
            <b>{{ part.percent }} %</b>
          </li>
        </ul>
      </div>
      <p>Un même contenu peut être rangé dans plusieurs dossiers.</p>
    </DsBox>

    <DsBox as="section" class="dd-sbx dd-follow" :data-on="following" aria-labelledby="dd-follow">
      <DsLabel>Suivi</DsLabel>
      <DsHeading id="dd-follow" :level="2" size="md">
        {{ following ? 'Vous suivez ce dossier' : 'Suivez ce dossier' }}
      </DsHeading>
      <p v-if="following">Il reste dans vos dossiers suivis, sur cet appareil.</p>
      <p v-else>
        Retrouvez-le d'un coup d'œil, avec les contenus qui y seront rangés ensuite, quelle que soit
        la chaîne qui les publie.
      </p>
      <DsButton
        :variant="following ? 'secondary' : 'primary'"
        style="align-self: flex-start"
        @click="emit('follow')"
      >
        {{ following ? 'Ne plus suivre' : '+ Suivre le dossier' }}
      </DsButton>
    </DsBox>

    <DsBox v-if="channels.length" as="section" class="dd-sbx" aria-labelledby="dd-channels">
      <DsLabel>Qui publie ici</DsLabel>
      <DsHeading id="dd-channels" :level="2" size="md">Chaînes contributrices</DsHeading>
      <ul class="dd-chans">
        <li v-for="channel in channels" :key="channel.key">
          <span class="dd-av dd-av--lg" aria-hidden="true">
            <img v-if="channel.logoUrl" :src="channel.logoUrl" alt="" />
            <template v-else>{{ channel.initials }}</template>
          </span>
          <span>
            <b>
              <NuxtLink v-if="channel.handle" :to="publicChannelPath(channel.handle, basePath)">{{ channel.name }}</NuxtLink>
              <template v-else>{{ channel.name }}</template>
              <span v-if="channel.verified" class="dd-kind" style="letter-spacing: 0">
                <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
                </svg>
                <span class="sr-only">chaîne vérifiée</span>
              </span>
            </b>
          </span>
          <DsMeta><b style="color: var(--ds-text)">{{ channel.count }}</b> contenu{{ channel.count > 1 ? 's' : '' }}</DsMeta>
        </li>
      </ul>
    </DsBox>
  </aside>
</template>
