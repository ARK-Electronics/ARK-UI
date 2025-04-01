<template>
  <div class="autopilot-container">
    <h1>Autopilot</h1>

    <div class="status-indicator" :class="{ connected: isConnected, disconnected: !isConnected }">
      <span>{{ statusText }}</span>
    </div>

    <div class="details-grid">
      <div class="detail">
        <p><strong>Autopilot</strong></p>
        <p>{{ autopilot.autopilot_type }}</p>
      </div>
      <div class="detail">
        <p><strong>Version</strong></p>
        <p>{{ autopilot.version }}</p>
      </div>
      <div class="detail">
        <p><strong>Git Hash</strong></p>
        <p>{{ autopilot.git_hash }}</p>
      </div>
      <div class="detail">
        <p><strong>Voltage (V)</strong></p>
        <p>{{ formatNumber(autopilot.voltage, 2) }}</p>
      </div>
      <div class="detail">
        <p><strong>Remaining (%)</strong></p>
        <p>{{ formatNumber(autopilot.remaining, 0) }}</p>
      </div>
      <div class="detail">
        <p><strong>Current (A)</strong></p>
        <p>{{ formatNumber(autopilot.current, 2) }}</p>
      </div>
    </div>

    <div class="section-divider"></div>

    <div class="firmware-section">
      <h2>Firmware Update</h2>
      <div class="file-upload-wrapper" @dragover.prevent="dragOverHandler" @drop.prevent="dropHandler" @dragleave.prevent="dragLeaveHandler">
        <input type="file" @change="handleFileUpload" class="file-input" accept=".apj,.px4"/>
        <button class="file-select-btn">Select File</button>
        <p class="hint-text">{{ file ? `${file.name}` : 'Drag and drop or click "Select File"\n' }}</p>
        <p class="hint-text">{{ file ? `${file.name}` : '.apj or .px4' }}</p>
      </div>
      <progress v-if="isUploading" :value="progress" max="100"></progress>
      <p v-if="file || statusMessage" class="status-message">{{ statusMessage }}</p>
      <button v-if="file && !isUploading" @click="uploadFirmware" class="upload-btn" :disabled="!isConnected">Upload Firmware</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import io from 'socket.io-client';

export default {
  data() {
    return {
      autopilot: {
        autopilot_type: '--',
        version: '--',
        git_hash: '--',
        voltage: 0,
        remaining: 0,
        current: 0,
        connected: false,
        last_heartbeat: null
      },
      file: null,
      progress: 0,
      statusMessage: '',
      socket: null,
      isUploading: false,
      pollingInterval: null
    };
  },
  computed: {
    isConnected() {
      return this.autopilot.connected;
    },
    statusText() {
      return this.isConnected ? 'Connected' : 'Disconnected';
    }
  },
  mounted() {
    this.connectSocket();
    this.fetchAutopilotData();
    this.startPolling();
  },
  beforeUnmount() {
    this.stopPolling();
    if (this.socket) {
      this.socket.disconnect();
    }
  },
  methods: {
    connectSocket() {
      // Connect to the firmware update socket
      this.socket = io(process.env.VUE_APP_SOCKET_URL || window.location.origin, {
        path: '/socket.io/vehicle-firmware-upload',
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log(`Connected to firmware update socket with ID: ${this.socket.id}`);
      });

      this.socket.on('progress', data => {
        this.progress = data.percent;
        this.statusMessage = `${data.status} ${data.percent.toFixed(2)}%`;
        this.isUploading = true;
      });

      this.socket.on('completed', message => {
        this.statusMessage = message.message;
        this.isUploading = false;
        // Refresh autopilot data after firmware update
        setTimeout(() => this.fetchAutopilotData(), 3000);
      });

      this.socket.on('error', error => {
        this.statusMessage = `Error: ${error.message || error}`;
        console.error('Error:', error);
        this.isUploading = false;
      });
    },
    startPolling() {
      this.pollingInterval = setInterval(() => {
        this.fetchAutopilotData();
      }, 1000); // Poll every 1 seconds
    },
    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }
    },
    fetchAutopilotData() {
      axios.get('/api/vehicle/autopilot-details')
        .then(response => {
          this.autopilot = response.data;
        })
        .catch(error => {
          console.error('Error fetching autopilot data:', error);
          this.autopilot.connected = false;
        });
    },
    handleFileUpload(event) {
      this.file = event.target.files[0];
      this.statusMessage = '';
    },
    dragOverHandler(event) {
      event.currentTarget.style.background = 'var(--ark-color-black-shadow)';
    },
    dragLeaveHandler(event) {
      event.currentTarget.style.background = 'none';
    },
    dropHandler(event) {
      this.file = event.dataTransfer.files[0];
      this.handleFileUpload({ target: { files: event.dataTransfer.files } });
    },
    async uploadFirmware() {
      if (!this.file || !this.isConnected) return;

      this.isUploading = true;
      this.progress = 0;
      this.statusMessage = 'Preparing firmware upload...';

      const formData = new FormData();
      formData.append('firmware', this.file);
      formData.append('socketId', this.socket.id);

      try {
        const response = await axios.post('/api/vehicle/firmware-upload', formData, {
          headers: {'Content-Type': 'multipart/form-data'}
        });
        this.statusMessage = response.data.message;
      } catch (error) {
        console.error('Upload failed', error.response ? error.response.data : error);
        this.statusMessage = `Upload failed: ${error.response ? error.response.data : error.message}`;
        this.isUploading = false;
      }
    },
    formatNumber(value, decimals = 0) {
      if (value === undefined || value === null || isNaN(value)) return '--';
      return Number(value).toFixed(decimals);
    }
  }
};
</script>

<style scoped>
h1, h2 {
  text-align: center;
  color: var(--ark-color-black);
  margin-bottom: 20px;
}

.autopilot-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.status-indicator {
  padding: 6px 12px;
  border-radius: 16px;
  margin-bottom: 20px;
  font-weight: bold;
}

.connected {
  background-color: var(--ark-color-green);
  color: white;
}

.disconnected {
  background-color: var(--ark-color-red);
  color: white;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  width: 100%;
  margin-bottom: 20px;
}

.detail {
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.detail p {
  margin: 4px 0;
  text-align: center;
}

.detail p:first-child {
  font-size: 14px;
  color: var(--ark-color-black);
}

.detail p:last-child {
  font-size: 18px;
  font-weight: 600;
}

.section-divider {
  width: 100%;
  height: 1px;
  background-color: var(--ark-color-black-shadow);
  margin: 20px 0;
}

.firmware-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.file-upload-wrapper {
  border: 2px dashed var(--ark-color-black-shadow);
  padding: 20px;
  width: 80%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.file-input {
  opacity: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  cursor: pointer;
}

.file-select-btn, .upload-btn {
  padding: 12px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: var(--ark-color-green);
  color: white;
  border: none;
  border-radius: 5px;
  margin-bottom: 10px;
  transition: background-color 0.3s ease;
}

.file-select-btn:hover, .upload-btn:hover:not([disabled]) {
  background-color: var(--ark-color-green-hover);
}

.upload-btn[disabled] {
  background-color: var(--ark-color-grey-light);
  cursor: not-allowed;
}

.hint-text, .status-message {
  font-size: 14px;
  color: var(--ark-color-black);
  margin-bottom: 10px;
  text-align: center;
}

.status-message {
  font-weight: 500;
}

progress {
  width: 80%;
  height: 20px;
  margin: 10px 0;
  background-color: var(--ark-color-grey-light);
  border-radius: 10px;
  border: 2px solid var(--ark-color-black-shadow);
  overflow: hidden;
}

progress::-webkit-progress-bar {
  background-color: transparent;
  border-radius: 10px;
}

progress::-webkit-progress-value {
  background-color: var(--ark-color-green);
  border-radius: 10px;
}

progress::-moz-progress-bar {
  background-color: var(--ark-color-green);
  border-radius: 10px;
}
</style>
