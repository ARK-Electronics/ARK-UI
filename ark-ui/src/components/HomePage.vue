<template>
  <div class="autopilot-container">
    <h1>System Overview</h1>
    <div class="autopilot-details">
      <div class="detail">
        <p><strong>{{ "Autopilot" }}</strong></p>
        <p>{{ autopilot.type }}</p>
      </div>
      <div class="detail">
        <p><strong>{{ "Version" }}</strong></p>
        <p>{{ autopilot.version }}</p>
      </div>
      <div class="detail">
        <p><strong>{{ "Git Hash" }}</strong></p>
        <p>{{ autopilot.gitHash }}</p>
      </div>
    </div>
    <div class="detail">
      <p><strong>Network:</strong> {{ connectionDetails.ssid }}</p>
    </div>
    <h2>Services</h2>
    <div class="services-grid">
      <div v-for="service in services" :key="service.name" class="service-box" :class="{'active-glow': service.active, 'inactive-glow': !service.active}">
        <p class="service-name"><strong>{{ service.name }}</strong></p>
          <div class="status-row">
            <span class="status-indicator" :class="{'background-green': service.enabled, 'background-red': !service.enabled}"></span>
            <p class="status-label">Enabled</p>
          </div>
          <div class="status-row">
            <span class="status-indicator" :class="{'background-green': service.active, 'background-red': !service.active}"></span>
            <p class="status-label">Active</p>
          </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      autopilot: {
        type: 'PX4',
        version: '1.15.0',
        gitHash: '58f7c3e9c'
      },
      services: [
        { name: 'mavlink-router', enabled: true, active: true },
        { name: 'dds-agent', enabled: true, active: false },
        { name: 'logloader', enabled: false, active: true },
        { name: 'polaris', enabled: true, active: false },
        { name: 'ark-ui-backend', enabled: true, active: false },
      ],
      connectionDetails: {
        ssid: ''
      }
    };
  },
  methods: {
    fetchConnectionDetails() {
      this.isLoadingConnectionDetails = true;
      axios.get('/api/get-active-connection')
        .then(response => {
          this.connectionDetails.ssid = response.data.ssid;
          this.isLoadingConnectionDetails = false;
        })
        .catch(error => {
          console.error('Error fetching connection details:', error);
          this.isLoadingConnectionDetails = false;
        });
    }
  },
  mounted() {
    this.fetchConnectionDetails();
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

.autopilot-details {
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-bottom: 20px;
}

.detail {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.detail p {
  margin-top: 0;
  margin-bottom: 1px; /* Sets 1px spacing between <p> elements within a detail */
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
  justify-content: space-around;
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
  box-shadow: 0px 0px 10px var(--ark-color-green);
}

.inactive-glow {
  box-shadow: 0px 0px 10px var(--ark-color-red);
}
</style>
