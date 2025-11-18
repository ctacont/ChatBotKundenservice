import { createRouter, createWebHistory } from 'vue-router'
import Chatbot from './Chatbot.vue'
import Admin from './Admin.vue'

const routes = [
  {
    path: '/',
    name: 'Chatbot',
    component: Chatbot
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
