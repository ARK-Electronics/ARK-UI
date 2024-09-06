<template>
  <div class="autopilot-container">
    <h1>Overview</h1>
    <div class="details-grid">
      <div class="detail">
        <p><strong>Autopilot</strong></p>
        <p>{{ autopilot.type }}</p>
      </div>
      <div class="detail">
        <p><strong>Version</strong></p>
        <p>{{ autopilot.version }}</p>
      </div>
      <div class="detail">
        <p><strong>Git Hash</strong></p>
        <p>{{ autopilot.gitHash }}</p>
      </div>
      <div class="detail">
        <p><strong>Network</strong></p>
        <p>{{ connectionDetails.ssid }}</p>
      </div>
      <div class="detail">
        <p><strong>IP Address</strong></p>
        <p>{{ connectionDetails.ipAddress }}</p>
      </div>
      <div class="detail">
        <p><strong>Hostname</strong></p>
        <p>{{ connectionDetails.hostname }}</p>
      </div>
      <div class="detail">
        <p><strong>Voltage (V)</strong></p>
        <p>{{ autopilot.voltage }}</p>
      </div>
      <div class="detail">
        <p><strong>Remaining (%)</strong></p>
        <p>{{ autopilot.remaining }}</p>
      </div>
      <div class="detail">
        <p><strong>Current (A)</strong></p>
        <p>{{ autopilot.current }}</p>
      </div>
    </div>
    <h2>Services</h2>
    <div class="services-grid">
      <div v-for="service in services.filter(service => service.visible === 'true')"
           :key="service.name"
           class="service-box"
           :class="{'active-glow': service.active === 'active', 'inactive-glow': service.active !== 'active'}">
        <p class="service-name"><strong>{{ service.name }}</strong></p>
        <div class="service-actions">
          <button v-if="service.active === 'active'" @click="stopService(service.name)" title="Stop service">
            <i class="fas fa-stop"></i>
          </button>
          <button v-else @click="startService(service.name)" title="Start service">
            <i class="fas fa-play"></i>
          </button>
          <button @click="openLogViewer(service.name)" title="View journal logs">
            <i class="fas fa-book"></i>
          </button>
          <button v-if="service.config_file !== ''" @click="openConfigEditor(service.name)" title="Edit config file">
            <i class="fas fa-pencil-alt"></i>
          </button>
          <div v-else class="placeholder"></div>
        </div>
        <div class="status-row">
          <label class="switch">
            <input type="checkbox" :checked="service.enabled === 'enabled'" @change="toggleService(service)">
            <span class="slider round"></span>
          </label>
          <p class="status-label">{{ 'Autostart' }}</p>
        </div>
      </div>
    </div>

    <!-- Config Editor Modal -->
    <ConfigEditor
      v-if="showConfigEditor"
      :serviceName="selectedService"
      @close-editor="closeConfigEditor"
    />

    <!-- Log Viewer Modal -->
    <LogViewer
      v-if="showLogViewer"
      :serviceName="selectedService"
      :logs="logs"
      @close-viewer="closeLogViewer"
    />
  </div>
</template>

<script>
import axios from 'axios';
import ConfigEditor from './ConfigEditor.vue';
import LogViewer from './LogViewer.vue';

export default {
  components: {
    ConfigEditor,
    LogViewer
  },
  data() {
    return {
      autopilot: {
        type: '--',
        version: '--',
        gitHash: '--',
        voltage: '--',
        remaining: '--',
        current: '--'
      },
      services: [],
      connectionDetails: {
        ssid: '',
        ipAddress: '',
        hostname: ''
      },
      selectedService: null,
      logs: '',
      showConfigEditor: false,
      showLogViewer: false,
    };
  },
  mounted() {
    this.fetchConnectionDetails();
    this.fetchAutopilotData();
    this.fetchServiceStatuses();
  },
  methods: {
    fetchConnectionDetails() {
      axios.get('/api/network/active-connection')
        .then(response => {
          this.connectionDetails.ssid = response.data.ssid;
          this.connectionDetails.ipAddress = response.data.ip_address;
          this.connectionDetails.hostname = response.data.hostname;
        })
        .catch(error => {
          console.error('Error fetching connection details:', error);
        });
    },
    fetchAutopilotData() {
      axios.get('/api/vehicle/autopilot-data')
        .then(response => {
          this.autopilot.gitHash = response.data.git_hash;
          this.autopilot.version = response.data.version;
          this.autopilot.type = response.data.autopilot_type;
          this.autopilot.voltage = parseFloat(response.data.voltage).toFixed(2);
          this.autopilot.remaining = parseFloat(response.data.remaining).toFixed(0);
          this.autopilot.current = parseFloat(response.data.current).toFixed(2);
        })
        .catch(error => {
          console.error('Error fetching PX4 data:', error);
        });
    },
    fetchServiceStatuses() {
      axios.get('/api/service/statuses')
        .then(response => {
          this.services = response.data.services;
        })
        .catch(error => {
          console.error('Error fetching service statuses:', error);
        });
    },
    toggleService(service) {
      const newStatus = service.enabled === 'enabled' ? 'disable' : 'enable';
      axios.post(`/api/service/${newStatus}?serviceName=${service.name}`)
        .then(response => {
          if (response.status === 200) {
            console.log(`Service ${service.name} ${newStatus}d successfully`);
            service.enabled = newStatus === 'enable' ? 'enabled' : 'disabled';
          } else {
            console.error(`Failed to ${newStatus} service ${service.name}`);
            alert(`Failed to ${newStatus} service ${service.name}`);
          }
        })
        .catch(error => {
          console.error(`Error ${newStatus} service:`, error);
          alert(`Error ${newStatus} service`);
          // Revert the toggle if there was an error
          service.enabled = service.enabled === 'enabled' ? 'disabled' : 'enabled';
        });
    },
    startService(serviceName) {
      axios.post(`/api/service/start?serviceName=${serviceName}`)
        .then(response => {
          if (response.status === 200) {
            console.log(`Service ${serviceName} started successfully`);
            this.fetchServiceStatuses();
          } else {
            console.error(`Failed to start service ${serviceName}`);
          }
        })
        .catch(error => {
          console.error('Error starting service:', error);
        });
    },
    stopService(serviceName) {
      axios.post(`/api/service/stop?serviceName=${serviceName}`)
        .then(response => {
          if (response.status === 200) {
            console.log(`Service ${serviceName} stopped successfully`);
            this.fetchServiceStatuses();
          } else {
            console.error(`Failed to stop service ${serviceName}`);
          }
        })
        .catch(error => {
          console.error('Error stopping service:', error);
        });
    },
    openConfigEditor(serviceName) {
      this.selectedService = serviceName;
      this.showConfigEditor = true;
    },
    closeConfigEditor() {
      this.showConfigEditor = false;
      this.selectedService = null;
    },
    openLogViewer(serviceName) {
      console.log(`Opening log viewer for ${serviceName}`);
      axios.get(`/api/service/logs?serviceName=${serviceName}`)
        .then(response => {
          if (response.data.status === 'success') {
            this.logs = response.data.logs;
            this.selectedService = serviceName;
            this.showLogViewer = true;
          } else {
            console.error('Error fetching logs:', response.data.message);
          }
        })
        .catch(error => {
          console.error('Error fetching logs:', error);
        });
    },
    closeLogViewer() {
      this.showLogViewer = false;
      this.selectedService = null;
    }
  }
}
</script>

<style scoped>
h1, h2 {
  text-align: center;
  color: var(--ark-color-black);
}

.autopilot-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  width: 100%;
  margin-bottom: 20px;
}

.detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.detail p {
  margin-top: 0;
  margin-bottom: 1px;
}

.label, p {
  font-size: 16px;
  color: var(--ark-color-black);
  margin: 0;
}

.status-label {
  font-size: 15px;
  color: var(--ark-color-black);
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 10px;
  width: 100%;
}

.service-box {
  border: 2px solid var(--ark-color-black-shadow);
  padding: 10px;
  background-color: var(--ark-color-white);
  border-radius: 8px;
  box-shadow: 0px 0px 10px rgba(0,0,0,0.1);
  transition: box-shadow 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.service-name {
  font-size: 18px;
  color: var(--ark-color-black);
  text-align: center;
}

.status-row {
  display: flex;
  align-items: center;
  margin: 2px;
}

.status-indicator {
  height: 10px;
  width: 10px;
  border-radius: 50%;
  margin-right: 15px;
}

.background-green {
  background-color: var(--ark-color-green);
}

.background-red {
  background-color: var(--ark-color-red);
}

.active-glow {
  box-shadow: 0px 0px 8px var(--ark-color-green);
}

.inactive-glow {
  box-shadow: 0px 0px 8px var(--ark-color-red);
}

.service-actions {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
}

.service-actions button {
  font-size: 15px;
  border: none;
  margin: 5px;
  border-radius: 4px;
  background-color: var(--ark-color-white);
  color: var(--ark-color-black);
  cursor: pointer;
  transition: transform 0.3s ease;
}

.service-actions button:hover {
  transform: scale(1.3);
}

.placeholder {
  width: 30px; /* Adjust this width to match the size of your buttons */
  height: 30px; /* Adjust this height to match the size of your buttons */
}

/* Slider */
.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
  margin-right: 10px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--ark-color-red);
  transition: 0.4s;
  border-radius: 20px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  border-radius: 50%;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.4s;
}

input:checked + .slider {
  background-color: var(--ark-color-green);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

</style>
