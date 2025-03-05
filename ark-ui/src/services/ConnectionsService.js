import axios from 'axios';

const API_URL = '/api'; // Using relative path for ARK-UI

export default {
  // Current connections
  async getCurrentConnections() {
    return axios.get(`${API_URL}/connections`);
  },
  
  async connectToNetwork(id) {
    return axios.post(`${API_URL}/connections/${id}/connect`);
  },
  
  async disconnectFromNetwork(id) {
    return axios.post(`${API_URL}/connections/${id}/disconnect`);
  },
  
  async configureConnection(id, config) {
    return axios.put(`${API_URL}/connections/${id}`, config);
  },
  
  // Available WiFi
  async scanWifiNetworks() {
    return axios.get(`${API_URL}/wifi/scan`);
  },
  
  async connectToWifi(ssid, password = null) {
    return axios.post(`${API_URL}/wifi/connect`, { ssid, password });
  },
  
  // Routing priorities
  async getRoutingPriorities() {
    return axios.get(`${API_URL}/routing`);
  },
  
  async updateRoutingPriorities(priorities) {
    return axios.put(`${API_URL}/routing`, { priorities });
  },
  
  // Data usage
  async getDataUsage(timeframe = '1h') {
    return axios.get(`${API_URL}/usage?timeframe=${timeframe}`);
  },
  
  // LTE specific
  async getLteStatus() {
    return axios.get(`${API_URL}/lte/status`);
  },
  
  async connectLte(apn = null) {
    return axios.post(`${API_URL}/lte/connect`, { apn });
  },
  
  async disconnectLte() {
    return axios.post(`${API_URL}/lte/disconnect`);
  }
};