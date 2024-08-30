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
      <div v-for="service in services" :key="service.name" class="service-box"
           :class="{'active-glow': service.active === 'active', 'inactive-glow': service.active !== 'active'}">
        <p class="service-name"><strong>{{ service.name }}</strong></p>
        <div class="status-row">
          <span class="status-indicator"
                :class="{'background-green': service.enabled === 'enabled', 'background-red': service.enabled !== 'enabled'}"></span>
          <p class="status-label">{{ service.enabled }}</p>
        </div>
        <div class="status-row">
          <span class="status-indicator"
                :class="{'background-green': service.active === 'active', 'background-red': service.active !== 'active'}"></span>
          <p class="status-label">{{ service.active }}</p>
        </div>
        <div class="service-actions">
          <button @click="restartService(service.name)">
            <i class="fas fa-sync-alt"></i>
          </button>
          <button @click="editConfig(service.name)">
            <i class="fas fa-pencil-alt"></i>
          </button>
          <button @click="viewLogs(service.name)">
            <i class="fas fa-book"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Include ConfigEditor component and pass the selected service name -->
    <ConfigEditor
      v-if="selectedService"
      :serviceName="selectedService"
      @close-editor="selectedService = null"
    />
  </div>
</template>

<script>
import axios from 'axios';
import ConfigEditor from './ConfigEditor.vue';

export default {
  components: {
    ConfigEditor
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
      selectedService: null
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
          // Format numerical data to reduce precision
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
    restartService(serviceName) {
      axios.post(`/api/services/restart/${serviceName}`)
        .then(response => {
          if (response.status === 200) {
            alert(`Service ${serviceName} restarted successfully`);
          } else {
            alert(`Failed to restart service ${serviceName}`);
          }
        })
        .catch(error => {
          console.error('Error restarting service:', error);
          alert('Error restarting service');
        });
    },
    editConfig(serviceName) {
      this.selectedService = serviceName;  // Set the selected service to trigger the editor
    },
    viewLogs(serviceName) {
      axios.get(`/api/services/logs/${serviceName}`)
        .then(response => {
          const logs = response.data;
          this.$modal.show('logsModal', { title: `${serviceName} Logs`, content: logs });
        })
        .catch(error => {
          console.error('Error fetching logs:', error);
          alert('Error fetching logs');
        });
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
  margin: 5px;
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
  padding: 5px 10px;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  background-color: var(--ark-color-white);
  color: var(--ark-color-black);
  cursor: pointer;
  transition: transform 0.3s ease;
}

.service-actions button:hover {
  transform: scale(1.3);
}
</style>
