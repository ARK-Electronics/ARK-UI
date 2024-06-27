import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../components/HomePage.vue';
import WiFiConfig from '../components/WiFiConfig.vue';
import FirmwareUpload from '../components/FirmwareUpload.vue';

const routes = [
  {
    path: '/',
    name: 'HomePage',
    component: HomePage
  },
  {
    path: '/wifi-config',
    name: 'WiFiConfig',
    component: WiFiConfig
  },
  {
    path: '/firmware-upload',
    name: 'FirmwareUpload',
    component: FirmwareUpload
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
