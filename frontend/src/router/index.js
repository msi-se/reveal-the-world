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
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/heatmap',
      name: 'heatmap',
      component: () => import('../views/HeatmapView.vue')
    }
  ]
})

export default router