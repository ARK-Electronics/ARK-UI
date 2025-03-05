<template>
  <div class="page-container">
    <!-- Header -->
    <div class="header-container">
      <h1 class="page-title">Network Connections Manager</h1>
      <div>
        <button @click="handleRefresh" class="refresh-button">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': refreshing }"></i>
          Refresh
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs-container">
      <button 
        class="tab-button"
        :class="{ 'active': activeSection === 'current' }"
        @click="activeSection = 'current'"
      >
        Current Connections
      </button>
      <button 
        class="tab-button"
        :class="{ 'active': activeSection === 'available' }"
        @click="activeSection = 'available'"
      >
        Available WiFi
      </button>
      <button 
        class="tab-button"
        :class="{ 'active': activeSection === 'priorities' }"
        @click="activeSection = 'priorities'"
      >
        Routing Priorities
      </button>
      <button 
        class="tab-button"
        :class="{ 'active': activeSection === 'usage' }"
        @click="activeSection = 'usage'"
      >
        Data Usage
      </button>
      <button 
        class="tab-button"
        :class="{ 'active': activeSection === 'lte' }"
        @click="activeSection = 'lte'"
        data-tab="lte"
      >
        LTE Modem
      </button>
    </div>

    <!-- Current Connections Section -->
    <div v-if="activeSection === 'current'" class="section-container">
      <div class="section-header">
        <h2 class="section-title">Current Connections</h2>
        <button @click="showAddConnectionForm" class="add-button">
          <i class="fas fa-plus"></i>
          Add Connection
        </button>
      </div>

      <div class="table-container">
        <table class="connections-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Signal</th>
              <th>Data Rate</th>
              <th>IP Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="connection in connections" 
              :key="connection.id"
              :class="{ 'active-row': connection.status === 'active' }"
            >
              <td>
                <div class="connection-name">
                  <span v-html="getConnectionIcon(connection.type, connection.status)"></span>
                  <span>{{ connection.name }}</span>
                </div>
              </td>
              <td class="capitalize">{{ connection.type }}</td>
              <td>
                <span class="status-badge" :class="connection.status">
                  {{ connection.status }}
                </span>
              </td>
              <td>
                <div v-if="connection.type !== 'ethernet'" class="signal-container">
                  <div class="signal-bar" :style="{ width: `${connection.signalStrength}%` }" :class="getSignalClass(connection.signalStrength)"></div>
                </div>
                <span v-else class="wired-signal">Wired (100%)</span>
              </td>
              <td>{{ connection.status === 'active' ? formatDataRate(connection.dataRate) : '-' }}</td>
              <td>{{ connection.status === 'active' ? connection.ipAddress : '-' }}</td>
              <td class="actions">
                <button @click="configureConnection(connection)" class="icon-button configure">
                  <i class="fas fa-cog"></i>
                </button>
                <button 
                  @click="toggleConnection(connection)" 
                  class="icon-button"
                  :class="connection.status === 'active' ? 'disconnect' : 'connect'"
                >
                  <i :class="connection.status === 'active' ? 'fas fa-stop' : 'fas fa-play'"></i>
                </button>
                <button @click="deleteConnection(connection)" class="icon-button delete">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
            <tr v-if="connections.length === 0">
              <td colspan="7" class="empty-state">
                <div class="empty-message">
                  <i class="fas fa-network-wired"></i>
                  <p>No connections found</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Available WiFi Section -->
    <div v-if="activeSection === 'available'" class="section-container">
      <div class="section-header">
        <h2 class="section-title">Available WiFi Networks</h2>
        <button @click="scanWifi" class="scan-button">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': scanning }"></i>
          Scan
        </button>
      </div>

      <div class="wifi-networks-container">
        <div v-if="scanning" class="scanning-overlay">
          <div class="spinner"></div>
          <p>Scanning for networks...</p>
        </div>

        <div 
          v-for="network in availableWifiNetworks" 
          :key="network.ssid"
          class="wifi-network-item"
          :class="{ 'connected': network.connected }"
        >
          <div class="wifi-info">
            <i class="fas fa-wifi" :class="getSignalClass(network.signalStrength)"></i>
            <div class="wifi-details">
              <span class="wifi-name">{{ network.ssid }}</span>
              <span v-if="network.secured" class="security-badge">Secured</span>
            </div>
          </div>
          
          <div class="wifi-signal">
            <div class="signal-container">
              <div class="signal-bar" :style="{ width: `${network.signalStrength}%` }" :class="getSignalClass(network.signalStrength)"></div>
            </div>
            <span class="signal-value">{{ network.signalStrength }}%</span>
          </div>
          
          <button 
            @click="connectToWifi(network)" 
            class="wifi-connect-button"
            :class="{ 'connected': network.connected }"
          >
            {{ network.connected ? 'Connected' : 'Connect' }}
          </button>
        </div>

        <div v-if="availableWifiNetworks.length === 0 && !scanning" class="empty-state">
          <div class="empty-message">
            <i class="fas fa-wifi"></i>
            <p>No WiFi networks found</p>
            <button @click="scanWifi" class="scan-button-empty">Scan for Networks</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Routing Priorities Section -->
    <div v-if="activeSection === 'priorities'" class="section-container">
      <div class="section-header">
        <h2 class="section-title">Connection Priorities</h2>
        <button 
          @click="savePriorities" 
          class="save-button"
          :disabled="!prioritiesChanged"
        >
          <i class="fas fa-save"></i>
          Save Changes
        </button>
      </div>

      <div class="priorities-container">
        <div 
          v-for="(connection, index) in routingPriorities" 
          :key="connection.id"
          class="priority-item"
        >
          <div class="priority-info">
            <div class="priority-badge">{{ connection.priority }}</div>
            <span v-html="getConnectionIcon(connection.type, 'active')"></span>
            <span class="priority-name">{{ connection.name }}</span>
            <span class="type-badge">{{ connection.type }}</span>
          </div>

          <div class="priority-actions">
            <button 
              @click="movePriority(connection.id, 'up')"
              :disabled="index === 0"
              class="priority-button"
              :class="{ 'disabled': index === 0 }"
            >
              <i class="fas fa-arrow-up"></i>
            </button>
            <button 
              @click="movePriority(connection.id, 'down')"
              :disabled="index === routingPriorities.length - 1"
              class="priority-button"
              :class="{ 'disabled': index === routingPriorities.length - 1 }"
            >
              <i class="fas fa-arrow-down"></i>
            </button>
          </div>
        </div>

        <div v-if="routingPriorities.length === 0" class="empty-state">
          <div class="empty-message">
            <i class="fas fa-random"></i>
            <p>No active connections to prioritize</p>
          </div>
        </div>
      </div>

      <div class="routing-info-panel">
        <h3 class="info-title">Current Routing</h3>
        <p v-if="activeRoute" class="info-content">
          Internet traffic is currently routed through <strong>{{ activeRoute.name }}</strong> (Priority {{ activeRoute.priority }})
        </p>
        <p v-else class="info-content">No active route to the internet</p>
      </div>
    </div>

    <!-- Data Usage Section -->
    <div v-if="activeSection === 'usage'" class="section-container">
      <div class="section-header">
        <h2 class="section-title">Data Usage</h2>
        <div class="timeframe-selector">
          <select v-model="selectedTimeframe" class="timeframe-dropdown">
            <option value="1h">Last 1 hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
      </div>

      <div class="usage-container">
        <div class="chart-container">
          <div class="simple-chart">
            <div v-for="(item, index) in usageData" :key="index" class="chart-bar-group">
              <div class="chart-label">{{ item.name }}</div>
              <div class="chart-bars">
                <div class="chart-bar-container">
                  <div class="chart-bar download" :style="{ width: `${(item.dataDown / maxDataRate) * 100}%` }"></div>
                  <div class="chart-value">{{ item.dataDown }} Mbps</div>
                </div>
                <div class="chart-bar-container">
                  <div class="chart-bar upload" :style="{ width: `${(item.dataUp / maxDataRate) * 100}%` }"></div>
                  <div class="chart-value">{{ item.dataUp }} Mbps</div>
                </div>
              </div>
            </div>
            <div v-if="usageData.length === 0" class="chart-empty">
              <span>No data available</span>
            </div>
          </div>
        </div>

        <div class="usage-details">
          <div 
            v-for="item in usageData" 
            :key="item.name"
            class="usage-item"
          >
            <div class="usage-item-header">
              <span class="usage-name">{{ item.name }}</span>
              <span class="usage-total">{{ (item.dataDown + item.dataUp).toFixed(1) }} Mbps total</span>
            </div>

            <div class="usage-bars">
              <div class="usage-bar-group">
                <div class="usage-bar-label">
                  <span>Download</span>
                  <span class="download-value">{{ item.dataDown }} Mbps</span>
                </div>
                <div class="usage-bar-container">
                  <div class="usage-bar download" :style="{ width: `${(item.dataDown / maxDataRate) * 100}%` }"></div>
                </div>
              </div>

              <div class="usage-bar-group">
                <div class="usage-bar-label">
                  <span>Upload</span>
                  <span class="upload-value">{{ item.dataUp }} Mbps</span>
                </div>
                <div class="usage-bar-container">
                  <div class="usage-bar upload" :style="{ width: `${(item.dataUp / maxDataRate) * 100}%` }"></div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="usageData.length === 0" class="empty-state">
            <div class="empty-message">
              <i class="fas fa-chart-bar"></i>
              <p>No data usage information available</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Connection Form Dialog -->
    <div v-if="showConnectionForm" class="dialog-overlay">
      <div class="dialog-container">
        <div class="dialog-header">
          <h3 class="dialog-title">{{ isEditingConnection ? 'Edit' : 'Add' }} Connection</h3>
          <button @click="closeConnectionForm" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="dialog-content">
          <div v-if="!connectionType" class="connection-type-selector">
            <div class="connection-type-title">Select Connection Type</div>
            <div class="connection-type-options">
              <button 
                @click="selectConnectionType('wifi')" 
                class="connection-type-button"
              >
                <i class="fas fa-wifi"></i>
                <span>WiFi</span>
              </button>
              <button 
                @click="selectConnectionType('ethernet')" 
                class="connection-type-button"
              >
                <i class="fas fa-network-wired"></i>
                <span>Ethernet</span>
              </button>
              <!-- LTE connection type removed - LTE handled in dedicated tab -->
            </div>
          </div>

          <!-- WiFi Connection Form -->
          <form v-if="connectionType === 'wifi'" @submit.prevent="saveConnection" class="connection-form">
            <div class="form-group">
              <label for="wifi-mode">Connection Mode:</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input type="radio" v-model="newConnection.mode" value="infrastructure" id="mode-client">
                  <span>Station (Client)</span>
                </label>
                <label class="radio-option">
                  <input type="radio" v-model="newConnection.mode" value="ap" id="mode-ap">
                  <span>Access Point (Hotspot)</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label for="wifi-ssid">SSID:</label>
              <input type="text" id="wifi-ssid" v-model="newConnection.ssid" required>
            </div>

            <div class="form-group">
              <label for="wifi-password">Password:</label>
              <div class="password-input">
                <input 
                  :type="passwordVisible ? 'text' : 'password'" 
                  id="wifi-password" 
                  v-model="newConnection.password" 
                  required
                >
                <button 
                  type="button" 
                  @click="togglePasswordVisibility" 
                  class="password-toggle"
                >
                  <i :class="passwordVisible ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
            </div>

            <div v-if="newConnection.mode === 'infrastructure'" class="form-group">
              <label for="wifi-autoconnect">Auto-Connect:</label>
              <div class="toggle-switch">
                <input type="checkbox" id="wifi-autoconnect" v-model="newConnection.autoconnect">
                <span class="toggle-slider"></span>
              </div>
            </div>

            <div class="form-buttons">
              <button type="button" @click="closeConnectionForm" class="cancel-button">Cancel</button>
              <button type="submit" class="submit-button">
                {{ isEditingConnection ? 'Update' : 'Add' }} Connection
              </button>
            </div>
          </form>

          <!-- Ethernet Connection Form -->
          <form v-if="connectionType === 'ethernet'" @submit.prevent="saveConnection" class="connection-form">
            <div class="form-group">
              <label for="ethernet-name">Connection Name:</label>
              <input type="text" id="ethernet-name" v-model="newConnection.name" required>
            </div>

            <div class="form-group">
              <label for="ethernet-method">IP Configuration:</label>
              <select id="ethernet-method" v-model="newConnection.ipMethod">
                <option value="auto">Automatic (DHCP)</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div v-if="newConnection.ipMethod === 'manual'" class="manual-ip-section">
              <div class="form-group">
                <label for="ethernet-ip">IP Address:</label>
                <input type="text" id="ethernet-ip" v-model="newConnection.ipAddress" placeholder="192.168.1.100">
              </div>

              <div class="form-group">
                <label for="ethernet-gateway">Gateway:</label>
                <input type="text" id="ethernet-gateway" v-model="newConnection.gateway" placeholder="192.168.1.1">
              </div>

              <div class="form-group">
                <label for="ethernet-prefix">Prefix Length:</label>
                <input type="number" id="ethernet-prefix" v-model="newConnection.prefix" min="1" max="32" placeholder="24">
              </div>

              <div class="form-group">
                <label for="ethernet-dns1">DNS Server 1:</label>
                <input type="text" id="ethernet-dns1" v-model="newConnection.dns1" placeholder="8.8.8.8">
              </div>

              <div class="form-group">
                <label for="ethernet-dns2">DNS Server 2:</label>
                <input type="text" id="ethernet-dns2" v-model="newConnection.dns2" placeholder="8.8.4.4">
              </div>
            </div>

            <div class="form-buttons">
              <button type="button" @click="closeConnectionForm" class="cancel-button">Cancel</button>
              <button type="submit" class="submit-button">
                {{ isEditingConnection ? 'Update' : 'Add' }} Connection
              </button>
            </div>
          </form>

          <!-- LTE Connection Form removed - LTE handled in dedicated tab -->
        </div>
      </div>
    </div>

    <!-- WiFi Password Dialog -->
    <div v-if="showWifiPasswordDialog" class="dialog-overlay">
      <div class="dialog-container wifi-password-dialog">
        <div class="dialog-header">
          <h3 class="dialog-title">Connect to {{ selectedWifiNetwork.ssid }}</h3>
          <button @click="closeWifiPasswordDialog" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="dialog-content">
          <form @submit.prevent="connectToWifiWithPassword" class="wifi-password-form">
            <div class="form-group">
              <label for="wifi-connect-password">Password:</label>
              <div class="password-input">
                <input 
                  :type="passwordVisible ? 'text' : 'password'" 
                  id="wifi-connect-password" 
                  v-model="wifiPassword" 
                  required
                >
                <button 
                  type="button" 
                  @click="togglePasswordVisibility" 
                  class="password-toggle"
                >
                  <i :class="passwordVisible ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
            </div>

            <div class="form-buttons">
              <button type="button" @click="closeWifiPasswordDialog" class="cancel-button">Cancel</button>
              <button type="submit" class="submit-button">Connect</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- LTE Modem Section -->
    <div v-if="activeSection === 'lte'" class="section-container">
      <div class="section-header">
        <h2 class="section-title">LTE Modem</h2>
        <div class="header-buttons">
          <button @click="refreshLteStatus" class="refresh-button">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': refreshingLte }"></i>
            Refresh
          </button>
        </div>
      </div>

      <div v-if="loadingLte" class="loading-container">
        <div class="spinner"></div>
        <p>Loading LTE modem information...</p>
      </div>

      <div v-else-if="lteStatus.status === 'not_found'" class="empty-state">
        <div class="empty-message">
          <i class="fas fa-broadcast-tower"></i>
          <p>No LTE modem detected</p>
        </div>
      </div>

      <div v-else-if="lteStatus.status === 'error'" class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error fetching LTE status: {{ lteStatus.message }}</p>
      </div>

      <div v-else>
        <div class="lte-info-grid">
          <div class="lte-info-card">
            <div class="info-label">Model</div>
            <div class="info-value">{{ lteStatus.model }}</div>
          </div>
          <div class="lte-info-card">
            <div class="info-label">Operator</div>
            <div class="info-value">{{ lteStatus.operator }}</div>
          </div>
          <div class="lte-info-card">
            <div class="info-label">State</div>
            <div class="info-value" :class="lteStatus.connected ? 'text-success' : ''">
              {{ lteStatus.state }}
            </div>
          </div>
          <div class="lte-info-card">
            <div class="info-label">Signal</div>
            <div class="info-value">
              <div class="signal-container">
                <div class="signal-bar" :style="{ width: `${lteStatus.signal}%` }" :class="getSignalClass(lteStatus.signal)"></div>
              </div>
              <span>{{ lteStatus.signal }}%</span>
            </div>
          </div>
          <div class="lte-info-card">
            <div class="info-label">APN</div>
            <div class="info-value">{{ lteStatus.apn || 'Not set' }}</div>
          </div>
          <div class="lte-info-card">
            <div class="info-label">IP Address</div>
            <div class="info-value">{{ lteStatus.ip_address || 'Not available' }}</div>
          </div>
        </div>

        <div class="lte-connection-panel">
          <h3 class="panel-title">LTE Connection</h3>
          
          <div v-if="!lteStatus.connected" class="lte-connect-form">
            <div class="form-group">
              <label for="lte-apn">APN:</label>
              <div class="apn-input-container">
                <input type="text" id="lte-apn" v-model="lteApn" 
                  :placeholder="lteStatus.detectedApn ? 
                    `Auto-detected: ${lteStatus.detectedApn}` : 
                    'Enter APN (e.g. fast.t-mobile.com)'">
                <div v-if="lteStatus.detectedApn" class="detected-apn-info">
                  <i class="fas fa-info-circle"></i>
                  <span>APN detected from carrier: {{ lteStatus.operator }}</span>
                </div>
              </div>
            </div>
            <button 
              @click="connectLte" 
              class="connect-button"
            >
              Connect
            </button>
          </div>
          
          <div v-else class="lte-connected-info">
            <div class="connected-message">
              <i class="fas fa-check-circle"></i>
              <p>Connected to LTE network via APN: <strong>{{ lteStatus.apn }}</strong></p>
            </div>
            <button @click="disconnectLte" class="disconnect-button">
              Disconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ConnectionsService from '../services/ConnectionsService';

export default {
  data() {
    return {
      activeSection: 'current',
      refreshing: false,
      scanning: false,
      connections: [],
      availableWifiNetworks: [],
      routingPriorities: [],
      usageData: [],
      selectedTimeframe: '1h',
      prioritiesChanged: false,
      
      // Connection form
      showConnectionForm: false,
      connectionType: null,
      isEditingConnection: false,
      passwordVisible: false,
      
      // WiFi password dialog
      showWifiPasswordDialog: false,
      selectedWifiNetwork: null,
      wifiPassword: '',
      
      // LTE specific
      lteStatus: { status: 'loading' },
      loadingLte: true,
      refreshingLte: false,
      lteApn: '',
      lteDetectedApn: '',
      lteDetectedCarrier: '',
      
      // New connection data
      newConnection: {
        id: null,
        name: '',
        type: '',
        
        // WiFi specific
        ssid: '',
        password: '',
        mode: 'infrastructure',
        autoconnect: true,
        
        // Ethernet specific
        ipMethod: 'auto',
        ipAddress: '',
        gateway: '',
        prefix: 24,
        dns1: '',
        dns2: '',
        
        // LTE specific
        apn: '',
        username: '',
        ltePassword: '',
        dataLimit: 0,
        ltePriority: 'low'
      },
      
      // Refresh intervals
      dataRefreshInterval: null,
      
      // UI states
      loadingConnections: false,
      loadingWifi: false,
      loadingRouting: false,
      loadingUsage: false
    };
  },
  
  computed: {
    // Get the highest priority active connection (active route)
    activeRoute() {
      if (this.routingPriorities.length === 0) return null;
      return this.routingPriorities[0];
    },
    
    // Calculate the maximum data rate for scaling the usage bars
    maxDataRate() {
      if (this.usageData.length === 0) return 100;
      
      let max = 0;
      this.usageData.forEach(item => {
        max = Math.max(max, item.dataDown, item.dataUp);
      });
      
      return max > 0 ? max : 100;
    }
  },
  
  async mounted() {
    // Initial data fetch
    await this.fetchAll();
    
    // Set up automatic refresh every 10 seconds
    this.dataRefreshInterval = setInterval(this.fetchAll, 10000);
    
    // Add event listener for section changes
    this.$watch('activeSection', (newSection) => {
      // Load data based on the active section
      switch (newSection) {
        case 'current':
          this.fetchConnections();
          break;
        case 'available':
          this.scanWifi();
          break;
        case 'priorities':
          this.fetchRoutingPriorities();
          break;
        case 'usage':
          // Usage tab shows placeholder data
          this.fetchUsageData();
          break;
        case 'lte':
          this.fetchLteStatus();
          break;
      }
    });
  },
  
  beforeUnmount() {
    // Clean up intervals when component is destroyed
    if (this.dataRefreshInterval) {
      clearInterval(this.dataRefreshInterval);
    }
  },
  
  watch: {
    // Watch section changes (usage tab uses placeholder data)
    activeSection() {
      // Statistics functionality removed
    },
    
    // When timeframe changes, update usage data with placeholder values
    selectedTimeframe() {
      // Statistics functionality removed
      this.fetchUsageData();
    }
  },
  
  methods: {
    // --- Data Fetching ---
    
    async fetchAll() {
      try {
        // Load data for the active section only to improve performance
        switch (this.activeSection) {
          case 'current':
            await this.fetchConnections();
            break;
          case 'available':
            await this.scanWifi();
            break;
          case 'priorities':
            await this.fetchRoutingPriorities();
            break;
          case 'usage':
            // Statistics functionality removed
            this.fetchUsageData();
            break;
          case 'lte':
            await this.fetchLteStatus();
            break;
          default:
            // Fallback to loading connections data
            await this.fetchConnections();
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    },
    
    async fetchConnections() {
      try {
        const response = await ConnectionsService.getConnections();
        this.connections = response.data;
      } catch (error) {
        console.error('Failed to fetch connections:', error);
      }
    },
    
    async scanWifi() {
      this.scanning = true;
      try {
        const response = await ConnectionsService.scanWifiNetworks();
        this.availableWifiNetworks = response.data;
      } catch (error) {
        console.error('Failed to scan WiFi networks:', error);
      } finally {
        this.scanning = false;
      }
    },
    
    async fetchRoutingPriorities() {
      try {
        const response = await ConnectionsService.getRoutingPriorities();
        this.routingPriorities = response.data;
        this.prioritiesChanged = false;
      } catch (error) {
        console.error('Failed to fetch routing priorities:', error);
      }
    },
    
    async fetchUsageData() {
      // Statistics feature removed - provide sample placeholder data
      this.usageData = [
        {
          name: 'Ethernet',
          dataDown: 1.5,
          dataUp: 0.5,
          totalData: 2.0
        },
        {
          name: 'WiFi',
          dataDown: 0.8,
          dataUp: 0.2,
          totalData: 1.0
        }
      ];
    },
    
    // --- UI Actions ---
    
    async handleRefresh() {
      this.refreshing = true;
      await this.fetchAll();
      this.refreshing = false;
    },
    
    // --- LTE Management ---
    
    async fetchLteStatus() {
      this.loadingLte = true;
      try {
        const response = await ConnectionsService.getLteStatus();
        this.lteStatus = response.data;
        
        // Update APN field with current or detected value
        if (response.data.connected && response.data.apn) {
          this.lteApn = response.data.apn;
        } else if (response.data.detectedApn && !this.lteApn) {
          // Only set detected APN if user hasn't entered anything
          this.lteDetectedApn = response.data.detectedApn;
          this.lteDetectedCarrier = response.data.operator;
        }
        
        // Hide the LTE tab if not available
        if (response.data.status === 'not_available') {
          // Hide LTE tab
          const lteTab = document.querySelector('.tab-button[data-tab="lte"]');
          if (lteTab) {
            lteTab.style.display = 'none';
          }
          
          // Switch to another tab if currently on LTE tab
          if (this.activeSection === 'lte') {
            this.activeSection = 'current';
          }
        }
      } catch (error) {
        console.error('Failed to fetch LTE status:', error);
        this.lteStatus = { status: 'error', message: error.message || 'Failed to fetch LTE status' };
      } finally {
        this.loadingLte = false;
      }
    },
    
    async refreshLteStatus() {
      this.refreshingLte = true;
      await this.fetchLteStatus();
      this.refreshingLte = false;
    },
    
    async connectLte() {
      try {
        // If user left APN blank but we have a detected one, use that
        const apnToUse = this.lteApn || (this.lteStatus.detectedApn || null);
        
        await ConnectionsService.connectLte(apnToUse);
        
        // Wait for connection to be established
        setTimeout(async () => {
          await this.refreshLteStatus();
        }, 2000);
      } catch (error) {
        console.error('Failed to connect to LTE:', error);
        alert('Failed to connect to LTE. Please check your APN settings and try again.');
      }
    },
    
    async disconnectLte() {
      try {
        await ConnectionsService.disconnectLte();
        
        // Wait for disconnection to complete
        setTimeout(async () => {
          await this.refreshLteStatus();
        }, 2000);
      } catch (error) {
        console.error('Failed to disconnect from LTE:', error);
        alert('Failed to disconnect from LTE network.');
      }
    },
    
    
    // --- Connection Management ---
    
    async toggleConnection(connection) {
      try {
        if (connection.status === 'active') {
          await ConnectionsService.disconnectFromNetwork(connection.id);
        } else {
          await ConnectionsService.connectToNetwork(connection.id);
        }
        
        // Refresh connections
        await this.fetchConnections();
      } catch (error) {
        console.error('Failed to toggle connection:', error);
      }
    },
    
    async configureConnection(connection) {
      this.isEditingConnection = true;
      this.connectionType = connection.type;
      
      // Clone the connection to avoid modifying the original
      this.newConnection = {
        id: connection.id,
        name: connection.name,
        type: connection.type
      };
      
      // Add type-specific properties
      if (connection.type === 'wifi') {
        this.newConnection.ssid = connection.ssid || '';
        this.newConnection.password = '';  // Don't show existing password
        this.newConnection.mode = connection.mode || 'infrastructure';
        this.newConnection.autoconnect = true;
      } else if (connection.type === 'ethernet') {
        this.newConnection.ipMethod = 'auto';
        this.newConnection.ipAddress = connection.ipAddress || '';
        this.newConnection.gateway = '';
        this.newConnection.prefix = 24;
        this.newConnection.dns1 = '';
        this.newConnection.dns2 = '';
      } else if (connection.type === 'lte') {
        this.newConnection.apn = connection.apn || '';
        this.newConnection.username = '';
        this.newConnection.ltePassword = '';
        this.newConnection.dataLimit = 0;
        this.newConnection.ltePriority = 'low';
      }
      
      this.showConnectionForm = true;
    },
    
    async deleteConnection(connection) {
      if (!confirm(`Are you sure you want to delete the connection "${connection.name}"?`)) {
        return;
      }
      
      try {
        await ConnectionsService.deleteConnection(connection.id);
        await this.fetchConnections();
      } catch (error) {
        console.error('Failed to delete connection:', error);
      }
    },
    
    // --- WiFi Management ---
    
    connectToWifi(network) {
      if (network.connected) {
        return;  // Already connected
      }
      
      if (network.secured) {
        // Show password dialog for secured networks
        this.selectedWifiNetwork = network;
        this.wifiPassword = '';
        this.showWifiPasswordDialog = true;
      } else {
        // Connect directly to open networks
        this.connectToWifiNetwork(network.ssid);
      }
    },
    
    async connectToWifiWithPassword() {
      if (!this.selectedWifiNetwork) return;
      
      await this.connectToWifiNetwork(this.selectedWifiNetwork.ssid, this.wifiPassword);
      this.closeWifiPasswordDialog();
    },
    
    async connectToWifiNetwork(ssid, password = null) {
      try {
        await ConnectionsService.connectToWifi(ssid, password);
        
        // Refresh connections and available networks
        await this.fetchConnections();
        await this.scanWifi();
      } catch (error) {
        console.error('Failed to connect to WiFi:', error);
        alert('Failed to connect to WiFi network. Please check your password and try again.');
      }
    },
    
    closeWifiPasswordDialog() {
      this.showWifiPasswordDialog = false;
      this.selectedWifiNetwork = null;
      this.wifiPassword = '';
    },
    
    // --- Priority Management ---
    
    movePriority(id, direction) {
      const priorities = [...this.routingPriorities];
      const index = priorities.findIndex(item => item.id === id);
      
      if (index === -1) return;
      
      if (direction === 'up' && index > 0) {
        // Swap with previous item
        [priorities[index], priorities[index - 1]] = [priorities[index - 1], priorities[index]];
      } else if (direction === 'down' && index < priorities.length - 1) {
        // Swap with next item
        [priorities[index], priorities[index + 1]] = [priorities[index + 1], priorities[index]];
      } else {
        return;  // No change needed
      }
      
      // Update priorities
      priorities.forEach((item, i) => {
        item.priority = i + 1;
      });
      
      this.routingPriorities = priorities;
      this.prioritiesChanged = true;
    },
    
    async savePriorities() {
      try {
        await ConnectionsService.updateRoutingPriorities(this.routingPriorities);
        this.prioritiesChanged = false;
        
        // Refresh connections after changing priorities
        await this.fetchConnections();
        await this.fetchRoutingPriorities();
      } catch (error) {
        console.error('Failed to save priorities:', error);
      }
    },
    
    // --- Connection Form Management ---
    
    showAddConnectionForm() {
      this.showConnectionForm = true;
      this.connectionType = null;
      this.isEditingConnection = false;
      this.resetNewConnection();
    },
    
    selectConnectionType(type) {
      this.connectionType = type;
      this.resetNewConnection();
      this.newConnection.type = type;
      
      // Set default values based on connection type
      if (type === 'wifi') {
        this.newConnection.mode = 'infrastructure';
      } else if (type === 'lte') {
        this.newConnection.name = 'LTE Connection';
      } else if (type === 'ethernet') {
        this.newConnection.name = 'Ethernet Connection';
      }
    },
    
    resetNewConnection() {
      this.newConnection = {
        id: null,
        name: '',
        type: '',
        
        // WiFi specific
        ssid: '',
        password: '',
        mode: 'infrastructure',
        autoconnect: true,
        
        // Ethernet specific
        ipMethod: 'auto',
        ipAddress: '',
        gateway: '',
        prefix: 24,
        dns1: '',
        dns2: '',
        
        // LTE specific
        apn: '',
        username: '',
        ltePassword: '',
        dataLimit: 0,
        ltePriority: 'low'
      };
    },
    
    async saveConnection() {
      try {
        const payload = { ...this.newConnection };
        
        // Handle LTE password and priority
        if (this.connectionType === 'lte') {
          payload.password = payload.ltePassword;
          delete payload.ltePassword;
          
          payload.priority = payload.ltePriority;
          delete payload.ltePriority;
        }
        
        if (this.isEditingConnection) {
          await ConnectionsService.updateConnection(payload.id, payload);
        } else {
          await ConnectionsService.createConnection(payload);
        }
        
        // Close form and refresh data
        this.closeConnectionForm();
        await this.fetchConnections();
      } catch (error) {
        console.error('Failed to save connection:', error);
        alert('Failed to save connection. Please check your settings and try again.');
      }
    },
    
    closeConnectionForm() {
      this.showConnectionForm = false;
      this.connectionType = null;
      this.isEditingConnection = false;
    },
    
    togglePasswordVisibility() {
      this.passwordVisible = !this.passwordVisible;
    },
    
    // --- Helper Methods ---
    
    getConnectionIcon(type, status) {
      if (type === 'wifi') {
        return status === 'active' 
          ? '<i class="fas fa-wifi connection-icon wifi"></i>' 
          : '<i class="fas fa-wifi-slash connection-icon wifi-inactive"></i>';
      } else if (type === 'ethernet') {
        return '<i class="fas fa-network-wired connection-icon ethernet"></i>';
      } else if (type === 'lte') {
        return '<i class="fas fa-broadcast-tower connection-icon lte"></i>';
      }
      
      return '<i class="fas fa-question-circle connection-icon unknown"></i>';
    },
    
    getSignalClass(strength) {
      if (strength >= 70) return 'signal-strong';
      if (strength >= 40) return 'signal-medium';
      return 'signal-weak';
    },
    
    formatDataRate(rate) {
      if (!rate) return '0 Kbps';
      
      if (rate < 1) {
        return `${(rate * 1000).toFixed(0)} Kbps`;
      } else if (rate < 1000) {
        return `${rate.toFixed(1)} Mbps`;
      } else {
        return `${(rate / 1000).toFixed(1)} Gbps`;
      }
    }
  }
};
</script>

<style scoped>
/* ARK Color Variables */
:root {
  --ark-color-black: rgba(0, 0, 0, 0.65);
  --ark-color-black-bold: rgba(0, 0, 0, 1);
  --ark-color-black-shadow: rgba(0, 0, 0, 0.1);
  --ark-color-white: rgba(255, 255, 255, 1);
  --ark-color-green: rgba(0, 187, 49, 1);
  --ark-color-green-hover: rgba(0, 187, 49, 0.65);
  --ark-color-green-shadow: rgba(0, 187, 49, 0.1);
  --ark-color-blue: rgba(52, 152, 219, 1);
  --ark-color-red: rgba(244, 67, 54, 1);
  --ark-color-red-hover: rgba(244, 67, 54, 0.65);
  --ark-color-orange: rgba(255, 140, 0, 1);
}

/* Layout */
.page-container {
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  gap: 20px;
}

.header-container, .header-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--ark-color-white);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px var(--ark-color-black-shadow);
}

.header-buttons {
  background: none;
  padding: 0;
  box-shadow: none;
  gap: 10px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--ark-color-black-bold);
  margin: 0;
}

.refresh-button, .test-mode-button {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: var(--ark-color-blue);
  color: var(--ark-color-white);
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.refresh-button:hover {
  background-color: rgba(52, 152, 219, 0.8);
}


.fa-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Tabs */
.tabs-container {
  display: flex;
  gap: 8px;
  background-color: var(--ark-color-white);
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 4px var(--ark-color-black-shadow);
}

.tab-button {
  flex: 1;
  padding: 10px;
  background-color: transparent;
  border: none;
  border-radius: 4px;
  color: var(--ark-color-black);
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
}

.tab-button:hover {
  background-color: var(--ark-color-black-shadow);
}

.tab-button.active {
  background-color: var(--ark-color-green);
  color: var(--ark-color-white);
}

/* Section Containers */
.section-container {
  background-color: var(--ark-color-white);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px var(--ark-color-black-shadow);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--ark-color-black-bold);
  margin: 0;
}

.add-button, .scan-button, .save-button {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: var(--ark-color-green);
  color: var(--ark-color-white);
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.add-button:hover, .scan-button:hover, .save-button:hover {
  background-color: var(--ark-color-green-hover);
}

.save-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* Tables */
.table-container {
  overflow-x: auto;
  border-radius: 4px;
  border: 1px solid var(--ark-color-black-shadow);
}

.connections-table {
  width: 100%;
  border-collapse: collapse;
}

.connections-table th {
  background-color: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--ark-color-black);
  border-bottom: 1px solid var(--ark-color-black-shadow);
}

.connections-table td {
  padding: 12px;
  border-bottom: 1px solid var(--ark-color-black-shadow);
  color: var(--ark-color-black);
}

.connections-table tbody tr:last-child td {
  border-bottom: none;
}

.connections-table tbody tr.active-row {
  background-color: var(--ark-color-green-shadow);
}

.connection-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.connection-icon {
  font-size: 1.2rem;
}

.connection-icon.wifi {
  color: var(--ark-color-green);
}

.connection-icon.wifi-inactive {
  color: var(--ark-color-black);
}

.connection-icon.ethernet {
  color: var(--ark-color-blue);
}

.connection-icon.lte {
  color: var(--ark-color-orange);
}

.capitalize {
  text-transform: capitalize;
}

.status-badge {
  display: inline-flex;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.active {
  background-color: var(--ark-color-green-shadow);
  color: var(--ark-color-green);
}

.status-badge.inactive {
  background-color: var(--ark-color-black-shadow);
  color: var(--ark-color-black);
}

.signal-container {
  width: 100px;
  height: 8px;
  background-color: #eaeaea;
  border-radius: 4px;
  overflow: hidden;
}

.signal-bar {
  height: 100%;
  border-radius: 4px;
}

.signal-bar.signal-strong {
  background-color: var(--ark-color-green);
}

.signal-bar.signal-medium {
  background-color: var(--ark-color-orange);
}

.signal-bar.signal-weak {
  background-color: var(--ark-color-red);
}

.wired-signal {
  color: var(--ark-color-green);
  font-weight: 500;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.icon-button {
  width: 32px;
  height: 32px;
  background: none;
  border: 1px solid var(--ark-color-black-shadow);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-button.configure:hover {
  background-color: var(--ark-color-blue);
  color: var(--ark-color-white);
}

.icon-button.connect:hover {
  background-color: var(--ark-color-green);
  color: var(--ark-color-white);
}

.icon-button.disconnect:hover {
  background-color: var(--ark-color-red);
  color: var(--ark-color-white);
}

.icon-button.delete:hover {
  background-color: var(--ark-color-red);
  color: var(--ark-color-white);
}

/* WiFi Networks */
.wifi-networks-container {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scanning-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--ark-color-black-shadow);
  border-top: 4px solid var(--ark-color-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

.wifi-network-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--ark-color-black-shadow);
  border-radius: 8px;
  transition: all 0.2s;
}

.wifi-network-item:hover {
  box-shadow: 0 2px 6px var(--ark-color-black-shadow);
}

.wifi-network-item.connected {
  border-color: var(--ark-color-green);
  background-color: var(--ark-color-green-shadow);
}

.wifi-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.wifi-info i {
  font-size: 1.2rem;
}

.wifi-info i.signal-strong {
  color: var(--ark-color-green);
}

.wifi-info i.signal-medium {
  color: var(--ark-color-orange);
}

.wifi-info i.signal-weak {
  color: var(--ark-color-red);
}

.wifi-details {
  display: flex;
  flex-direction: column;
}

.wifi-name {
  font-weight: 500;
}

.security-badge {
  display: inline-flex;
  padding: 2px 6px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-size: 0.7rem;
  color: var(--ark-color-black);
  margin-top: 4px;
  width: fit-content;
}

.wifi-signal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 120px;
  margin-right: 12px;
}

.signal-value {
  font-size: 0.8rem;
  color: var(--ark-color-black);
}

.wifi-connect-button {
  padding: 6px 12px;
  background-color: var(--ark-color-blue);
  color: var(--ark-color-white);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.wifi-connect-button:hover {
  background-color: rgba(52, 152, 219, 0.8);
}

.wifi-connect-button.connected {
  background-color: var(--ark-color-green);
}

.wifi-connect-button.connected:hover {
  background-color: var(--ark-color-green-hover);
}

/* Priorities */
.priorities-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.priority-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--ark-color-black-shadow);
  border-radius: 8px;
  background-color: #f8f9fa;
}

.priority-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.priority-badge {
  width: 24px;
  height: 24px;
  background-color: var(--ark-color-green);
  color: var(--ark-color-white);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.priority-name {
  font-weight: 500;
}

.type-badge {
  padding: 2px 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  font-size: 0.8rem;
  text-transform: capitalize;
}

.priority-actions {
  display: flex;
  gap: 8px;
}

.priority-button {
  width: 32px;
  height: 32px;
  background: none;
  border: 1px solid var(--ark-color-black-shadow);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.priority-button:hover {
  background-color: var(--ark-color-black-shadow);
}

.priority-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.routing-info-panel {
  padding: 12px;
  background-color: #fff8e1;
  border: 1px solid #ffecb3;
  border-radius: 8px;
}

.info-title {
  color: #f57c00;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 8px;
}

.info-content {
  color: #5d4037;
  margin: 0;
}

/* Data Usage */
.usage-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-container {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e0e0e0;
}

.simple-chart {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-bar-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chart-label {
  font-weight: 500;
  margin-bottom: 4px;
}

.chart-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chart-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-bar {
  height: 16px;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.chart-bar.download {
  background-color: var(--ark-color-green);
}

.chart-bar.upload {
  background-color: var(--ark-color-blue);
}

.chart-value {
  font-size: 0.8rem;
  min-width: 80px;
}

.chart-empty {
  padding: 32px;
  display: flex;
  justify-content: center;
  color: var(--ark-color-black);
}

.timeframe-dropdown {
  padding: 8px;
  border: 1px solid var(--ark-color-black-shadow);
  border-radius: 4px;
  background-color: var(--ark-color-white);
}

.usage-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.usage-item {
  padding: 12px;
  border: 1px solid var(--ark-color-black-shadow);
  border-radius: 8px;
}

.usage-item-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.usage-name {
  font-weight: 500;
}

.usage-total {
  color: var(--ark-color-black);
}

.usage-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.usage-bar-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.usage-bar-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
}

.download-value {
  color: var(--ark-color-green);
  font-weight: 500;
}

.upload-value {
  color: var(--ark-color-blue);
  font-weight: 500;
}

.usage-bar-container {
  height: 8px;
  background-color: #eaeaea;
  border-radius: 4px;
  overflow: hidden;
}

.usage-bar {
  height: 100%;
  border-radius: 4px;
}

.usage-bar.download {
  background-color: var(--ark-color-green);
}

.usage-bar.upload {
  background-color: var(--ark-color-blue);
}

/* Empty States */
.empty-state {
  padding: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--ark-color-black);
}

.empty-message i {
  font-size: 2rem;
  margin-bottom: 12px;
  opacity: 0.5;
}

.scan-button-empty {
  margin-top: 12px;
  padding: 8px 16px;
  background-color: var(--ark-color-blue);
  color: var(--ark-color-white);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Dialog */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog-container {
  background-color: var(--ark-color-white);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.wifi-password-dialog {
  max-width: 400px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--ark-color-black-shadow);
}

.dialog-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--ark-color-black-bold);
}

.close-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--ark-color-black);
  cursor: pointer;
}

.dialog-content {
  padding: 16px;
}

/* Connection Type Selector */
.connection-type-selector {
  padding: 16px;
}

.connection-type-title {
  text-align: center;
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 16px;
}

.connection-type-options {
  display: flex;
  justify-content: space-around;
  gap: 16px;
}

.connection-type-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background-color: #f8f9fa;
  border: 1px solid var(--ark-color-black-shadow);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
}

.connection-type-button:hover {
  background-color: var(--ark-color-green-shadow);
  border-color: var(--ark-color-green);
}

.connection-type-button i {
  font-size: 1.5rem;
  color: var(--ark-color-black);
}

/* Forms */
.connection-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: var(--ark-color-black-bold);
}

.form-group input, .form-group select {
  padding: 8px;
  border: 1px solid var(--ark-color-black-shadow);
  border-radius: 4px;
}

.radio-group {
  display: flex;
  gap: 16px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--ark-color-black);
  cursor: pointer;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: var(--ark-color-green);
}

input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.manual-ip-section {
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.cancel-button {
  padding: 8px 16px;
  background-color: #f1f2f3;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-button {
  padding: 8px 16px;
  background-color: var(--ark-color-green);
  color: var(--ark-color-white);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button:hover {
  background-color: var(--ark-color-green-hover);
}

/* LTE Modem Section */
.lte-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.lte-info-card {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--ark-color-black-shadow);
}

.info-label {
  color: var(--ark-color-black);
  font-size: 0.8rem;
  margin-bottom: 8px;
}

.info-value {
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-success {
  color: var(--ark-color-green);
}

.lte-connection-panel {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--ark-color-black-shadow);
}

.panel-title {
  font-weight: 600;
  color: var(--ark-color-black-bold);
  margin-bottom: 16px;
}

.lte-connect-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.apn-input-container {
  position: relative;
}

.detected-apn-info {
  font-size: 0.8rem;
  color: var(--ark-color-green);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.connect-button {
  background-color: var(--ark-color-blue);
  color: var(--ark-color-white);
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  align-self: flex-start;
}

.connect-button:hover {
  background-color: rgba(52, 152, 219, 0.8);
}

.connect-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.lte-connected-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.connected-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ark-color-green);
}

.connected-message i {
  font-size: 1.2rem;
}

.connected-message p {
  margin: 0;
}

.disconnect-button {
  background-color: var(--ark-color-red);
  color: var(--ark-color-white);
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.disconnect-button:hover {
  background-color: var(--ark-color-red-hover);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.spinner {
  border: 4px solid var(--ark-color-black-shadow);
  border-top: 4px solid var(--ark-color-blue);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--ark-color-red);
}

.error-message i {
  font-size: 2rem;
  margin-bottom: 16px;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .tabs-container {
    flex-wrap: wrap;
  }
  
  .tab-button {
    min-width: 48%;
  }
  
  .connection-type-options {
    flex-direction: column;
  }
  
  .lte-info-grid {
    grid-template-columns: 1fr;
  }
  
  .lte-connected-info {
    flex-direction: column;
    gap: 16px;
  }
}
</style>