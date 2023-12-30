import { createRouter, createWebHistory } from 'vue-router'
import PinView from '../views/PinView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: PinView
    },
    {
      path: '/heatmap',
      name: 'heatmap',
      component: () => import('../views/HeatmapView.vue')
    }
  ]
})

export default router
