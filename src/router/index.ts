import { createRouter, createWebHistory } from 'vue-router'
import ArticleDetailView from '../views/ArticleDetailView.vue'
import ArticlesView from '../views/ArticlesView.vue'
import ChannelDetailView from '../views/ChannelDetailView.vue'
import ChannelsView from '../views/ChannelsView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import NewsFeedView from '../views/NewsFeedView.vue'
import ProfileView from '../views/ProfileView.vue'
import RegisterView from '../views/RegisterView.vue'
import StatsDataDetailView from '../views/StatsDataDetailView.vue'
import StatsDataView from '../views/StatsDataView.vue'
import TvProgrammeView from '../views/TvProgrammeView.vue'
import TvstatsView from '../views/TvstatsView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/articles',
      name: 'articles',
      component: ArticlesView,
    },
    {
      path: '/articles/:slug',
      name: 'article-detail',
      component: ArticleDetailView,
    },
    {
      path: '/statsdata',
      name: 'statsdata',
      component: StatsDataView,
    },
    {
      path: '/statsdata/:slug',
      name: 'statsdata-detail',
      component: StatsDataDetailView,
    },
    {
      path: '/chaines',
      name: 'channels',
      component: ChannelsView,
    },
    {
      path: '/chaines/:slug',
      name: 'channel-detail',
      component: ChannelDetailView,
    },
    {
      path: '/tvstats',
      name: 'tvstats',
      component: TvstatsView,
    },
    {
      path: '/tvstats/programme-tv',
      name: 'tvstats-programme-tv',
      component: TvProgrammeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        guestOnly: true,
      },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/fil-actus',
      name: 'news-feed',
      component: NewsFeedView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: {
        guestOnly: true,
      },
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.hasSession) {
    return { name: 'login' }
  }

  if (to.meta.guestOnly && authStore.hasSession) {
    return { name: 'profile' }
  }

  return true
})

export default router
