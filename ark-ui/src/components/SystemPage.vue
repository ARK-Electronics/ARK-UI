<template>
  <div class="system-container">
    <h2>System Information</h2>

    <div v-if="loading" class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
    </div>

    <div v-else class="system-grid">
      <!-- Hardware Section -->
      <div class="system-box">
        <div class="section-header">
          <i class="fas fa-microchip"></i>
          <span class="section-title">Hardware</span>
        </div>
        <div class="info-content">
          <div class="info-row">
            <p class="info-label">Model:</p>
            <p class="info-value">{{ systemInfo.hardware.model }}</p>
          </div>
          <div class="info-row">
            <p class="info-label">Module:</p>
            <p class="info-value">{{ systemInfo.hardware.module }}</p>
          </div>
          <div class="info-row">
            <p class="info-label">Serial:</p>
            <p class="info-value">{{ systemInfo.hardware.serial_number }}</p>
          </div>
          <div class="info-row">
            <p class="info-label">L4T:</p>
            <p class="info-value">{{ systemInfo.hardware.l4t }}</p>
          </div>
          <div class="info-row">
            <p class="info-label">JetPack:</p>
            <p class="info-value">{{ systemInfo.hardware.jetpack }}</p>
          </div>
        </div>
      </div>

      <!-- Platform Section -->
      <div class="system-box">
        <div class="section-header">
          <i class="fas fa-server"></i>
          <span class="section-title">Platform</span>
        </div>
        <div class="info-content">
          <div class="info-row">
            <p class="info-label">Distribution:</p>
            <p class="info-value">{{ systemInfo.platform.distribution }}</p>
          </div>
          <div class="info-row">
            <p class="info-label">Release:</p>
            <p class="info-value">{{ systemInfo.platform.release }}</p>
          </div>
          <div class="info-row">
            <p class="info-label">Python:</p>
            <p class="info-value">{{ systemInfo.platform.python }}</p>
          </div>
        </div>
      </div>

      <!-- Libraries Section -->
      <div class="system-box">
        <div class="section-header">
          <i class="fas fa-book"></i>
          <span class="section-title">Libraries</span>
        </div>
        <div class="info-content">
          <div class="info-row">
            <p class="info-label">CUDA:</p>
            <p class="info-value">{{ systemInfo.libraries.cuda }}</p>
          </div>
          <div class="info-row">
            <p class="info-label">OpenCV:</p>
            <p class="info-value">{{ systemInfo.libraries.opencv }}</p>
          </div>
          <div class="info-row">
            <p class="info-label">OpenCV-CUDA:</p>
            <p class="info-value">{{ systemInfo.libraries.opencv_cuda ? 'Yes' : 'No' }}</p>
          </div>
          <div class="info-row">
            <p class="info-label">cuDNN:</p>
            <p class="info-value">{{ systemInfo.libraries.cudnn }}</p>
          </div>
          <div class="info-row">
            <p class="info-label">TensorRT:</p>
            <p class="info-value">{{ systemInfo.libraries.tensorrt }}</p>
          </div>
          <div class="info-row">
            <p class="info-label">VPI:</p>
            <p class="info-value">{{ systemInfo.libraries.vpi }}</p>
          </div>
          <div class="info-row">
            <p class="info-label">Vulkan:</p>
            <p class="info-value">{{ systemInfo.libraries.vulkan }}</p>
          </div>
        </div>
      </div>

      <!-- Power & Temperature Section -->
      <div class="system-box">
        <div class="section-header">
          <i class="fas fa-bolt"></i>
          <span class="section-title">Power & Temperature</span>
        </div>
        <div class="info-content">
          <div class="info-row">
            <p class="info-label">Power Mode:</p>
            <p class="info-value">{{ systemInfo.power.nvpmodel }}</p>
          </div>
          <div class="info-row">
            <p class="info-label">Jetson Clocks:</p>
            <p class="info-value">{{ systemInfo.power.jetson_clocks ? 'Enabled' : 'Disabled' }}</p>
          </div>
          <div class="info-row">
            <p class="info-label">Power Draw:</p>
            <p class="info-value">{{ (systemInfo.power.total / 1000).toFixed(2) }} W</p>
          </div>
          <div class="info-row">
            <p class="info-label">CPU Temp:</p>
            <p class="info-value">{{ systemInfo.power.temperature.cpu.toFixed(1) }}°C</p>
          </div>
          <div class="info-row">
            <p class="info-label">GPU Temp:</p>
            <p class="info-value">{{ systemInfo.power.temperature.gpu.toFixed(1) }}°C</p>
          </div>
          <div class="info-row">
            <p class="info-label">Junction Temp:</p>
            <p class="info-value">{{ systemInfo.power.temperature.tj.toFixed(1) }}°C</p>
          </div>
        </div>
      </div>

      <!-- Network Section -->
      <div class="system-box">
        <div class="section-header">
          <i class="fas fa-network-wired"></i>
          <span class="section-title">Network</span>
        </div>
        <div class="info-content">
          <div class="info-row">
            <p class="info-label">Hostname:</p>
            <p class="info-value">{{ systemInfo.interfaces.hostname }}</p>
          </div>
          <div v-for="(ip, iface) in systemInfo.interfaces.interfaces" :key="iface" class="info-row">
            <p class="info-label">{{ iface }}:</p>
            <p class="info-value">{{ ip }}</p>
          </div>
        </div>
      </div>

      <!-- Storage Section -->
      <div class="system-box">
        <div class="section-header">
          <i class="fas fa-hdd"></i>
          <span class="section-title">Storage</span>
        </div>
        <div class="info-content">
          <div class="info-row">
            <p class="info-label">Total:</p>
            <p class="info-value">{{ systemInfo.disk.total.toFixed(1) }} GB</p>
          </div>
          <div class="info-row">
            <p class="info-label">Used:</p>
            <p class="info-value">{{ systemInfo.disk.used.toFixed(1) }} GB</p>
          </div>
          <div class="info-row">
            <p class="info-label">Available:</p>
            <p class="info-value">{{ systemInfo.disk.available.toFixed(1) }} GB</p>
          </div>
          <div class="disk-usage-container">
            <div class="progress-bar">
              <div class="progress-fill" :class="{ 'high': diskUsagePercentage > 80 }" :style="{ width: diskUsagePercentage + '%' }"></div>
              <p class="progress-text">{{ diskUsagePercentage }}% Used</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SystemService from '../services/SystemService';

export default {
  data() {
    return {
      systemInfo: {
        hardware: {
          model: '',
          module: '',
          serial_number: '',
          l4t: '',
          jetpack: ''
        },
        platform: {
          distribution: '',
          release: '',
          python: ''
        },
        libraries: {
          cuda: '',
          opencv: '',
          opencv_cuda: false,
          cudnn: '',
          tensorrt: '',
          vpi: '',
          vulkan: ''
        },
        power: {
          nvpmodel: '',
          jetson_clocks: false,
          total: 0,
          temperature: {
            cpu: 0,
            gpu: 0,
            tj: 0
          }
        },
        interfaces: {
          hostname: '',
          interfaces: {}
        },
        disk: {
          total: 0,
          used: 0,
          available: 0
        }
      },
      loading: true,
      pollingInterval: null
    };
  },
  computed: {
    diskUsagePercentage() {
      return Math.round((this.systemInfo.disk.used / this.systemInfo.disk.total) * 100);
    }
  },
  mounted() {
    this.fetchSystemInfo();
    this.startPolling();
  },
  beforeUnmount() {
    this.stopPolling();
  },
  methods: {
    startPolling() {
      this.pollingInterval = setInterval(() => {
        this.fetchSystemInfo();
      }, 3000); // Poll every 3 seconds
    },
    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }
    },
    async fetchSystemInfo() {
      try {
        const response = await SystemService.getJetsonInfo();
        if (response.data) {
          this.systemInfo = response.data;
          this.loading = false;
        }
      } catch (error) {
        console.error('Error fetching system information:', error);
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
h2 {
  text-align: center;
  color: var(--ark-color-black);
  margin-bottom: 25px;
  font-size: 24px;
}

.system-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.fa-spinner {
  font-size: 2em;
  color: var(--ark-color-black);
}

.fa-spinner.fa-spin {
  animation: spin 1s infinite linear;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.system-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: minmax(min-content, auto);
  gap: 12px;
  width: 100%;
}

.system-box {
  border: 1px solid var(--ark-color-black-shadow);
  background-color: var(--ark-color-white);
  border-radius: 6px;
  box-shadow: 0px 2px 6px rgba(0,0,0,0.08);
  transition: box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.system-box:hover {
  box-shadow: 0px 4px 8px rgba(0,0,0,0.12);
}

.section-header {
  background-color: rgba(0,0,0,0.03);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--ark-color-black-shadow);
}

.section-header i {
  margin-right: 8px;
  color: var(--ark-color-black);
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--ark-color-black);
}

.info-content {
  padding: 10px 12px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 4px 0;
  font-size: 13px;
}

.info-label {
  font-weight: 500;
  color: var(--ark-color-black);
  margin: 0;
}

.info-value {
  color: var(--ark-color-black);
  text-align: right;
  margin: 0;
  max-width: 65%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.disk-usage-container {
  margin-top: 10px;
}

.progress-bar {
  position: relative;
  width: 100%;
  height: 20px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--ark-color-green);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.high {
  background-color: var(--ark-color-red);
}

.progress-text {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  text-align: center;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.7);
  font-size: 12px;
  font-weight: 500;
  margin: 0;
}

@media (max-width: 1200px) {
  .system-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .system-grid {
    grid-template-columns: 1fr;
  }
}
</style>
