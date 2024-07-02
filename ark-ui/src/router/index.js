import { createRouter, createWebHistory } from 'vue-router';
import OverviewPage from '../components/OverviewPage.vue';
import WiFiConfigPage from '../components/WiFiConfigPage.vue';
import FirmwareUploadPage from '../components/FirmwareUploadPage.vue';

const routes = [
  {
    path: '/',
    name: 'OverviewPage',
    component: OverviewPage
  },
  {
    path: '/wifi-config',
    name: 'WiFiConfigPage',
    component: WiFiConfigPage
  },
  {
    path: '/firmware-upload',
    name: 'FirmwareUploadPage',
    component: FirmwareUploadPage
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
