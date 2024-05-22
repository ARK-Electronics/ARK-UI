<template>
  <div class="wifi-config">
    <h1>WiFi Configuration</h1>
    <form @submit.prevent="submitAPConfig">
      <h2>AP Mode</h2>
      <label for="ap-ssid">SSID:</label>
      <input type="text" id="ap-ssid" v-model="apSsid" required>
      <label for="ap-password">Password:</label>
      <input type="password" id="ap-password" v-model="apPassword" required>
      <button type="submit">Save AP Settings</button>
    </form>
    <form @submit.prevent="submitStationConfig">
      <h2>Station Mode</h2>
      <label for="station-ssid">SSID:</label>
      <input type="text" id="station-ssid" v-model="stationSsid" required>
      <label for="station-password">Password:</label>
      <input type="password" id="station-password" v-model="stationPassword" required>
      <button type="submit">Save Station Settings</button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      apSsid: '',
      apPassword: '',
      stationSsid: '',
      stationPassword: ''
    };
  },
  methods: {
    async submitAPConfig() {
      await fetch('/api/configure-ap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ssid: this.apSsid,
          password: this.apPassword
        })
      });
    },
    async submitStationConfig() {
      await fetch('/api/configure-station', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ssid: this.stationSsid,
          password: this.stationPassword
        })
      });
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
</style>
