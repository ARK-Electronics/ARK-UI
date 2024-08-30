<template>
  <div class="upload-container">
    <h1>Firmware Upload</h1>
    <div class="file-upload-wrapper" @dragover.prevent="dragOverHandler" @drop.prevent="dropHandler" @dragleave.prevent="dragLeaveHandler">
      <input type="file" @change="handleFileUpload" class="file-input"/>
      <button class="file-select-btn">Select File</button>
      <p class="hint-text">{{ file ? `${file.name}` : 'Drag and drop a file or click "Select File"' }}</p>
    </div>
    <progress v-if="isUploading" :value="progress" max="100"></progress>
    <p v-if="file">{{ statusMessage }}</p>
    <button v-if="file" @click="uploadFirmware" class="upload-btn">Upload Firmware</button>
  </div>
</template>


<script>
import axios from 'axios';
import io from 'socket.io-client';

export default {
  data() {
    return {
      file: null,
      progress: 0,
      statusMessage: '',
      socket: null,
      isUploading: false  // Track whether uploading has started
    };
  },
  mounted() {
    // this.socket = io('http://localhost:3000');
    // this.socket = io(`${window.location.protocol}//${window.location.host}/socket.io`);
    // this.socket = io(`${window.location.protocol}//${window.location.host}`);
    this.socket = io(process.env.VUE_APP_SOCKET_URL);

    this.socket.on('connect', () => console.log(`Connected with Socket ID: ${this.socket.id}`));
    this.socket.on('progress', data => {
      this.progress = data.percent;
      this.statusMessage = `${data.status} ${data.percent.toFixed(2)}%`;
      this.isUploading = true;
    });
    this.socket.on('completed', message => {
      this.statusMessage = message.message;
      this.isUploading = false;
    });
    this.socket.on('error', error => {
      this.statusMessage = `Error: ${error.message}`;
      console.error('Error:', error);
      this.isUploading = false;
    });
  },
  methods: {
    handleFileUpload(event) {
      this.file = event.target.files[0];
    },
    dragOverHandler(event) {
      event.currentTarget.style.background = 'var(--ark-color-black-shadow)';
    },
    dragLeaveHandler(event) {
      event.currentTarget.style.background = 'none';
    },
    dropHandler(event) {
      this.file = event.dataTransfer.files[0];
      this.handleFileUpload({ target: { files: event.dataTransfer.files } });
    },
    async uploadFirmware() {
      if (!this.file) return;
      this.isUploading = true;
      const formData = new FormData();
      formData.append('firmware', this.file);
      formData.append('socketId', this.socket.id);
      try {
        const response = await axios.post('/api/vehicle/firmware-upload', formData, {
          headers: {'Content-Type': 'multipart/form-data'}
        });
        this.statusMessage = response.data.message;
      } catch (error) {
        console.error('Upload failed', error.response.data);
        this.statusMessage = `Upload failed: ${error.response.data}`;
        this.isUploading = false;
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
  width: 320px;
}

.file-upload-wrapper {
  border: 2px dashed var(--ark-color-black-shadow);
  padding: 20px;
  width: 80%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.file-input {
  opacity: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  cursor: pointer;
}

.file-select-btn, .upload-btn {
  padding: 15px 25px;
  font-size: 18px;
  cursor: pointer;
  background-color: var(--ark-color-green);
  color: white;
  border: none;
  border-radius: 5px;
  margin-bottom: 10px;
  transition: background-color 0.3s ease;
}

.file-select-btn:hover, .upload-btn:hover {
  background-color: var(--ark-color-green-hover);
}

.hint-text, p {
  font-size: 14px;
  color: var(--ark-color-black);
  margin-bottom: 10px;
}

progress {
  width: 100%;
  height: 20px;
  margin: 10px 0;
  background-color: var(--ark-color-grey-light); /* Light grey background */
  border-radius: 10px;
  border: 2px solid var(--ark-color-black-shadow); /* Add a border with a subtle color */
  overflow: hidden; /* Ensures the inner bar doesn't overlap the border on the radius */
}

progress::-webkit-progress-bar {
  background-color: transparent; /* Transparent background for the track */
  border-radius: 10px;
}

progress::-webkit-progress-value {
  background-color: var(--ark-color-green); /* Main progress color */
  border-radius: 10px; /* Rounded corners for the progress value */
}

progress::-moz-progress-bar {
  background-color: var(--ark-color-green); /* Main progress color */
  border-radius: 10px;
}

</style>
