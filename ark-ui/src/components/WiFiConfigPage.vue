<template>
  <div class="page-container">
    <div class="page-section-container">
      <h1>WiFi</h1>
      <h2>{{ toggleStateStation ? 'Station' : 'Hotspot' }}</h2>
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
        <button type="submit" class="apply-button">Apply</button>
      </form>
    </div>
    <div class="page-section-container">
      <h1>Hostname</h1>
      <!-- TODO: I want a section here that displays the hostname (not editable) with a button to
      the right labelled "change" and when you click the button an edit dialogue appears where
      you can enter the new hostname and click "submit" -->
      <div class="hostname-display">
        <!-- <span>{{ activeConnection.hostname }}</span> -->
        <p>{{ activeConnection.hostname }}</p>
      </div>
      <form @submit.prevent="submitNewHostname">
        <div v-if="!showRebootDialog" class="hostname-edit-dialog">
          <input type="text" v-model="newHostname" placeholder="Enter new hostname" required>
          <button type="submit" class="apply-button" style="width: 50%;">Submit</button>
        </div>
        <div v-if="showRebootDialog" class="reboot-dialog">
          <p>Reboot required to take effect</p>
        </div>
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
        mode: '',
        hostname: ''
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
      newHostname: '',
      showRebootDialog: false,
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
      this.fetchAPConnection();
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
        console.log("fetchActiveConnection");
        const response = await axios.get('/api/get-active-connection');
        this.activeConnection = {
          ssid: response.data.ssid,
          password: response.data.password,
          mode: response.data.mode,
          hostname: response.data.hostname
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
    async fetchAPConnection() {
      this.isLoading = true;
      try {
        console.log("fetchAPConnection");
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
      } catch (error) {
        console.error('Failed to create connection:', error);
      }
    },
    async submitNewHostname() {
      console.log('submitNewHostname')
      this.showRebootDialog = true;

      try {
        const payload = { hostname: this.newHostname };
        const response = await axios.post('/api/change-hostname', payload);
        console.log('Connection response:', response.data);
        this.fetchActiveConnection(); // Refresh data after setting
      } catch (error) {
        console.error('Failed to change hostname:', error);
      }
    }
  }
};
</script>

<style scoped>
/* Include all the provided CSS here */
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: var(--ark-color-black); /* Black at 65% saturation */
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
  overflow: hidden;
}

.page-container {
  display: flex-column;
  justify-content: center;
  height: 100vh;
}

.page-section-container {
  padding: 10px;
  background-color: var(--ark-color-white);
}

h1 {
  text-align: center;
  color: var(--ark-color-black);
}

h2 {
  color: var(--ark-color-green); /* Black at 65% saturation */
  margin-bottom: 10px;
  text-align: center;
}

.form-group {
  display: grid;
  grid-template-columns: 1fr 2fr;
  align-items: center;
  margin-bottom: 15px;
}

label {
  font-weight: 600;
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
  background-color: var(--ark-color-blue);
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
  background-color: var(--ark-color-white);
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--ark-color-green);
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
  color: var(--ark-color-green);
}

.status-message.danger {
  color: #d9534f;
}

.loader {
  margin-left: auto;
  margin-right: 40px;
  border: 4px solid var(--ark-color-black-shadow);
  border-top: 4px solid var(--ark-color-blue);
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

.apply-button {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  color: var(--ark-color-white);;
  background-color:var(--ark-color-green);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.apply-button:hover {
  background-color: var(--ark-color-green-hover);
}

.hostname-display {
  background-color: var(--ark-color-black-shadow);
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 5px;
}

.hostname-display p {
  margin: 0 0 0px 0;
  text-align: center;
}

.hostname-edit-dialog button {
  padding: 5px 10px;
  margin-left: 10px;
  background-color: var(--ark-color-green);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  color: white;
}

.hostname-edit-dialog {
  display: flex;
  width: 100%;
}

.hostname-edit-dialog input {
  flex-grow: 1;
  padding: 10px;
  border: 1px solid var(--ark-color-black-shadow);
  border-radius: 5px;
}

.reboot-dialog {
  padding: 10px;
  border: 2px solid var(--ark-color-green);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 5px;
}

.reboot-dialog p {
  margin: 0 0 0px 0;
  text-align: center;
}

</style>
