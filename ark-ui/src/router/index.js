import { createRouter, createWebHistory } from 'vue-router';
import OverviewPage from '../components/OverviewPage.vue';
import NetworkPage from '../components/NetworkPage.vue';
import FirmwarePage from '../components/FirmwarePage.vue';

const routes = [
  {
    path: '/',
    name: 'OverviewPage',
    component: OverviewPage
  },
  {
    path: '/connections-config',
    name: 'NetworkPage',
    component: NetworkPage
  },
  {
    path: '/firmware-upload',
    name: 'FirmwarePage',
    component: FirmwarePage
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
