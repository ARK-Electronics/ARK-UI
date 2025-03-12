<template>
  <div class="page-container">
    <!-- Header -->
    <h1 class="page-title">Network Connections Manager</h1>

    <!-- Navigation Tabs -->
    <div class="tabs-container" ref="tabsContainer">
      <button 
        class="tab-button"
        :class="{ 'active': activeSection === 'current' }"
        @click="activeSection = 'current'"
      >
        Connections
      </button>
      <button 
        class="tab-button"
        :class="{ 'active': activeSection === 'priorities' }"
        @click="activeSection = 'priorities'"
      >
        Routing
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

    <!-- Tab Content Wrapper -->
    <div class="tab-content-wrapper">
      <!-- Connections Section -->
      <div v-if="activeSection === 'current'" class="section-container">
      <div class="section-header">
        <h2 class="section-title">Connections</h2>
        <div class="header-actions">
          <button @click="fetchConnections" class="refresh-button">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': refreshing }"></i>
            Refresh
          </button>
          <button @click="showAddConnectionForm" class="add-button">
            <i class="fas fa-plus"></i>
            Add Connection
          </button>
        </div>
      </div>

      <div class="table-container">
        <table class="connections-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Signal</th>
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
              <td colspan="6" class="empty-state">
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

    <!-- Available WiFi Section removed - integrated into connection form -->

    <!-- Routing Priorities Section -->
    <div v-if="activeSection === 'priorities'" class="section-container">
      <div class="section-header">
        <h2 class="section-title">Priorities</h2>
        <div class="header-actions">
          <button @click="fetchRoutingPriorities" class="refresh-button">
            <i class="fas fa-sync-alt"></i>
            Refresh
          </button>
          <button
            @click="savePriorities"
            class="save-button"
            :disabled="!prioritiesChanged"
          >
            <i class="fas fa-save"></i>
            Save Changes
          </button>
        </div>
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

    </div>

    <!-- Data Usage Section -->
    <div v-if="activeSection === 'usage'" class="section-container">
      <div class="section-header">
        <h2 class="section-title">Data Usage</h2>
      </div>

      <div v-if="socketError" class="error-message-small">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ socketError }}</p>
      </div>

      <div class="usage-container">
        <div v-if="usageData.length === 0" class="empty-state">
          <div class="empty-message">
            <i class="fas fa-chart-bar"></i>
            <p>Waiting for network data...</p>
          </div>
        </div>

        <div class="usage-details">
          <div
            v-for="(item, idx) in usageData"
            :key="item.name"
            class="usage-item"
            :class="{ 'expanded': expandedInterfaces[idx] }"
            @click="toggleInterface(idx)"
          >
            <!-- Always visible header with basic info -->
            <div class="usage-item-header">
              <div class="usage-info">
                <span class="usage-name">{{ item.name }}</span>
                <span class="usage-interface">({{ item.interface }})</span>
                <span class="interface-type capitalize">{{ item.type }}</span>
              </div>
              <div class="usage-rates">
                <span class="download-value">↓ {{ item.dataDown.toFixed(1) }}</span>
                <span class="rate-separator">/</span>
                <span class="upload-value">↑ {{ item.dataUp.toFixed(1) }}</span>
                <span class="rate-unit">Mbps</span>
                <i class="fas" :class="expandedInterfaces[idx] ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
              </div>
            </div>

            <!-- Basic rate bars - always visible -->
            <div class="usage-bars-compact">
              <div class="rate-bar-container">
                <div class="rate-bar-fill download"
                     :style="{ width: calculateBarWidth(item.dataDown) }"></div>
              </div>
              <div class="rate-bar-container">
                <div class="rate-bar-fill upload"
                     :style="{ width: calculateBarWidth(item.dataUp) }"></div>
              </div>
            </div>

            <!-- Expanded details - only visible when expanded -->
            <div v-if="expandedInterfaces[idx]" class="usage-details-expanded">
              <!-- Connection details grid -->
              <div class="usage-details-grid">
                <div v-if="item.ipAddress" class="usage-detail-item">
                  <span class="detail-label">IP Address:</span>
                  <span class="detail-value">{{ item.ipAddress }}</span>
                </div>
                <div v-if="item.type === 'wifi' && item.signalStrength" class="usage-detail-item">
                  <span class="detail-label">Signal Strength:</span>
                  <span class="detail-value">
                    <div class="signal-container">
                      <div class="signal-bar" :style="{ width: `${item.signalStrength}%` }" :class="getSignalClass(item.signalStrength)"></div>
                    </div>
                  </span>
                </div>
                <div v-if="item.active !== undefined" class="usage-detail-item">
                  <span class="detail-label">Status:</span>
                  <span class="detail-value" :class="item.active ? 'text-success' : ''">
                    {{ item.active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>

              <!-- Transfer statistics -->
              <div class="usage-statistics">
                <div class="usage-stat-header">Transfer Statistics</div>
                <div class="statistics-grid">
                  <div class="stat-item">
                    <div class="stat-label">Total Downloaded</div>
                    <div class="stat-value download-value">{{ formatBytes(item.rxBytes) }}</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-label">Total Uploaded</div>
                    <div class="stat-value upload-value">{{ formatBytes(item.txBytes) }}</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-label">RX Errors</div>
                    <div class="stat-value">{{ item.rxErrors }}</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-label">TX Errors</div>
                    <div class="stat-value">{{ item.txErrors }}</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-label">RX Dropped</div>
                    <div class="stat-value">{{ item.rxDropped }}</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-label">TX Dropped</div>
                    <div class="stat-value">{{ item.txDropped }}</div>
                  </div>
                </div>
              </div>

              <!-- Packet statistics -->
              <div class="usage-packet-stats">
                <div class="usage-stat-header">Packet Statistics</div>
                <div class="packet-stats-grid">
                  <div class="stat-item">
                    <div class="stat-label">RX Packets</div>
                    <div class="stat-value">{{ item.rxPackets?.toLocaleString() || '0' }}</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-label">TX Packets</div>
                    <div class="stat-value">{{ item.txPackets?.toLocaleString() || '0' }}</div>
                  </div>
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

            <!-- Available WiFi Networks Section (only for infrastructure mode) -->
            <div v-if="newConnection.mode === 'infrastructure'" class="wifi-scan-container">
              <div class="wifi-scan-header">
                <h3>Available Networks</h3>
                <button type="button" @click="scanWifiFromConnectionForm" class="wifi-scan-button">
                  <i class="fas fa-sync-alt" :class="{ 'fa-spin': scanning }"></i>
                  Rescan
                </button>
              </div>

              <div class="wifi-networks-list">
                <div v-if="scanning && availableWifiNetworks.length === 0" class="scanning-overlay">
                  <div class="spinner"></div>
                  <p>Scanning for networks...</p>
                </div>

                <div v-if="availableWifiNetworks.length === 0 && !scanning" class="empty-networks">
                  <i class="fas fa-wifi"></i>
                  <p>No WiFi networks found</p>
                </div>

                <div
                  v-for="network in availableWifiNetworks"
                  :key="network.ssid"
                  class="wifi-network-item form-wifi-item"
                  :class="{ 'selected': newConnection.ssid === network.ssid }"
                  @click="selectWifiNetwork(network)"
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
                  </div>
                </div>
              </div>
            </div>

            <!-- Manual SSID input (for both modes) -->
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
                  :required="newConnection.mode === 'ap' || selectedNetworkSecured"
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
              <span class="label-text">Auto-Connect:</span>
              <div class="toggle-switch">
                <input type="checkbox" id="wifi-autoconnect" v-model="newConnection.autoconnect">
                <label for="wifi-autoconnect" class="toggle-slider"></label>
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
        <div class="header-actions">
          <button @click="refreshLteStatus" class="refresh-button" :disabled="refreshingLte">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': refreshingLte }"></i>
            Refresh
          </button>
        </div>
      </div>

      <div v-if="loadingLte" class="loading-container">
        <div class="loading-spinner"></div>
        <span>Loading modem information...</span>
      </div>
      
      <div v-else-if="lteStatus.status === 'not_available'" class="error-container">
        <i class="fas fa-exclamation-triangle"></i>
        <span>LTE functionality is only available on Jetson platform.</span>
      </div>
      
      <div v-else-if="lteStatus.status === 'not_found'" class="error-container">
        <i class="fas fa-exclamation-triangle"></i>
        <span>No LTE modem detected. Please check your hardware connection.</span>
      </div>
      
      <div v-else-if="lteStatus.status === 'error'" class="error-container">
        <i class="fas fa-exclamation-triangle"></i>
        <span>{{ lteStatus.message || 'Error retrieving LTE status' }}</span>
      </div>
      
      <div v-else class="lte-content">
        <div class="lte-status-card">
          <div class="lte-status-header">
            <h3>Modem Status</h3>
            <div class="status-badge" :class="lteStatus.state">
              {{ lteStatus.state || 'unknown' }}
            </div>
          </div>
          
          <div class="lte-info-grid">
            <div class="lte-info-item">
              <span class="info-label">Manufacturer:</span>
              <span class="info-value">{{ lteStatus.manufacturer || '-' }}</span>
            </div>
            <div class="lte-info-item">
              <span class="info-label">Model:</span>
              <span class="info-value">{{ lteStatus.model || '-' }}</span>
            </div>
            <div class="lte-info-item">
              <span class="info-label">IMEI:</span>
              <span class="info-value">{{ lteStatus.imei || '-' }}</span>
            </div>
            <div class="lte-info-item">
              <span class="info-label">Carrier:</span>
              <span class="info-value">{{ lteStatus.operatorName || '-' }}</span>
            </div>
            <div class="lte-info-item">
              <span class="info-label">Signal Strength:</span>
              <span class="info-value">
                <div class="signal-container">
                  <div class="signal-bar" 
                       :style="{ width: `${lteStatus.signalStrength || 0}%` }" 
                       :class="getSignalClass(lteStatus.signalStrength)">
                  </div>
                </div>
                {{ lteStatus.signalStrength || 0 }}%
              </span>
            </div>
            <div class="lte-info-item">
              <span class="info-label">APN:</span>
              <span class="info-value">{{ lteStatus.apn || lteStatus.defaultApn || '-' }}</span>
            </div>
          </div>
          
          <div class="lte-actions">
            <button v-if="lteStatus.state !== 'connected'" 
                    @click="connectLte" 
                    class="connect-button">
              <i class="fas fa-plug"></i>
              Connect
            </button>
            <button v-else 
                    @click="disconnectLte" 
                    class="disconnect-button">
              <i class="fas fa-unlink"></i>
              Disconnect
            </button>
          </div>
        </div>

        <div v-if="lteStatus.state === 'connected' && lteStatus.interface" class="lte-connected-info">
          <div class="lte-interface-card">
            <h3>Network Interface</h3>
            
            <div class="lte-info-grid">
              <div class="lte-info-item">
                <span class="info-label">Interface:</span>
                <span class="info-value">{{ lteStatus.interface }}</span>
              </div>
              <div class="lte-info-item">
                <span class="info-label">Status:</span>
                <span class="info-value status-badge" :class="lteStatus.interfaceState === 'up' ? 'active' : 'inactive'">
                  {{ lteStatus.interfaceState === 'up' ? 'UP' : 'DOWN' }}
                </span>
              </div>
              <div class="lte-info-item">
                <span class="info-label">IP Address:</span>
                <span class="info-value">{{ lteStatus.ipAddress || '-' }}</span>
              </div>
              <div class="lte-info-item">
                <span class="info-label">Gateway:</span>
                <span class="info-value">{{ lteStatus.gateway || '-' }}</span>
              </div>
              <div class="lte-info-item">
                <span class="info-label">Prefix:</span>
                <span class="info-value">{{ lteStatus.prefix || '-' }}</span>
              </div>
              <div class="lte-info-item">
                <span class="info-label">MTU:</span>
                <span class="info-value">{{ lteStatus.mtu || '1500' }}</span>
              </div>
            </div>
          </div>
          
          <div class="lte-dns-card">
            <h3>DNS Servers</h3>
            <div v-if="lteStatus.dns && lteStatus.dns.length" class="dns-server-list">
              <div v-for="(dns, index) in lteStatus.dns" :key="index" class="dns-server-item">
                <i class="fas fa-server"></i> {{ dns }}
              </div>
            </div>
            <div v-else class="empty-dns">
              <span>No DNS servers configured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ConnectionsService from '../services/ConnectionsService';
// Try Socket.IO client import differently - include version in debug log
console.log('Socket.IO client importing...');
import io from 'socket.io-client';
console.log('Socket.IO client imported, version:', io?.version || 'unknown');

export default {
  data() {
    return {
      activeSection: 'current',
      refreshing: false,
      scanning: false,
      connections: [],
      availableWifiNetworks: [],
      routingPriorities: [],
      prioritiesChanged: false,

      // Network usage data
      usageData: [],
      expandedInterfaces: [],  // Track expanded/collapsed state of each interface
      socketError: null,
      socket: null,
      refreshingUsage: false,
      
      // Connection form
      showConnectionForm: false,
      connectionType: null,
      isEditingConnection: false,
      passwordVisible: false,
      selectedNetworkSecured: false,
      
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
      },
      
      // Refresh intervals
      dataRefreshInterval: null,
      wifiScanInterval: null,
      lastScanAnimation: 0,
      
      // UI states
      loadingConnections: false,
      loadingWifi: false,
      loadingRouting: false
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
    
    // Set up automatic refresh only for active tab data
    this.dataRefreshInterval = setInterval(() => {
      // Only refresh the current active section data
      if (this.activeSection !== 'usage') {
        this.fetchSectionData(this.activeSection, false);
      }
    }, 15000);

    // Only scan for WiFi when in the connection form with WiFi selected
    this.wifiScanInterval = setInterval(() => {
      if (this.showConnectionForm && this.connectionType === 'wifi') {
        this.backgroundScanWifi();
      }
    }, 5000);

    // Connect to socket if starting on usage tab
    if (this.activeSection === 'usage') {
      this.connectUsageSocket();
    }
  },
  
  beforeUnmount() {
    // Clean up all resources when component is destroyed
    if (this.dataRefreshInterval) {
      clearInterval(this.dataRefreshInterval);
    }

    if (this.wifiScanInterval) {
      clearInterval(this.wifiScanInterval);
    }

    // Make sure socket is disconnected
    this.disconnectUsageSocket();
  },

  watch: {
    // Watch section changes for socket connections
    activeSection(newSection, oldSection) {
      if (newSection === 'usage') {
        // Connect socket when viewing usage tab
        this.socketError = null;  // Clear any previous errors
        this.connectUsageSocket();
      } else if (oldSection === 'usage') {
        // Disconnect socket when leaving usage tab
        this.disconnectUsageSocket();
        this.socketError = null;  // Clear errors when leaving tab
      }

      // Fetch the data for the new active section
      this.fetchSectionData(newSection, true);
    },
  },
  
  methods: {
    // --- Data Fetching ---
    
    // Helper method to fetch only data needed for current section
    fetchSectionData(section, showLoading = false) {
      switch (section) {
        case 'current':
          this.fetchConnections(showLoading);
          break;
        case 'priorities':
          this.fetchRoutingPriorities(showLoading);
          break;
        case 'usage':
          // For usage tab, we only need to connect to WebSocket
          // No REST API call needed - data comes via WebSocket
          break;
        case 'lte':
          this.fetchLteStatus(showLoading);
          break;
      }
    },

    async fetchAll() {
      try {
        // Load data for the active section only to improve performance
        // Use true for showLoading to ensure loading indicators are displayed
        this.fetchSectionData(this.activeSection, true);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    },
    
    async fetchConnections(showLoading = true) {
      if (showLoading) {
        this.loadingConnections = true;
      }

      try {
        const response = await ConnectionsService.getConnections();

        // Simply replace the array with new data
        // This is simpler and less error-prone than partial updates
        this.connections = response.data;
      } catch (error) {
        console.error('Failed to fetch connections:', error);
      } finally {
        if (showLoading) {
          this.loadingConnections = false;
        }
      }
    },
    
    async scanWifi() {
      this.scanning = true;
      try {
        const response = await ConnectionsService.scanWifiNetworks();
        // Filter out hidden networks (those with -- as the name)
        this.availableWifiNetworks = response.data.filter(network => network.ssid !== '--');
      } catch (error) {
        console.error('Failed to scan WiFi networks:', error);
      } finally {
        this.scanning = false;
        this.lastScanAnimation = Date.now();
      }
    },

    // Run WiFi scan in the background without animation
    async backgroundScanWifi() {
      // If we're not in the connection form or the form is not showing WiFi,
      // skip the scan to save resources
      if (!this.showConnectionForm || this.connectionType !== 'wifi' || this.newConnection.mode !== 'infrastructure') {
        return;
      }

      // Don't show animation if we recently scanned (less than 10 seconds ago)
      const showAnimation = Date.now() - this.lastScanAnimation > 10000 && this.availableWifiNetworks.length === 0;

      if (showAnimation) {
        this.scanning = true;
      }

      try {
        const response = await ConnectionsService.scanWifiNetworks();
        // Filter out hidden networks (those with -- as the name)
        this.availableWifiNetworks = response.data.filter(network => network.ssid !== '--');
      } catch (error) {
        console.error('Failed to scan WiFi networks in background:', error);
      } finally {
        if (showAnimation) {
          this.scanning = false;
          this.lastScanAnimation = Date.now();
        }
      }
    },

    // Explicitly trigger a WiFi scan from the connection form
    async scanWifiFromConnectionForm() {
      // Always show animation when explicitly requested
      this.scanning = true;

      try {
        const response = await ConnectionsService.scanWifiNetworks();
        // Filter out hidden networks (those with -- as the name)
        this.availableWifiNetworks = response.data.filter(network => network.ssid !== '--');
      } catch (error) {
        console.error('Failed to scan WiFi networks:', error);
      } finally {
        this.scanning = false;
        this.lastScanAnimation = Date.now();
      }
    },
    
    // Select a WiFi network from the scan list
    selectWifiNetwork(network) {
      this.newConnection.ssid = network.ssid;
      this.selectedNetworkSecured = network.secured;

      // If the network is secured, focus the password field
      if (network.secured) {
        this.$nextTick(() => {
          document.getElementById('wifi-password').focus();
        });
      }
    },

    async fetchRoutingPriorities(showLoading = true) {
      if (showLoading) {
        this.loadingRouting = true;
      }

      try {
        const response = await ConnectionsService.getRoutingPriorities();

        // Only replace the array if there are actual changes
        const currentJSON = JSON.stringify(this.routingPriorities);
        const newJSON = JSON.stringify(response.data);

        if (currentJSON !== newJSON) {
          this.routingPriorities = response.data;
        }

        this.prioritiesChanged = false;
      } catch (error) {
        console.error('Failed to fetch routing priorities:', error);
      } finally {
        if (showLoading) {
          this.loadingRouting = false;
        }
      }
    },
    
    connectUsageSocket() {
      try {
        // Close existing connection if any
        this.disconnectUsageSocket();

        this.socket = io(process.env.VUE_APP_NETWORK_SOCKET_URL, {
          path: process.env.VUE_APP_NETWORK_SOCKET_PATH,
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        // Handle connection events
        this.socket.on('connect', () => {
          console.log('Network stats Socket.IO connection established!', this.socket.id);

          // Clear any previous error
          this.socketError = null;
        });

        // Handle real-time data updates
        this.socket.on('network_stats_update', (data) => {
          console.log(`Received network stats update with ${data ? data.length : 0} interfaces`);

          if (!data || !Array.isArray(data)) {
            console.error('Invalid network stats data format:', data);
            return;
          }

          // Process the data directly
          this.processNetworkStatsData(data);
        });

        // Handle connection errors
        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          this.socketError = `Connection error: ${error.message}`;
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          if (this.activeSection === 'usage') {
            this.socketError = `WebSocket disconnected. Reconnecting...`;
          }
        });
      } catch (error) {
        console.error('Error in connectUsageSocket:', error);
        this.socketError = `WebSocket error: ${error.message}`;
      }
    },

    disconnectUsageSocket() {
      if (this.socket) {
        console.log('Disconnecting from network stats socket:', this.socket.id);

        // Remove all event listeners to prevent memory leaks
        this.socket.off('connect');
        this.socket.off('disconnect');
        this.socket.off('connect_error');
        this.socket.off('network_stats_update');

        // Disconnect the socket
        this.socket.disconnect();

        // Clear the reference
        this.socket = null;
        console.log('Socket disconnected and reference cleared');
      }
    },

    processNetworkStatsData(data) {
      if (!data || !Array.isArray(data)) {
        console.error('Invalid network stats data format:', data);
        return;
      }

      console.log(`Processing: ${data.length} interfaces`);

      try {
        // Create arrays to hold the processed data
        const processedData = [];

        // Process each interface
        for (let i = 0; i < data.length; i++) {
          const networkInterface = data[i];

          // Skip invalid entries
          if (!networkInterface || !networkInterface.interface) {
            console.warn(`Skipping invalid interface data at index ${i}`);
            continue;
          }

          // Process the values
          const downRate = parseFloat(networkInterface.current_rx_rate_mbps) || 0;
          const upRate = parseFloat(networkInterface.current_tx_rate_mbps) || 0;

          // Create the processed interface object
          const processedInterface = {
            name: networkInterface.name || networkInterface.interface || 'Unknown',
            interface: networkInterface.interface,
            type: networkInterface.type || 'unknown',
            
            // Connection status from server
            active: networkInterface.active || false,  // Use explicit active flag from server
            state: networkInterface.state || '',       // Raw state from server
            
            // Data rates
            dataDown: parseFloat(downRate.toFixed(2)),
            dataUp: parseFloat(upRate.toFixed(2)),
            totalData: parseFloat((downRate + upRate).toFixed(2)),
            
            // Network stats
            rxBytes: parseInt(networkInterface.rx_bytes) || 0,
            txBytes: parseInt(networkInterface.tx_bytes) || 0,
            ipAddress: networkInterface.ip_address || '',
            signalStrength: parseInt(networkInterface.signal_strength) || 0,

            // Error and packet stats
            rxErrors: parseInt(networkInterface.rxErrors) || 0,
            rxDropped: parseInt(networkInterface.rxDropped) || 0,
            txErrors: parseInt(networkInterface.txErrors) || 0,
            txDropped: parseInt(networkInterface.txDropped) || 0,
            rxPackets: parseInt(networkInterface.rxPackets) || 0,
            txPackets: parseInt(networkInterface.txPackets) || 0
          };

          processedData.push(processedInterface);
        }

        // Initialize expanded state array if needed
        if (this.expandedInterfaces.length !== processedData.length) {
          // Keep existing expanded states when possible
          const newExpandedState = new Array(processedData.length).fill(false);
          
          // Preserve expanded state for interfaces that remain
          if (this.usageData.length > 0) {
            processedData.forEach((newInterface, index) => {
              // Look for this interface in previous data to preserve expand state
              const existingIndex = this.usageData.findIndex(
                oldInterface => oldInterface.interface === newInterface.interface
              );
              if (existingIndex >= 0 && existingIndex < this.expandedInterfaces.length) {
                newExpandedState[index] = this.expandedInterfaces[existingIndex];
              }
            });
          }
          
          this.expandedInterfaces = newExpandedState;
        }

        // Data is already sorted by the server (active first, then by bytes)
        this.usageData = processedData;

        console.log(`Updated UI: usageData now has ${this.usageData.length} interfaces`);
        if (this.usageData.length > 0) {
          console.log(`First UI item: ${this.usageData[0].name}, Active: ${this.usageData[0].active}, Down: ${this.usageData[0].dataDown}, Up: ${this.usageData[0].dataUp}`);
        }
      } catch (error) {
        console.error('Error processing network data:', error);
      }
    },
    
    // Toggle expanded/collapsed state of an interface
    toggleInterface(index) {
      if (index >= 0 && index < this.expandedInterfaces.length) {
        // In Vue 3, reactive arrays can be directly modified
        const newExpandedInterfaces = [...this.expandedInterfaces];
        newExpandedInterfaces[index] = !newExpandedInterfaces[index];
        this.expandedInterfaces = newExpandedInterfaces;
      }
    },

    // No longer needed - using 'active' flag directly from server
    // Method removed as we now use the 'active' status sent by the server

    calculateBarWidth(rate) {
      // For zero values, show empty bar
      if (rate <= 0) return '0%';

      // Define max scale for 100% width (10Mbps is full width)
      const MAX_RATE = 10;

      // Calculate percentage with cap at 100%
      const percentage = Math.min(100, (rate / MAX_RATE) * 100);

      return `${percentage}%`;
    },

    // Format bytes to human-readable format
    formatBytes(bytes, decimals = 2) {
      if (bytes === 0) return '0 Bytes';

      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

      const i = Math.floor(Math.log(bytes) / Math.log(k));

      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    getSignalClass(strength) {
      if (strength === undefined || strength === null) return '';
      if (strength >= 70) return 'signal-strong';
      if (strength >= 40) return 'signal-medium';
      return 'signal-weak';
    },

    // --- UI Actions ---
    
    async handleRefresh() {
      this.refreshing = true;
      await this.fetchAll();
      this.refreshing = false;
    },
    
    // --- LTE Management ---
    
    async fetchLteStatus(showLoading = true) {
      if (showLoading) {
        this.loadingLte = true;
      }

      try {
        const response = await ConnectionsService.getLteStatus();

        // In Vue 2, we should use Vue.set for reactivity, but for simplicity
        // let's just replace the whole object which works fine
        this.lteStatus = response.data;
        
        // Update APN field with current or detected value
        if (response.data.connected && response.data.apn) {
          this.lteApn = response.data.apn;
        } else if (response.data.detectedApn && !this.lteApn) {
          // Only set detected APN if user hasn't entered anything
          this.lteDetectedApn = response.data.detectedApn;
          this.lteDetectedCarrier = response.data.operator;
        }
        
        // Always show LTE tab regardless of detection status
      } catch (error) {
        console.error('Failed to fetch LTE status:', error);
        this.lteStatus = { status: 'error', message: error.message || 'Failed to fetch LTE status' };
      } finally {
        if (showLoading) {
          this.loadingLte = false;
        }
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
      this.selectedNetworkSecured = false;
    },
    
    selectConnectionType(type) {
      this.connectionType = type;
      this.resetNewConnection();
      this.newConnection.type = type;
      
      // Set default values based on connection type
      if (type === 'wifi') {
        this.newConnection.mode = 'infrastructure';
        // Trigger a scan immediately when selecting WiFi type
        this.scanWifiFromConnectionForm();
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
      };
    },
    
    async saveConnection() {
      try {
        const payload = { ...this.newConnection };
        
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
      }
      
      return '<i class="fas fa-question-circle connection-icon unknown"></i>';
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
  align-items: center;
  width: 100%;
  max-width: 1200px;
  min-width: 800px; /* Prevent getting too narrow */
  margin: 0 auto;
  padding: 20px;
  gap: 20px;
  position: relative;
  box-sizing: border-box;
  overflow-x: hidden;
  height: 100%;
}

/* Add a container for the tabs to ensure consistent width */
.tab-content-wrapper {
  width: 100%;
  min-width: 100%; /* Prevent shrinking */
  min-height: 500px;
  height: calc(100vh - 150px); /* Account for header, tabs, and padding */
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* Ensure all section containers have a proper width */
.section-container {
  width: 100%;
  transition: opacity 0.2s ease;
  box-shadow: 0 2px 8px var(--ark-color-black-shadow);
  background-color: var(--ark-color-white);
  border-radius: 8px;
  padding: 20px;
  box-sizing: border-box;
  min-height: 500px; 
  max-height: calc(100vh - 150px); /* Account for header, tabs and padding */
  height: calc(100vh - 150px);
  overflow-y: auto;  /* Enable vertical scrolling */
  overflow-x: hidden; /* Prevent horizontal scrolling */
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 100%; /* Ensure consistent width */
  max-width: 100%; /* Prevent expanding beyond container */
}

/* Add smooth transitions for data updates */
.table-container,
.connections-table tbody tr,
.lte-info-card,
.priority-item,
.usage-item {
  transition: all 0.2s ease;
}

.empty-chart {
  padding: 32px;
  display: flex;
  justify-content: center;
  color: var(--ark-color-black);
  opacity: 0.7;
  font-style: italic;
}

.header-actions {
  display: flex;
  background: none;
  padding: 0;
  gap: 10px;
  align-items: center;
}

.page-title {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--ark-color-black);
  margin: 0 0 16px 0;
  text-align: center;
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
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* Fixed 4 equal columns */
  gap: 8px;
  width: 100%;
  margin-bottom: 16px;
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--ark-color-white);
  padding: 8px 0;
  box-sizing: border-box;
  /* Fixed min-width to prevent resizing */
  min-width: 100%;
}

.tab-button {
  padding: 12px;
  background-color: var(--ark-color-white);
  border: none;
  border-radius: 8px;
  color: var(--ark-color-black);
  font-weight: 500;
  transition: background-color 0.2s, color 0.2s; /* Only transition color and background */
  cursor: pointer;
  box-shadow: 0 2px 4px var(--ark-color-black-shadow);
  white-space: nowrap; /* Prevent text wrapping which causes size changes */
  text-overflow: ellipsis; /* Handle overflow text */
  overflow: hidden;
  text-align: center;
  box-sizing: border-box;
  height: 44px; /* Fixed height */
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%; /* Take full width of grid cell */
}

.tab-button:hover {
  background-color: var(--ark-color-black-shadow);
}

.tab-button.active {
  background-color: var(--ark-color-green);
  color: var(--ark-color-white);
}

/* Remove duplicate section-container rule */

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ark-color-black-shadow);
}

.section-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--ark-color-black);
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
  overflow-y: auto;
  max-height: 400px;
  border-radius: 4px;
  border: 1px solid var(--ark-color-black-shadow);
  scrollbar-width: thin;
  scrollbar-color: var(--ark-color-black-shadow) transparent;
}

.table-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-container::-webkit-scrollbar-track {
  background: transparent;
}

.table-container::-webkit-scrollbar-thumb {
  background-color: var(--ark-color-black-shadow);
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background-color: var(--ark-color-black);
}

.table-container:not(:hover)::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.05);
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
  margin-bottom: 4px;
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
.wifi-networks-container, .wifi-scan-container {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wifi-scan-container {
  margin-bottom: 16px;
  border: 1px solid var(--ark-color-black-shadow);
  border-radius: 4px;
  padding: 12px;
  background-color: #f8f9fa;
}

.wifi-scan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.wifi-scan-header h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--ark-color-black);
}

.wifi-scan-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background-color: var(--ark-color-blue);
  color: var(--ark-color-white);
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

.wifi-networks-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 250px;
  overflow-y: auto;
  padding: 4px;
}

.wifi-networks-list::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.wifi-networks-list::-webkit-scrollbar-thumb {
  background-color: var(--ark-color-black-shadow);
  border-radius: 3px;
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

.empty-networks {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  color: var(--ark-color-black);
  opacity: 0.6;
}

.empty-networks i {
  font-size: 2rem;
  margin-bottom: 8px;
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

.form-wifi-item {
  padding: 8px;
  cursor: pointer;
}

.form-wifi-item.selected {
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
  width: 80px;
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
  width: 100%;
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
  width: 100%;
  overflow-x: hidden;  /* Prevent horizontal scrolling */
  overflow-y: auto;    /* Enable vertical scrolling */
  flex: 1;             /* Take up available space */
  padding: 4px 0;      /* Add vertical padding only */
  max-height: 100%;    /* Allow container to fill available space */
}

/* Rate-related styles */
.rate-bar-container {
  position: relative;
  height: 14px;
  background-color: #e0e0e0;
  border-radius: 7px;
  overflow: hidden;
}

.rate-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  transition: width 0.5s ease-out;
  border-radius: 7px;
}

.rate-bar-fill.download {
  background-color: var(--ark-color-green);
}

.rate-bar-fill.upload {
  background-color: var(--ark-color-blue);
}

.download-value {
  color: var(--ark-color-green);
  font-weight: 500;
}

.upload-value {
  color: var(--ark-color-blue);
  font-weight: 500;
}

/* Interface status */
.interface-status {
  color: var(--ark-color-red);
  font-style: italic;
  padding: 8px 0;
}

/* Responsive design for mobile */
@media (max-width: 576px) {
  .rate-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .rate-label {
    width: auto;
    text-align: left;
  }

  .rate-bar-container {
    width: 100%;
  }
}

.chart-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 24px; /* Fixed height */
  min-width: 100%;
}

.chart-bar {
  height: 16px;
  border-radius: 4px;
  transition: width 0.3s ease; /* Smooth transitions */
  min-width: 0; /* Allow bars to be truly zero width */
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
  flex-shrink: 0; /* Prevent squishing */
  text-align: right;
}

.chart-empty {
  padding: 32px;
  display: flex;
  justify-content: center;
  color: var(--ark-color-black);
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  margin-top: 10px;
  width: 100%;
  box-sizing: border-box;
}

.packet-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  margin-top: 10px;
  width: 100%;
  box-sizing: border-box;
}

.stat-item {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--ark-color-black);
  opacity: 0.7;
  margin-bottom: 4px;
}

.stat-value {
  font-weight: 500;
  font-size: 0.9rem;
}

.usage-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin: 0 auto;
  max-width: 900px; /* Limit maximum width for better readability */
  flex: 1; /* Take up remaining space */
  height: auto; /* Let content determine height */
}

.usage-item {
  padding: 16px;
  border: 1px solid var(--ark-color-black-shadow);
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.usage-item:hover {
  box-shadow: 0 2px 8px var(--ark-color-black-shadow);
}

.usage-item.expanded {
  background-color: #f8f9fa;
}

.usage-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin: 16px 0;
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
}

.usage-detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 0.8rem;
  color: var(--ark-color-black);
  opacity: 0.7;
}

.detail-value {
  font-weight: 500;
}

.usage-statistics, .usage-total-traffic {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px dashed var(--ark-color-black-shadow);
}

.usage-stat-header {
  font-weight: 500;
  margin-bottom: 10px;
  font-size: 0.9rem;
  color: var(--ark-color-black);
}

.traffic-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 8px;
}

.traffic-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  text-align: center;
}

.traffic-label {
  font-size: 0.8rem;
  color: var(--ark-color-black);
  opacity: 0.7;
}

.traffic-value {
  font-weight: 500;
  font-size: 0.9rem;
}

.usage-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.usage-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.usage-name {
  font-weight: 600;
}

.usage-interface {
  color: var(--ark-color-black);
  opacity: 0.7;
  font-size: 0.9rem;
}

.interface-type {
  background-color: #e0e0e0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.usage-rates {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: monospace;
}

.rate-separator {
  margin: 0 2px;
  opacity: 0.5;
}

.rate-unit {
  margin-left: 2px;
  opacity: 0.7;
  font-size: 0.9rem;
  margin-right: 8px;
}

.usage-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Compact rate bars for collapsed view */
.usage-bars-compact {
  margin-bottom: 4px;
}

.usage-bars-compact .rate-bar-container {
  height: 4px;
  margin-bottom: 2px;
  background-color: #eaeaea;
  border-radius: 2px;
  overflow: hidden;
}

/* Expanded details section */
.usage-details-expanded {
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px dashed var(--ark-color-black-shadow);
  animation: fadeIn 0.3s ease;
  width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
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

.usage-bar.lighter {
  opacity: 0.7;
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
.lte-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.lte-status-card, .lte-interface-card, .lte-dns-card {
  background-color: var(--ark-color-white);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--ark-color-black-shadow);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lte-status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.lte-status-header h3, .lte-interface-card h3, .lte-dns-card h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--ark-color-black);
}

.lte-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);  /* Force 3 columns for better layout */
  gap: 16px;
  margin-bottom: 12px;
}

.lte-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 0.85rem;
  color: var(--ark-color-black);
  opacity: 0.7;
}

.info-value {
  font-size: 1rem;
  color: var(--ark-color-black-bold);
}

.lte-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.connect-button, .disconnect-button {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  gap: 8px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.connect-button {
  background-color: var(--ark-color-green);
  color: var(--ark-color-white);
}

.connect-button:hover {
  background-color: var(--ark-color-green-hover);
}

.disconnect-button {
  background-color: var(--ark-color-red);
  color: var(--ark-color-white);
}

.disconnect-button:hover {
  background-color: var(--ark-color-red-hover);
}

.lte-connected-info {
  display: flex;
  gap: 20px;
}

.lte-interface-card, .lte-dns-card {
  flex: 1;
}

.dns-server-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dns-server-item {
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-family: monospace;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dns-server-item i {
  color: var(--ark-color-blue);
}

.empty-dns {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80px;
  color: var(--ark-color-black);
  opacity: 0.6;
  font-style: italic;
}

.signal-container {
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.signal-bar {
  height: 100%;
  background-color: var(--ark-color-blue);
  border-radius: 4px;
}

.signal-bar.good {
  background-color: var(--ark-color-green);
}

.signal-bar.fair {
  background-color: var(--ark-color-orange);
}

.signal-bar.poor {
  background-color: var(--ark-color-red);
}

/* Status badge colors */
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--ark-color-white);
  text-transform: uppercase;
  font-weight: 500;
}

.status-badge.connected {
  background-color: var(--ark-color-green);
}

.status-badge.registered {
  background-color: var(--ark-color-blue);
}

.status-badge.searching {
  background-color: var(--ark-color-orange);
}

.status-badge.disabled, 
.status-badge.not_ready {
  background-color: var(--ark-color-red);
}

.status-badge.active {
  background-color: var(--ark-color-green);
}

.status-badge.inactive {
  background-color: var(--ark-color-red);
}

@media (max-width: 768px) {
  .lte-info-grid {
    grid-template-columns: 1fr;
  }
  
  .lte-connected-info {
    flex-direction: column;
    gap: 16px;
  }
}

.lte-info-card {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--ark-color-black-shadow);
  overflow: hidden;
}

.info-label {
  color: var(--ark-color-black);
  font-size: 0.8rem;
  margin-bottom: 8px;
  opacity: 0.7;
}

.info-value {
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-success {
  color: var(--ark-color-green);
}

.lte-actions-container {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--ark-color-black-shadow);
  width: 100%;
  margin-top: 20px;
  overflow: hidden;
  box-sizing: border-box;
}

.lte-connect-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 100%;
}

.apn-form-group {
  max-width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
}

.apn-form-group label {
  flex-shrink: 0;
}

.apn-input-container {
  position: relative;
  flex: 1;
  min-width: 0;
}

.wide-input {
  width: 100%;
  box-sizing: border-box;
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

/* For showing fake data during testing */
.empty-state.with-fake-data {
  display: flex;
  flex-direction: column;
}

.empty-state.with-fake-data .empty-message {
  margin-bottom: 30px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #ccc;
}

.empty-state.with-fake-data .note {
  font-size: 0.8rem;
  opacity: 0.6;
  margin-top: 5px;
  font-style: italic;
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

.error-message, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--ark-color-red);
}

.error-message i, .error-container i {
  font-size: 2rem;
  margin-bottom: 16px;
}

.error-container p {
  margin-bottom: 16px;
  text-align: center;
  max-width: 80%;
}

/* Smaller, less intrusive error message */
.error-message-small {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  margin-bottom: 10px;
  background-color: rgba(244, 67, 54, 0.1);
  border-radius: 4px;
  color: var(--ark-color-red);
}

.error-message-small i {
  font-size: 1rem;
  margin-right: 8px;
}

.error-message-small p {
  margin: 0;
  font-size: 0.9rem;
}

.text-warning {
  color: var(--ark-color-orange);
}

.text-error {
  color: var(--ark-color-red);
}

.network-registered-message {
  margin: 10px 0;
  padding: 8px;
  background-color: rgba(255, 140, 0, 0.1);
  border-radius: 4px;
  color: var(--ark-color-orange);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.small-text {
  font-size: 0.8rem;
  opacity: 0.8;
  margin-top: 4px;
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

@media (max-width: 992px) and (min-width: 769px) {
  .lte-info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
