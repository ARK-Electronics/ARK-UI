<template>
  <div class="page-container">
    <!-- Header -->
    <h1 class="page-title">System Management</h1>

    <!-- System Overview Section -->
    <div class="section-container">
      <div class="section-header">
        <h2 class="section-title">System Overview</h2>
        <div class="header-actions">
          <button @click="refreshSystemData" class="refresh-button">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': isRefreshing }"></i>
            Refresh
          </button>
        </div>
      </div>

      <div class="overview-grid">
        <!-- Device Info Card -->
        <div class="system-card">
          <h3 class="card-title device-title">
            <i class="fas fa-microchip"></i> Device Information
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Model:</span>
              <span class="info-value">{{ systemInfo.model }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">OS Version:</span>
              <span class="info-value">{{ systemInfo.osVersion }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Kernel:</span>
              <span class="info-value">{{ systemInfo.kernel }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Uptime:</span>
              <span class="info-value">{{ systemInfo.uptime }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Hostname:</span>
              <span class="info-value">{{ systemInfo.hostname }}</span>
            </div>
          </div>
        </div>

        <!-- Storage Card -->
        <div class="system-card">
          <h3 class="card-title storage-title">
            <i class="fas fa-hdd"></i> Storage
          </h3>
          <div class="storage-container">
            <div v-for="(disk, index) in storageInfo" :key="index" class="storage-item">
              <div class="storage-details">
                <div class="storage-name">{{ disk.name }}</div>
                <div class="storage-path">{{ disk.path }}</div>
                <div class="storage-text">
                  {{ formatStorage(disk.used) }} / {{ formatStorage(disk.total) }}
                  ({{ disk.percent }}%)
                </div>
              </div>
              <div class="gauge-bar-container">
                <div class="gauge-bar" :style="{ width: `${disk.percent}%` }"
                     :class="getDiskClass(disk.percent)"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Network Card -->
        <div class="system-card">
          <h3 class="card-title network-title">
            <i class="fas fa-network-wired"></i> Network
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">IP Address:</span>
              <span class="info-value">{{ networkInfo.ipAddress }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Interface:</span>
              <span class="info-value">{{ networkInfo.interface }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Download:</span>
              <span class="info-value">{{ networkInfo.downloadRate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Upload:</span>
              <span class="info-value">{{ networkInfo.uploadRate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Status:</span>
              <span class="info-value" :class="{'connected': networkInfo.isConnected}">
                {{ networkInfo.isConnected ? 'Connected' : 'Disconnected' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance & Thermal Section -->
    <div class="dual-section-container">
      <!-- Performance Metrics Section -->
      <div class="section-container performance-section">
        <div class="section-header">
          <h2 class="section-title">Performance Metrics</h2>
        </div>

        <!-- CPU Usage -->
        <div class="system-card">
          <h3 class="card-title cpu-title">
            <i class="fas fa-tachometer-alt"></i> CPU Usage
          </h3>
          <div class="cpu-container">
            <div class="cpu-overview">
              <div class="cpu-gauge">{{ performanceMetrics.cpuTotalUsage }}%</div>
              <div class="load-averages">
                <div class="load-label">Load Avg:</div>
                <div class="load-values">
                  {{ performanceMetrics.loadAverage[0] }} /
                  {{ performanceMetrics.loadAverage[1] }} /
                  {{ performanceMetrics.loadAverage[2] }}
                </div>
              </div>
            </div>

            <div class="cpu-cores">
              <div v-for="(core, index) in performanceMetrics.cpuCores" :key="index" class="cpu-core">
                <div class="core-name">CPU {{ index }}</div>
                <div class="core-frequency">{{ core.frequency }} MHz</div>
                <div class="gauge-bar-container">
                  <div class="gauge-bar" :style="{ width: `${core.usage}%` }"
                       :class="getCpuCoreClass(core.usage)"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Memory Usage -->
        <div class="system-card">
          <h3 class="card-title memory-title">
            <i class="fas fa-memory"></i> Memory Usage
          </h3>
          <div class="memory-container">
            <div class="memory-overview">
              <div class="memory-gauge">
                {{ formatStorage(performanceMetrics.memoryUsed) }} /
                {{ formatStorage(performanceMetrics.memoryTotal) }}
                ({{ performanceMetrics.memoryPercent }}%)
              </div>
            </div>
            <div class="gauge-bar-container">
              <div class="gauge-bar" :style="{ width: `${performanceMetrics.memoryPercent}%` }"
                   :class="getMemoryClass(performanceMetrics.memoryPercent)"></div>
            </div>
            <div class="memory-breakdown">
              <div class="memory-item">
                <div class="memory-type">Applications</div>
                <div class="memory-value">{{ formatStorage(performanceMetrics.memoryBreakdown.applications) }}</div>
              </div>
              <div class="memory-item">
                <div class="memory-type">Buffers</div>
                <div class="memory-value">{{ formatStorage(performanceMetrics.memoryBreakdown.buffers) }}</div>
              </div>
              <div class="memory-item">
                <div class="memory-type">Cache</div>
                <div class="memory-value">{{ formatStorage(performanceMetrics.memoryBreakdown.cache) }}</div>
              </div>
              <div class="memory-item">
                <div class="memory-type">Swap</div>
                <div class="memory-value">{{ formatStorage(performanceMetrics.memoryBreakdown.swap) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- GPU Usage (if applicable) -->
        <div class="system-card" v-if="performanceMetrics.gpuAvailable">
          <h3 class="card-title gpu-title">
            <i class="fas fa-microchip"></i> GPU Usage
          </h3>
          <div class="gpu-container">
            <div class="gpu-stats">
              <div class="gpu-usage">
                <span class="gpu-label">Utilization:</span>
                <span class="gpu-value">{{ performanceMetrics.gpuUsage }}%</span>
              </div>
              <div class="gpu-memory">
                <span class="gpu-label">Memory:</span>
                <span class="gpu-value">
                  {{ formatStorage(performanceMetrics.gpuMemoryUsed) }} /
                  {{ formatStorage(performanceMetrics.gpuMemoryTotal) }}
                  ({{ performanceMetrics.gpuMemoryPercent }}%)
                </span>
              </div>
              <div class="gpu-clock">
                <span class="gpu-label">Clock:</span>
                <span class="gpu-value">{{ performanceMetrics.gpuClock }} MHz</span>
              </div>
            </div>
            <div class="gpu-bars">
              <div class="gpu-bar-item">
                <div class="gpu-bar-label">Utilization</div>
                <div class="gauge-bar-container">
                  <div class="gauge-bar" :style="{ width: `${performanceMetrics.gpuUsage}%` }"
                       :class="getGpuClass(performanceMetrics.gpuUsage)"></div>
                </div>
              </div>
              <div class="gpu-bar-item">
                <div class="gpu-bar-label">Memory</div>
                <div class="gauge-bar-container">
                  <div class="gauge-bar" :style="{ width: `${performanceMetrics.gpuMemoryPercent}%` }"
                       :class="getGpuClass(performanceMetrics.gpuMemoryPercent)"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Thermal Management Section -->
      <div class="section-container thermal-section">
        <div class="section-header">
          <h2 class="section-title">Thermal Management</h2>
        </div>

        <!-- Temperature Card -->
        <div class="system-card">
          <h3 class="card-title temp-title">
            <i class="fas fa-thermometer-half"></i> Temperatures
          </h3>
          <div class="temperature-container">
            <div v-for="(sensor, index) in thermalInfo.sensors" :key="index" class="temp-item">
              <div class="temp-info">
                <div class="temp-name">{{ sensor.name }}</div>
                <div class="temp-value" :class="getTempClass(sensor.temperature)">
                  {{ sensor.temperature }}°C
                </div>
              </div>
              <div class="gauge-bar-container">
                <div class="gauge-bar" :style="{ width: `${(sensor.temperature / sensor.max) * 100}%` }"
                     :class="getTempClass(sensor.temperature)"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Throttling Status Card -->
        <div class="system-card">
          <h3 class="card-title throttle-title">
            <i class="fas fa-exclamation-triangle"></i> Throttling Status
          </h3>
          <div class="throttle-container">
            <div class="throttle-status" :class="{'throttling': thermalInfo.isThrottling}">
              <i :class="thermalInfo.isThrottling ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'"></i>
              <span>{{ thermalInfo.isThrottling ? 'Thermal Throttling Active' : 'No Throttling' }}</span>
            </div>
            <div class="throttle-info" v-if="thermalInfo.isThrottling">
              <div class="throttle-reason">{{ thermalInfo.throttleReason }}</div>
              <div class="throttle-time">Since: {{ thermalInfo.throttleSince }}</div>
            </div>
            <div class="throttle-history">
              <div class="throttle-history-title">Throttling History:</div>
              <div class="throttle-history-item" :class="{'throttled': thermalInfo.throttleHistory.undervoltage}">
                <i :class="thermalInfo.throttleHistory.undervoltage ? 'fas fa-times' : 'fas fa-check'"></i>
                <span>Undervoltage detected</span>
              </div>
              <div class="throttle-history-item" :class="{'throttled': thermalInfo.throttleHistory.frequencyCap}">
                <i :class="thermalInfo.throttleHistory.frequencyCap ? 'fas fa-times' : 'fas fa-check'"></i>
                <span>Frequency capped</span>
              </div>
              <div class="throttle-history-item" :class="{'throttled': thermalInfo.throttleHistory.throttled}">
                <i :class="thermalInfo.throttleHistory.throttled ? 'fas fa-times' : 'fas fa-check'"></i>
                <span>Throttled</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Power Information Card -->
        <div class="system-card">
          <h3 class="card-title power-title">
            <i class="fas fa-bolt"></i> Power Information
          </h3>
          <div class="power-container">
            <div class="power-consumption">
              <div class="power-title">Current Consumption</div>
              <div class="power-value">{{ thermalInfo.powerConsumption }} W</div>
            </div>
            <div class="voltage-rails">
              <div class="voltage-title">Voltage Rails</div>
              <div v-for="(rail, index) in thermalInfo.voltageRails" :key="index" class="voltage-item">
                <div class="voltage-name">{{ rail.name }}</div>
                <div class="voltage-value" :class="{'voltage-warning': rail.voltage < rail.nominal * 0.95}">
                  {{ rail.voltage.toFixed(2) }}V
                </div>
              </div>
            </div>
            <div class="power-mode">
              <div class="power-mode-title">Current Power Mode</div>
              <div class="power-mode-value">{{ thermalInfo.powerMode }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- System Controls Section -->
    <div class="section-container">
      <div class="section-header">
        <h2 class="section-title">System Controls</h2>
      </div>

      <div class="controls-grid">
        <!-- Power Controls Card -->
        <div class="system-card">
          <h3 class="card-title controls-title">
            <i class="fas fa-power-off"></i> Power Controls
          </h3>
          <div class="controls-container">
            <div class="controls-warning">
              Warning: These actions will affect system operation immediately.
            </div>
            <div class="control-buttons">
              <button @click="showRebootConfirmation = true" class="control-button reboot-button">
                <i class="fas fa-redo-alt"></i> Reboot System
              </button>
              <button @click="showShutdownConfirmation = true" class="control-button shutdown-button">
                <i class="fas fa-power-off"></i> Shutdown System
              </button>
            </div>
          </div>
        </div>

        <!-- Configuration Card -->
        <div class="system-card">
          <h3 class="card-title config-title">
            <i class="fas fa-sliders-h"></i> System Configuration
          </h3>
          <div class="config-container">
            <div class="config-item">
              <div class="config-label">Overlay Selection:</div>
              <select v-model="selectedOverlay" class="config-select">
                <option v-for="overlay in systemConfig.overlays" :key="overlay" :value="overlay">
                  {{ overlay }}
                </option>
              </select>
            </div>
            <div class="config-item">
              <div class="config-label">Performance Mode:</div>
              <select v-model="selectedPerfMode" class="config-select">
                <option v-for="mode in systemConfig.performanceModes" :key="mode.value" :value="mode.value">
                  {{ mode.label }}
                </option>
              </select>
            </div>
            <div class="config-buttons">
              <button @click="applySystemConfig" class="config-button">
                <i class="fas fa-check"></i> Apply Changes
              </button>
            </div>
          </div>
        </div>

        <!-- Logs Card -->
        <div class="system-card">
          <h3 class="card-title logs-title">
            <i class="fas fa-file-alt"></i> System Logs
          </h3>
          <div class="logs-container">
            <div class="logs-selector">
              <select v-model="selectedLogFile" class="logs-select">
                <option v-for="log in systemLogs" :key="log.path" :value="log.path">
                  {{ log.name }}
                </option>
              </select>
              <button @click="viewLogs" class="logs-button">
                <i class="fas fa-eye"></i> View
              </button>
              <button @click="downloadLogs" class="logs-button">
                <i class="fas fa-download"></i> Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reboot Confirmation Dialog -->
    <div v-if="showRebootConfirmation" class="dialog-overlay">
      <div class="dialog-container">
        <div class="dialog-header">
          <h3 class="dialog-title">Confirm Reboot</h3>
          <button @click="showRebootConfirmation = false" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="dialog-content">
          <div class="warning-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <p class="dialog-text">
            Are you sure you want to reboot the system? All unsaved work will be lost.
          </p>
          <div class="dialog-actions">
            <button @click="showRebootConfirmation = false" class="cancel-button">Cancel</button>
            <button @click="rebootSystem" class="confirm-button">
              <i class="fas fa-redo-alt"></i> Reboot System
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Shutdown Confirmation Dialog -->
    <div v-if="showShutdownConfirmation" class="dialog-overlay">
      <div class="dialog-container">
        <div class="dialog-header">
          <h3 class="dialog-title">Confirm Shutdown</h3>
          <button @click="showShutdownConfirmation = false" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="dialog-content">
          <div class="warning-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <p class="dialog-text">
            Are you sure you want to shutdown the system? All unsaved work will be lost.
          </p>
          <div class="dialog-actions">
            <button @click="showShutdownConfirmation = false" class="cancel-button">Cancel</button>
            <button @click="shutdownSystem" class="confirm-button">
              <i class="fas fa-power-off"></i> Shutdown System
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SystemPage',
  data() {
    return {
      isRefreshing: false,

      // Status dialogs
      showRebootConfirmation: false,
      showShutdownConfirmation: false,

      // Configuration selections
      selectedOverlay: 'default',
      selectedPerfMode: 'balanced',
      selectedLogFile: '',

      // DUMMY DATA - Replace with actual implementation
      systemInfo: {
        model: 'NVIDIA Jetson Xavier NX',
        osVersion: 'Ubuntu 20.04.6 LTS',
        kernel: '5.10.120-tegra',
        uptime: '3 days, 7 hours, 15 minutes',
        hostname: 'ark-jetson',
      },

      storageInfo: [
        {
          name: 'Root Filesystem',
          path: '/',
          used: 23.5 * 1024 * 1024 * 1024,
          total: 64 * 1024 * 1024 * 1024,
          percent: 37
        },
        {
          name: 'Data Partition',
          path: '/data',
          used: 76.8 * 1024 * 1024 * 1024,
          total: 256 * 1024 * 1024 * 1024,
          percent: 30
        }
      ],

      networkInfo: {
        ipAddress: '192.168.1.15',
        interface: 'eth0',
        downloadRate: '1.2 MB/s',
        uploadRate: '0.3 MB/s',
        isConnected: true
      },

      performanceMetrics: {
        cpuTotalUsage: 27,
        loadAverage: [0.52, 0.48, 0.42],
        cpuCores: [
          { usage: 35, frequency: 1900 },
          { usage: 42, frequency: 1900 },
          { usage: 12, frequency: 1500 },
          { usage: 18, frequency: 1700 },
          { usage: 36, frequency: 1900 },
          { usage: 8, frequency: 1200 }
        ],
        memoryUsed: 3.2 * 1024 * 1024 * 1024,
        memoryTotal: 8 * 1024 * 1024 * 1024,
        memoryPercent: 40,
        memoryBreakdown: {
          applications: 2.2 * 1024 * 1024 * 1024,
          buffers: 0.3 * 1024 * 1024 * 1024,
          cache: 0.7 * 1024 * 1024 * 1024,
          swap: 0.1 * 1024 * 1024 * 1024
        },
        gpuAvailable: true,
        gpuUsage: 24,
        gpuMemoryUsed: 0.8 * 1024 * 1024 * 1024,
        gpuMemoryTotal: 2 * 1024 * 1024 * 1024,
        gpuMemoryPercent: 40,
        gpuClock: 850
      },

      thermalInfo: {
        sensors: [
          { name: 'CPU', temperature: 45, max: 95 },
          { name: 'GPU', temperature: 42, max: 95 },
          { name: 'SoC', temperature: 40, max: 95 },
          { name: 'Ambient', temperature: 32, max: 80 }
        ],
        isThrottling: false,
        throttleReason: 'Temperature exceeded threshold',
        throttleSince: '2023-04-05 14:32:45',
        throttleHistory: {
          undervoltage: false,
          frequencyCap: false,
          throttled: false
        },
        powerConsumption: 7.5,
        voltageRails: [
          { name: 'CPU', voltage: 1.05, nominal: 1.1 },
          { name: 'GPU', voltage: 0.95, nominal: 1.0 },
          { name: 'SoC', voltage: 1.8, nominal: 1.8 }
        ],
        powerMode: 'Balanced'
      },

      systemConfig: {
        overlays: ['default', 'minimal', 'extended', 'developer'],
        performanceModes: [
          { value: 'powersave', label: 'Power Saving' },
          { value: 'balanced', label: 'Balanced' },
          { value: 'performance', label: 'Performance' },
          { value: 'maxperf', label: 'Maximum Performance' }
        ]
      },

      systemLogs: [
        { name: 'System Log', path: '/var/log/syslog' },
        { name: 'Kernel Log', path: '/var/log/kern.log' },
        { name: 'Application Log', path: '/var/log/app.log' },
        { name: 'Boot Log', path: '/var/log/boot.log' }
      ]
    };
  },

  mounted() {
    // Set initial log file selection
    if (this.systemLogs.length > 0) {
      this.selectedLogFile = this.systemLogs[0].path;
    }

    // In real implementation, fetch initial data here
    this.fetchSystemData();

    // Set up polling interval for data updates
    this.startPolling();
  },

  beforeUnmount() {
    // Clear polling interval when component is unmounted
    this.stopPolling();
  },

  methods: {
    // Start polling for data updates
    startPolling() {
      this.pollingInterval = setInterval(() => {
        this.fetchSystemData();
      }, 5000); // Poll every 5 seconds
    },

    // Stop polling
    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    },

    // Fetch system data - replace with actual API calls
    fetchSystemData() {
      this.isRefreshing = true;

      // Simulate API call delay
      setTimeout(() => {
        // In the real implementation, you would make API calls to get the data
        // and update the state variables

        this.isRefreshing = false;

        // Generate some random variations in the dummy data to simulate updates
        this.updateDummyData();
      }, 1000);
    },

    // Simulate data changes - remove in actual implementation
    updateDummyData() {
      // Update CPU usage with random variations
      this.performanceMetrics.cpuTotalUsage = Math.min(100, Math.max(5, this.performanceMetrics.cpuTotalUsage + (Math.random() * 10 - 5)));

      this.performanceMetrics.cpuCores.forEach(core => {
        core.usage = Math.min(100, Math.max(1, core.usage + (Math.random() * 16 - 8)));
        core.frequency = Math.min(2000, Math.max(800, core.frequency + (Math.random() * 200 - 100)));
      });

      // Update GPU usage
      if (this.performanceMetrics.gpuAvailable) {
        this.performanceMetrics.gpuUsage = Math.min(100, Math.max(1, this.performanceMetrics.gpuUsage + (Math.random() * 10 - 5)));
      }

      // Update temperatures
      this.thermalInfo.sensors.forEach(sensor => {
        sensor.temperature = Math.min(sensor.max - 5, Math.max(25, sensor.temperature + (Math.random() * 4 - 2)));
      });

      // Occasionally simulate throttling
      if (Math.random() < 0.05) {
        this.thermalInfo.isThrottling = !this.thermalInfo.isThrottling;
      }
    },

    // Refresh system data
    refreshSystemData() {
      this.fetchSystemData();
    },

    // Format storage size to human-readable format
    formatStorage(bytes) {
      if (bytes === 0) return '0 B';

      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));

      return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
    },

    // Get CSS class for disk usage indicator
    getDiskClass(percent) {
      if (percent >= 90) return 'gauge-critical';
      if (percent >= 75) return 'gauge-warning';
      return 'gauge-normal';
    },

    // Get CSS class for CPU core usage indicator
    getCpuCoreClass(percent) {
      if (percent >= 90) return 'gauge-critical';
      if (percent >= 70) return 'gauge-warning';
      return 'gauge-normal';
    },

    // Get CSS class for memory usage indicator
    getMemoryClass(percent) {
      if (percent >= 90) return 'gauge-critical';
      if (percent >= 75) return 'gauge-warning';
      return 'gauge-normal';
    },

    // Get CSS class for GPU usage indicator
    getGpuClass(percent) {
      if (percent >= 90) return 'gauge-critical';
      if (percent >= 75) return 'gauge-warning';
      return 'gauge-normal';
    },

    // Get CSS class for temperature indicator
    getTempClass(temp) {
      if (temp >= 80) return 'temp-critical';
      if (temp >= 70) return 'temp-warning';
      return 'temp-normal';
    },

    // Apply system configuration changes
    applySystemConfig() {
      // In real implementation, make API call to apply config changes
      alert(`Applied changes: Overlay=${this.selectedOverlay}, Performance Mode=${this.selectedPerfMode}`);
    },

    // Reboot system
    rebootSystem() {
      // In real implementation, make API call to reboot system
      alert('System reboot initiated');
      this.showRebootConfirmation = false;
    },

    // Shutdown system
    shutdownSystem() {
      // In real implementation, make API call to shutdown system
      alert('System shutdown initiated');
      this.showShutdownConfirmation = false;
    },

    // Download logs
    downloadLogs() {
      if (!this.selectedLogFile) return;

      // In real implementation, fetch log content from API and trigger download
      alert(`Download started for: ${this.getSelectedLogName()}`);
    },

    // Get selected log name
    getSelectedLogName() {
      const selectedLog = this.systemLogs.find(log => log.path === this.selectedLogFile);
      return selectedLog ? selectedLog.name : '';
    },

    // View logs
    viewLogs() {
      if (!this.selectedLogFile) return;

      // In real implementation, fetch log content from API
      alert(`Viewing logs: ${this.getSelectedLogName()}`);
    }
  }
};
</script>

<style scoped>
/* Page Layout */
.page-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  gap: 20px;
  box-sizing: border-box;
}

.page-title {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--ark-color-black);
  margin: 0 0 16px 0;
  text-align: center;
}

.section-container {
  width: 100%;
  background-color: var(--ark-color-white);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--ark-color-black-shadow);
  padding: 20px;
  box-sizing: border-box;
}

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

.refresh-button {
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

.dual-section-container {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 20px;
  width: 100%;
}

@media (max-width: 1024px) {
  .dual-section-container {
    grid-template-columns: 1fr;
  }
}

/* Cards */
.system-card {
  background-color: var(--ark-color-white);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--ark-color-black-shadow);
  padding: 16px;
  margin-bottom: 16px;
}

.system-card:last-child {
  margin-bottom: 0;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--ark-color-black-shadow);
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-title, .network-title {
  color: var(--ark-color-blue);
}

.storage-title {
  color: var(--ark-color-purple);
}

.cpu-title, .gpu-title {
  color: var(--ark-color-orange);
}

.memory-title {
  color: var(--ark-color-green);
}

.temp-title, .throttle-title {
  color: var(--ark-color-red);
}

.power-title {
  color: var(--ark-color-yellow);
}

.controls-title, .config-title, .logs-title {
  color: var(--ark-color-blue);
}

/* Overview Grid */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
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
  font-weight: 500;
}

.info-value.connected {
  color: var(--ark-color-green);
}

/* Storage Section */
.storage-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.storage-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.storage-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.storage-name {
  font-weight: 500;
}

.storage-path {
  font-size: 0.85rem;
  opacity: 0.8;
  font-family: monospace;
}

.storage-text {
  font-size: 0.9rem;
}

/* Gauge Bars */
.gauge-bar-container {
  width: 100%;
  height: 8px;
  background-color: var(--ark-color-black-shadow);
  border-radius: 4px;
  overflow: hidden;
}

.gauge-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.gauge-normal {
  background-color: var(--ark-color-green);
}

.gauge-warning {
  background-color: var(--ark-color-orange);
}

.gauge-critical {
  background-color: var(--ark-color-red);
}

/* CPU Section */
.cpu-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cpu-overview {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cpu-gauge {
  font-size: 1.8rem;
  font-weight: 600;
}

.load-averages {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.load-label {
  font-size: 0.85rem;
  opacity: 0.7;
}

.load-values {
  font-family: monospace;
}

.cpu-cores {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.cpu-core {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.core-name {
  font-weight: 500;
  font-size: 0.9rem;
}

.core-frequency {
  font-size: 0.85rem;
  opacity: 0.8;
}

/* Memory Section */
.memory-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.memory-overview {
  display: flex;
  justify-content: center;
  align-items: center;
}

.memory-gauge {
  font-size: 1.2rem;
  font-weight: 500;
}

.memory-breakdown {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
  margin-top: 8px;
}

.memory-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.memory-type {
  font-size: 0.85rem;
  opacity: 0.8;
}

.memory-value {
  font-weight: 500;
}

/* GPU Section */
.gpu-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gpu-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.gpu-usage, .gpu-memory, .gpu-clock {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gpu-label {
  font-size: 0.85rem;
  opacity: 0.7;
}

.gpu-value {
  font-weight: 500;
}

.gpu-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gpu-bar-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gpu-bar-label {
  font-size: 0.85rem;
  opacity: 0.8;
}

/* Temperature Section */
.temperature-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.temp-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.temp-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.temp-name {
  font-weight: 500;
}

.temp-value {
  font-weight: 600;
}

.temp-normal {
  color: var(--ark-color-green);
}

.temp-warning {
  color: var(--ark-color-orange);
}

.temp-critical {
  color: var(--ark-color-red);
}

/* Throttling Section */
.throttle-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.throttle-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  background-color: var(--ark-color-green-shadow);
  color: var(--ark-color-green);
}

.throttle-status.throttling {
  background-color: rgba(244, 67, 54, 0.1);
  color: var(--ark-color-red);
}

.throttle-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 12px;
}

.throttle-history {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.throttle-history-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.throttle-history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.throttle-history-item.throttled {
  color: var(--ark-color-red);
}

/* Power Information */
.power-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.power-consumption, .voltage-rails, .power-mode {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.power-title, .voltage-title, .power-mode-title {
  font-weight: 500;
  font-size: 0.9rem;
}

.power-value, .power-mode-value {
  font-weight: 600;
  font-size: 1.2rem;
}

.voltage-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.voltage-warning {
  color: var(--ark-color-orange);
}

/* Controls Grid */
.controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

/* Power Controls */
.controls-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.controls-warning {
  background-color: rgba(244, 67, 54, 0.1);
  border-left: 4px solid var(--ark-color-red);
  padding: 8px 12px;
  font-size: 0.9rem;
  color: var(--ark-color-red);
}

.control-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.control-button {
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.reboot-button {
  background-color: var(--ark-color-orange);
  color: white;
}

.reboot-button:hover {
  background-color: rgba(230, 126, 34, 0.8);
}

.shutdown-button {
  background-color: var(--ark-color-red);
  color: white;
}

.shutdown-button:hover {
  background-color: rgba(231, 76, 60, 0.8);
}

/* Configuration Section */
.config-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-label {
  font-weight: 500;
}

.config-select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid var(--ark-color-black-shadow);
  background-color: var(--ark-color-white);
}

.config-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.config-button {
  padding: 8px 16px;
  background-color: var(--ark-color-green);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.config-button:hover {
  background-color: rgba(46, 204, 113, 0.8);
}

/* Logs Section */
.logs-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.logs-selector {
  display: flex;
  gap: 8px;
}

.logs-select {
  flex: 1;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid var(--ark-color-black-shadow);
  background-color: var(--ark-color-white);
}

.logs-button {
  padding: 8px 12px;
  background-color: var(--ark-color-blue);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background-color 0.2s;
}

.logs-button:hover {
  background-color: rgba(52, 152, 219, 0.8);
}

/* Dialog Overlay */
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
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
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
}

.close-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}

.dialog-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.warning-icon {
  font-size: 3rem;
  color: var(--ark-color-orange);
  margin-bottom: 16px;
}

.dialog-text {
  text-align: center;
  margin-bottom: 20px;
  line-height: 1.5;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.cancel-button {
  padding: 8px 16px;
  background-color: var(--ark-color-black-shadow);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-button {
  padding: 8px 16px;
  background-color: var(--ark-color-red);
  color: var(--ark-color-white);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.confirm-button:hover {
  background-color: rgba(231, 76, 60, 0.8);
}

@media (max-width: 768px) {
  .overview-grid,
  .info-grid,
  .controls-grid {
    grid-template-columns: 1fr;
  }

  .cpu-cores,
  .memory-breakdown,
  .gpu-stats {
    grid-template-columns: 1fr 1fr;
  }

  .logs-selector {
    flex-direction: column;
  }
}
</style>
