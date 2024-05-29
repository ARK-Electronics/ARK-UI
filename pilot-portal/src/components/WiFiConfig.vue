<template>
  <div class="wifi-config-container">
    <div class="wifi-config">
      <h1>WiFi Setup</h1>
      <h2>{{ toggleStateStation ? 'Station' : 'Access Point' }}</h2>
      <form @submit.prevent="createConnection">
        <div class="form-group">
          <label for="ssid">SSID:</label>
          <!-- Bind SSID to the currently relevant connection -->
          <input type="text" id="ssid" v-model="selectedConnection.ssid" required>
        </div>
        <div class="form-group">
          <label for="password">Password:</label>
          <div class="password-container">
            <input :type="passwordVisible ? 'text' : 'password'" id="password" v-model="selectedConnection.password" required>
            <span class="toggle-password" @click="togglePasswordVisibility">
              <i :class="passwordVisible ? 'fa fa-eye-slash' : 'fa fa-eye'"></i>
            </span>
          </div>
        </div>
        <div class="mode-switch">
          <label class="switch">
            <input type="checkbox" v-model="toggleStateStation" @change="toggleMode">
            <span class="slider round"></span>
          </label>
          <div v-if="isLoading" class="loader"></div>
          <span v-else :class="statusMessageClass">{{ statusMessage }}</span>
        </div>
        <button type="submit" class="reconfigure-button">Apply</button>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      activeConnection: {
        ssid: '',
        password: '',
        mode: ''
      },
      apConnection: {
        ssid: '',
        password: '',
      },
      stationConnection: {
        ssid: '',
        password: ''
      },
      selectedConnection: {
        ssid: '',
        password: ''
      },
      toggleStateStation: false,
      passwordVisible: false,
      isLoading: false,
      statusMessage: 'Unknown',
    };
  },
  computed: {
    statusMessageClass() {
      return this.statusMessage === 'Connected' ? 'status-message' : 'status-message danger';
    }
  },
  async mounted() {
    await this.fetchActiveConnection();
    if (this.activeConnection.mode !== 'ap') {
      this.fetchAPConnectionDetails();
    }
  },
  methods: {
    toggleMode() {
      if (this.toggleStateStation) {
        this.selectedConnection = { ...this.stationConnection };
      } else {
        this.selectedConnection = { ...this.apConnection };
      }

      if (this.selectedConnection.ssid === this.activeConnection.ssid) {
        this.statusMessage = 'Connected';
      } else {
        this.statusMessage = 'Disconnected';
      }
    },
    togglePasswordVisibility() {
      this.passwordVisible = !this.passwordVisible;
    },
    async fetchActiveConnection() {
      this.isLoading = true;
      try {
        const response = await axios.get('/api/get-active-connection');
        this.activeConnection = {
          ssid: response.data.ssid,
          password: response.data.password,
          mode: response.data.mode
        };
        // Update selected connection based on fetched mode
        this.selectedConnection = { ...this.activeConnection };
        this.statusMessage = 'Connected';
        this.toggleStateStation = this.activeConnection.mode === 'infrastructure';
        if (this.activeConnection.mode === 'infrastructure') {
          this.stationConnection = { ...this.activeConnection };
        } else if (this.activeConnection.mode === 'ap') {
          this.apConnection = { ...this.activeConnection };
        }
        this.isLoading = false;
      } catch (error) {
        console.error('Failed to fetch active connection:', error);
        this.isLoading = false;
      }
    },
    async fetchAPConnectionDetails() {
      this.isLoading = true;
      try {
        console.log("fetching AP details");
        const response = await axios.get('/api/get-ap-connection');
        this.apConnection = {
          ssid: response.data.ssid,
          password: response.data.password
        };
        this.isLoading = false;
      } catch (error) {
        console.error('Failed to fetch AP connection details:', error);
        this.isLoading = false;
      }
    },
    async createConnection() {
      this.isLoading = true;
      const mode = this.toggleStateStation ? 'infrastructure' : 'ap';
      const payload = {
        ssid: this.selectedConnection.ssid,
        password: this.selectedConnection.password,
        mode: mode
      };
      try {
        const response = await axios.post('/api/create-connection', payload);
        console.log('Connection response:', response.data);
        this.fetchActiveConnection(); // Refresh data after setting
        this.isLoading = false;
      } catch (error) {
        console.error('Failed to create connection:', error);
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
/* Include all the provided CSS here */
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
  top: 9px;
  cursor: pointer;
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
