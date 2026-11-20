<script setup lang="ts">
import { computed } from 'vue'
import HomeSearchHero from '@/components/home/tranches/HomeSearchHero.vue'
import HomeDayFigure from '@/components/home/tranches/HomeDayFigure.vue'
import HomeTopicWheel from '@/components/home/tranches/HomeTopicWheel.vue'
import HomeLiveFeed from '@/components/home/tranches/HomeLiveFeed.vue'
import HomeDailyQuestion from '@/components/home/tranches/HomeDailyQuestion.vue'
import HomeChannels from '@/components/home/tranches/HomeChannels.vue'
import HomePublishBand from '@/components/home/tranches/HomePublishBand.vue'
import { useStatsioHome } from '@/composables/useStatsioHome'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { publicContentListPath } from '@/lib/content-display'
import { statsioHomeTranches as content } from '@/data/brands/statsio/home-tranches'

/**
 * Page d'accueil Statsio — charte « Tranches » (Bold Outline).
 * Orchestration seule : 1. recherche + chiffre du jour · 2. camembert des sujets ·
 * 3. fil « En direct » + question du jour · 4. qui publie · 5. publier.
 * Données : `useStatsioHome` ; textes : `data/brands/statsio/home-tranches.ts`.
 * Chaque section se masque proprement si le catalogue ne la nourrit pas.
 */
const home = useStatsioHome()
const base = useContentBasePath()

const dayFigureHref = computed(() =>
  home.dayFigure.value
    ? `${publicContentListPath('article', base.value)}?cat=${encodeURIComponent(home.dayFigure.value.theme.value)}`
    : publicContentListPath('article', base.value),
)
</script>

<template>
  <div class="ds-scope home">
    <section class="ds-max home__hero" aria-label="Recherche">
      <HomeSearchHero
        :content="content.hero"
        :total-contents="home.totalContents.value"
        :channels-count="home.channelsCount.value"
        :last-published-at="home.lastPublishedAt.value"
      />
      <HomeDayFigure v-if="home.dayFigure.value" :figure="home.dayFigure.value" :href="dayFigureHref" />
    </section>

    <HomeTopicWheel
      v-if="home.topThemes.value.length >= 2"
      :content="content.explore"
      :themes="home.topThemes.value"
      :others="home.otherThemes.value"
      :items="home.themeItems.value"
      :loading="home.themeLoading.value"
      :base-path="base"
      @load="home.loadTheme"
    />

    <HomeLiveFeed v-if="home.feed.value.length" :content="content.live" :entries="home.feed.value">
      <template #aside>
        <HomeDailyQuestion v-if="home.dailyQuestion.value" :survey="home.dailyQuestion.value" :base-path="base" />
      </template>
    </HomeLiveFeed>

    <HomeChannels
      v-if="home.channels.value.length"
      :content="content.channels"
      :channels="home.channels.value"
      :featured="home.featuredChannel.value"
      :base-path="base"
      :is-following="home.isFollowing"
      :followers-of="home.followersOf"
      :busy-id="home.followBusy.value"
      @follow="home.toggleFollow"
    />

    <HomePublishBand :content="content.publish" />
  </div>
</template>

<style scoped>
.home {
  background: var(--ds-bg);
  color: var(--ds-text);
  font-family: var(--ds-ui);
  font-size: 16px;
  line-height: 1.6;
}
.home__hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 32px;
  align-items: start;
  padding-block: 28px 48px;
}
@media (min-width: 980px) {
  .home__hero {
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    gap: 40px;
    padding-block: 52px 64px;
  }
}
</style>
