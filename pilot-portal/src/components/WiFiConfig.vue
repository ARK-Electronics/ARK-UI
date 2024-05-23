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
              <span class="toggle-password" @click="apPasswordVisible = !apPasswordVisible">
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
              <span class="toggle-password" @click="stationPasswordVisible = !stationPasswordVisible">
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
          <span>{{ isStationMode ? 'Station Mode' : 'Access Point Mode' }}</span>
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
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
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
  background-color: #00bb31;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.mode-switch span {
  font-weight: 600;
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
