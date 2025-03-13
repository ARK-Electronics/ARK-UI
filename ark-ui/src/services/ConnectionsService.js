import axios from 'axios';

// Define all API endpoints centrally
const ENDPOINTS = {
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

  // Network usage statistics
  usage: `/network/usage`,

  // Hostname
  hostname: `/network/hostname`,

  // LTE specific
  lteStatus: `/network/lte/status`,
  lteConnect: `/network/lte/connect`,
  lteDisconnect: `/network/lte/disconnect`,
};

export default {
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
