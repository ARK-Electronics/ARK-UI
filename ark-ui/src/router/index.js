import { createRouter, createWebHistory } from 'vue-router';
import ServicesPage from '../components/ServicesPage.vue';
import ConnectionsPage from '../components/ConnectionsPage.vue';
import AutopilotPage from '../components/AutopilotPage.vue';

const routes = [
  {
    path: '/',
    name: 'AutopilotPage',
    component: AutopilotPage
  },
  {
    path: '/connections-page',
    name: 'ConnectionsPage',
    component: ConnectionsPage
  },
  {
    path: '/services-page',
    name: 'ServicesPage',
    component: ServicesPage
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
