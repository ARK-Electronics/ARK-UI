import axios from 'axios';

const ENDPOINTS = {
  jetson: `/api/system/stats`,
};

export default {
  async getJetsonInfo() {
    return axios.get(ENDPOINTS.jetson);
  },
};
