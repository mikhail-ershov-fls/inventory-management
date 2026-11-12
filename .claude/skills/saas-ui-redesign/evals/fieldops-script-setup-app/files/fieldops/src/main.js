import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'
import Dashboard from './views/Dashboard.vue'
import Jobs from './views/Jobs.vue'
import Technicians from './views/Technicians.vue'
import Settings from './views/Settings.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Dashboard },
    { path: '/jobs', component: Jobs },
    { path: '/technicians', component: Technicians },
    { path: '/settings', component: Settings }
  ]
})
createApp(App).use(router).mount('#app')
