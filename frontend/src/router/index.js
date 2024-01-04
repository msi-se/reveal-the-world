import { createRouter, createWebHistory } from 'vue-router'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/pin',
      name: 'pin',
      component: () => import('../views/PinView.vue'),
    },
    {
      path: '/heatmap',
      name: 'heatmap',
      component: () => import('../views/HeatmapView.vue'),
    }
  ]
})

export default router
