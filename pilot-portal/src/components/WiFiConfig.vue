<template>
  <div class="wifi-config">
    <h1>WiFi Configuration</h1>
    <form @submit.prevent="submitConfig">
      <h2>AP Mode</h2>
      <label for="ap-ssid">SSID:</label>
      <input type="text" id="ap-ssid" v-model="apSsid" required>
      <label for="ap-password">Password:</label>
      <div class="password-container">
        <input :type="apPasswordVisible ? 'text' : 'password'" id="ap-password" v-model="apPassword" required>
        <span class="toggle-password" @click="apPasswordVisible = !apPasswordVisible">
          <i :class="apPasswordVisible ? 'fa fa-eye-slash' : 'fa fa-eye'"></i>
        </span>
      </div>
      <h2>Station Mode</h2>
      <label for="station-ssid">SSID:</label>
      <input type="text" id="station-ssid" v-model="stationSsid" required>
      <label for="station-password">Password:</label>
      <div class="password-container">
        <input :type="stationPasswordVisible ? 'text' : 'password'" id="station-password" v-model="stationPassword" required>
        <span class="toggle-password" @click="stationPasswordVisible = !stationPasswordVisible">
          <i :class="stationPasswordVisible ? 'fa fa-eye-slash' : 'fa fa-eye'"></i>
        </span>
      </div>
      <div class="toggle-switch">
        <label class="switch">
          <input type="checkbox" v-model="isStationMode">
          <span class="slider"></span>
        </label>
        <span>{{ isStationMode ? 'Station Mode' : 'Access Point Mode' }}</span>
      </div>
      <button type="submit">Reconfigure</button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      apSsid: 'test',
      apPassword: 'test',
      stationSsid: 'test',
      stationPassword: 'test',
      isStationMode: false,
      apPasswordVisible: false,
      stationPasswordVisible: false
    };
  },
  async created() {
    try {
      const response = await fetch('/api/get-config');
      const data = await response.json();
      this.apSsid = data.apSsid || 'test';
      this.apPassword = data.apPassword || 'test';
      this.stationSsid = data.stationSsid || 'test';
      this.stationPassword = data.stationPassword || 'test';
    } catch (error) {
      console.error('Error loading initial config:', error);
    }
  },
  methods: {
    async submitConfig() {
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
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        alert('Settings saved successfully');
      } catch (error) {
        alert('Error saving settings: ' + error.message);
      }
    }
  }
};
</script>

<style scoped>
.wifi-config {
  max-width: 600px;
  margin: auto;
  padding: 1em;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
form {
  margin-bottom: 2em;
}
label {
  display: block;
  margin-bottom: 0.5em;
}
input {
  width: 100%;
  padding: 0.5em;
  margin-bottom: 1em;
}
.password-container {
  position: relative;
}
.toggle-password {
  position: absolute;
  right: 10px;
  top: 10px;
  cursor: pointer;
}
button {
  padding: 0.5em 1em;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: #369f77;
}
.toggle-switch {
  display: flex;
  align-items: center;
  margin-bottom: 2em;
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
  background-color: #ccc;
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
  background-color: #42b983;
}
input:checked + .slider:before {
  transform: translateX(26px);
}
</style>
