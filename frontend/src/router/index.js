import { createRouter, createWebHistory } from 'vue-router'
import { getUser } from '../js/user';
import { PATH } from '../js/config';

const routeGuard = (fallback) => {
  return () => {
    if (getUser() === null) {
      return fallback;
    }
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: `/`,
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: `/pin`,
      name: 'pin',
      component: () => import('../views/PinView.vue'),
      beforeEnter: routeGuard(`/`)
    },
    {
      path: `/heatmap`,
      name: 'heatmap',
      component: () => import('../views/HeatmapView.vue'),
      beforeEnter: routeGuard(`/`)
    }
  ]
})

export default router
