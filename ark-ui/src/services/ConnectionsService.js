import axios from 'axios';

// Base API URL - all requests go through nginx which handles the routing
// const API_URL = '/api';

// Define all API endpoints centrally
const ENDPOINTS = {
  // Test endpoints (for development debugging)
  test: `/network/test`,
  debugRoutes: `/network/debug/routes`,

  // Connection management
  connections: `/network/connections`,
  connectionById: (id) => `/network/connections/${id}`,
  connectToNetwork: (id) => `/network/connections/${id}/connect`,
  disconnectFromNetwork: (id) => `/network/connections/${id}/disconnect`,
  
  // WiFi specific
  wifiScan: `/network/wifi/scan`,
  wifiConnect: `/network/wifi/connect`,
  
  // Routing
  routing: `/network/routing`,
  
  // Statistics endpoint removed
  
  // Hostname
  hostname: `/network/hostname`,
  
  // LTE specific
  lteStatus: `/network/lte/status`,
  lteConnect: `/network/lte/connect`,
  lteDisconnect: `/network/lte/disconnect`,
};

export default {
  // Test endpoints
  async testApi() {
    return axios.get(ENDPOINTS.test);
  },

  async getDebugRoutes() {
    return axios.get(ENDPOINTS.debugRoutes);
  },

  // Current connections
  async getConnections() {
    return axios.get(ENDPOINTS.connections);
  },
  
  async connectToNetwork(id) {
    return axios.post(ENDPOINTS.connectToNetwork(id));
  },
  
  async disconnectFromNetwork(id) {
    return axios.post(ENDPOINTS.disconnectFromNetwork(id));
  },
  
  async createConnection(config) {
    return axios.post(ENDPOINTS.connections, config);
  },
  
  async updateConnection(id, config) {
    return axios.put(ENDPOINTS.connectionById(id), config);
  },
  
  async deleteConnection(id) {
    return axios.delete(ENDPOINTS.connectionById(id));
  },
  
  // Available WiFi
  async scanWifiNetworks() {
    return axios.get(ENDPOINTS.wifiScan);
  },
  
  async connectToWifi(ssid, password = null) {
    return axios.post(ENDPOINTS.wifiConnect, { ssid, password });
  },
  
  // Routing priorities
  async getRoutingPriorities() {
    return axios.get(ENDPOINTS.routing);
  },
  
  async updateRoutingPriorities(priorities) {
    return axios.put(ENDPOINTS.routing, { priorities });
  },
  
  // Statistics method removed
  
  // Hostname
  async getHostname() {
    return axios.get(ENDPOINTS.hostname);
  },
  
  async setHostname(hostname) {
    return axios.post(ENDPOINTS.hostname, { hostname });
  },
  
  // LTE specific
  async getLteStatus() {
    return axios.get(ENDPOINTS.lteStatus);
  },
  
  async connectLte(apn = null) {
    return axios.post(ENDPOINTS.lteConnect, { apn });
  },
  
  async disconnectLte() {
    return axios.post(ENDPOINTS.lteDisconnect);
  }
};
