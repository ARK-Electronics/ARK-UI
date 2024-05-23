<template>
  <div class="wifi-config-container">
    <div class="wifi-config">
      <h1>WiFi Configuration</h1>
      <form @submit.prevent="submitConfig">
        <div class="section">
          <h2>AP Mode</h2>
          <div class="form-group">
            <label for="ap-ssid">SSID:</label>
            <input type="text" id="ap-ssid" v-model="apSsid" required>
          </div>
          <div class="form-group">
            <label for="ap-password">Password:</label>
            <div class="password-container">
              <input :type="apPasswordVisible ? 'text' : 'password'" id="ap-password" v-model="apPassword" required>
              <span class="toggle-password" @click="toggleVisibility('ap')">
                <i :class="apPasswordVisible ? 'fa fa-eye-slash' : 'fa fa-eye'"></i>
              </span>
            </div>
          </div>
        </div>
        <div class="section">
          <h2>Station Mode</h2>
          <div class="form-group">
            <label for="station-ssid">SSID:</label>
            <input type="text" id="station-ssid" v-model="stationSsid" required>
          </div>
          <div class="form-group">
            <label for="station-password">Password:</label>
            <div class="password-container">
              <input :type="stationPasswordVisible ? 'text' : 'password'" id="station-password" v-model="stationPassword" required>
              <span class="toggle-password" @click="toggleVisibility('station')">
                <i :class="stationPasswordVisible ? 'fa fa-eye-slash' : 'fa fa-eye'"></i>
              </span>
            </div>
          </div>
        </div>
        <div class="mode-switch">
          <label class="switch">
            <input type="checkbox" v-model="isStationMode">
            <span class="slider round"></span>
          </label>
          <span>{{ isStationMode ? 'Station' : 'Access Point' }}</span>
          <div v-if="isLoading" class="loader"></div>
          <span v-else :class="statusMessageClass">{{ statusMessage }}</span>
        </div>
        <button type="submit" class="reconfigure-button">Reconfigure</button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      apSsid: '',
      apPassword: '',
      apStatus: '',
      stationSsid: '',
      stationPassword: '',
      stationStatus: '',
      isStationMode: false,
      apPasswordVisible: false,
      stationPasswordVisible: false,
      isLoading: true, // Initially true, set to false after loading config
      statusMessage: 'Loading configuration...' // Initial message
    };
  },
  computed: {
    statusMessageClass() {
      return this.statusMessage === 'Connected' ? 'status-message' : 'status-message danger';
    }
  },
  created() {
    this.loadConfig();
  },
  methods: {
    loadConfig() {
      const config = localStorage.getItem('wifiConfig');
      if (config) {
        Object.assign(this, JSON.parse(config));
      }
      this.getConfig();
    },
    async getConfig() {
      this.isLoading = true;
      try {
        const response = await fetch('/api/get-config');
        if (response.ok) {
          const data = await response.json();
          this.apSsid = data.apSsid || '';
          this.apPassword = data.apPassword || '';
          this.apStatus = data.apStatus || '';
          this.stationSsid = data.stationSsid || '';
          this.stationPassword = data.stationPassword || '';
          this.stationStatus = data.stationStatus || '';
          this.isStationMode = data.wifiMode === 'station';
          localStorage.setItem('wifiConfig', JSON.stringify(this.$data));
          this.statusMessage = this.isStationMode ? this.stationStatus : this.apStatus;
        } else {
          throw new Error('Failed to load configuration');
        }
      } catch (error) {
        this.statusMessage = 'Disconnected';
        console.error('Error loading initial config:', error);
      } finally {
        this.isLoading = false;
      }
    },
    async submitConfig() {
      this.isLoading = true;
      const mode = this.isStationMode ? 'station' : 'ap';
      try {
        const response = await fetch('/api/configure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            apSsid: this.apSsid,
            apPassword: this.apPassword,
            stationSsid: this.stationSsid,
            stationPassword: this.stationPassword,
            mode
          })
        });
        if (response.ok) {
          await this.getConfig(); // Fetch the latest config and status after submission
          this.statusMessage = 'Connected';
        } else {
          const textResponse = await response.text();
          throw new Error(textResponse);
        }
      } catch (error) {
        this.statusMessage = 'Connection Failed';
        console.error('Error configuring WiFi:', error);
      } finally {
        this.isLoading = false;
      }
    },
    toggleVisibility(mode) {
      if (mode === 'ap') {
        this.apPasswordVisible = !this.apPasswordVisible;
      } else {
        this.stationPasswordVisible = !this.stationPasswordVisible;
      }
    }
  }
};
</script>


<style scoped>
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #000000;
  color: rgba(0, 0, 0, 0.65); /* Black at 65% saturation */
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
  overflow: hidden;
}

.wifi-config-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}

.wifi-config {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  color: #00bb31;
}

h2 {
  color: rgba(0, 0, 0, 0.65); /* Black at 65% saturation */
  margin-bottom: 10px;
  text-align: center;
}

.section {
  margin-bottom: 20px;
}

.form-group {
  display: grid;
  grid-template-columns: 1fr 2fr;
  align-items: center;
  margin-bottom: 15px;
}

label {
  font-weight: 600;
  margin-right: 10px;
}

input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-sizing: border-box;
  font-size: 14px;
  width: 100%;
}

.password-container {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: rgba(0, 0, 0, 0.65); /* Black at 65% saturation */
}

.toggle-password:hover {
  color: rgba(0, 0, 0, 0.65); /* Black at 65% saturation */
}

.mode-switch {
  display: flex;
  justify-content: left;
  align-items: center;
  margin-bottom: 20px;
  margin-left: 20px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
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
  background-color: #3498db;
  transition: 0.4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #00bb31;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.mode-switch span {
  font-weight: 600;
}

.status-message {
  margin-left: auto;
  margin-right: 40px;
  font-weight: bold;
  color: #00bb31;
}

.status-message.danger {
  color: #d9534f;
}

.loader {
  margin-left: auto;
  margin-right: 40px;
  border: 4px solid #f3f3f3; /* Light grey */
  border-top: 4px solid #3498db; /* Blue */
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 2s linear infinite;
  display: inline-block;
  vertical-align: middle;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.reconfigure-button {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  color: white;
  background-color: #00bb31;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.reconfigure-button:hover {
  background-color: #369f77;
}
</style>
