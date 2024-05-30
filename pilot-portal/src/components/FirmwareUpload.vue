<template>
  <div class="upload-container">
    <h1>Firmware Upload</h1>
    <input type="file" @change="handleFileUpload" />
    <progress v-if="file" :value="progress" max="100"></progress>
    <p v-if="file">{{ statusMessage }}</p>
    <button v-if="file" @click="uploadFirmware">Upload Firmware</button>
  </div>
</template>

<script>
import axios from 'axios';
import io from 'socket.io-client';

export default {
  name: 'FirmwareUpload',
  data() {
    return {
      file: null,
      progress: 0,
      statusMessage: '',
      socket: null
    };
  },
  mounted() {
    this.socket = io('http://localhost:3000'); // Ensure this matches your server
    this.socket.on('connect', () => {
      console.log(`Connected with Socket ID: ${this.socket.id}`); // Log the socket ID
    });
    this.socket.on('progress', (data) => {
      this.progress = data.percent;
      this.statusMessage = `${data.status} ${data.percent.toFixed(2)}%`;
    });
    this.socket.on('completed', (message) => {
      this.statusMessage = message.message;
    });
    this.socket.on('error', (error) => {
      this.statusMessage = `Error: ${error.message}`;
      console.error('Error:', error);
    });
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  },
  methods: {
    handleFileUpload(event) {
      this.file = event.target.files[0];
    },
    async uploadFirmware() {
      if (!this.file) return;
      const formData = new FormData();
      formData.append('firmware', this.file);
      formData.append('socketId', this.socket.id); // Append the socket ID to FormData
      try {
        const response = await axios.post('/api/firmware-upload', formData, {
          headers: {'Content-Type': 'multipart/form-data'}
        });
        console.log('result:', response.data);
        this.statusMessage = response.data.message
      } catch (error) {
        console.error('Upload failed', error.response.data);
        this.statusMessage = `Upload failed: ${error.response.data}`;
      }
    },
  }
};
</script>

<style scoped>
h1 {
  text-align: center;
  color: var(--ark-color-black);
}

.upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}
input[type="file"] {
  margin: 10px 0;
}
button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  color: var(--ark-color-black-bold);
}
progress {
  width: 100%;
  height: 20px;
  margin: 10px 0;
}
</style>
