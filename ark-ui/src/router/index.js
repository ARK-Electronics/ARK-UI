import { createRouter, createWebHistory } from 'vue-router';
import OverviewPage from '../components/OverviewPage.vue';
import WifiPage from '../components/WifiPage.vue';
import FirmwarePage from '../components/FirmwarePage.vue';

const routes = [
  {
    path: '/',
    name: 'OverviewPage',
    component: OverviewPage
  },
  {
    path: '/wifi-config',
    name: 'WifiPage',
    component: WifiPage
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
