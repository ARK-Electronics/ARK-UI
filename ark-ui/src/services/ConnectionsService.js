import axios from 'axios';

// Base API URL - all requests go through nginx which handles the routing
const API_URL = '/api';

// Define all API endpoints centrally
const ENDPOINTS = {
  // Connection management
  connections: `${API_URL}/network/connections`,
  connectionById: (id) => `${API_URL}/network/connections/${id}`,
  connectToNetwork: (id) => `${API_URL}/network/connections/${id}/connect`,
  disconnectFromNetwork: (id) => `${API_URL}/network/connections/${id}/disconnect`,
  
  // WiFi specific
  wifiScan: `${API_URL}/network/wifi/scan`,
  wifiConnect: `${API_URL}/network/wifi/connect`,
  
  // Routing
  routing: `${API_URL}/network/routing`,
  
  // Statistics endpoint removed
  
  // Hostname
  hostname: `${API_URL}/network/hostname`,
  
  // LTE specific
  lteStatus: `${API_URL}/network/lte/status`,
  lteConnect: `${API_URL}/network/lte/connect`,
  lteDisconnect: `${API_URL}/network/lte/disconnect`,
};

export default {
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