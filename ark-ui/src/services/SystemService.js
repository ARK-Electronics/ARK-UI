import axios from 'axios';

const ENDPOINTS = {
  jetson: `/api/system/stats`,
  hostname: `/api/system/hostname`,
};

export default {
  async getJetsonInfo() {
    return axios.get(ENDPOINTS.jetson);
  },

  async changeHostname(hostname) {
    return axios.post(ENDPOINTS.hostname, { hostname });
  },
};
