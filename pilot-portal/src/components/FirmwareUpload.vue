<template>
  <div class="upload-container">
    <h1>Firmware Upload</h1>
    <input type="file" @change="handleFileUpload" />
    <button v-if="file" @click="uploadFirmware">Upload Firmware</button>
  </div>
</template>

<script>
export default {
  name: 'FirmwareUpload',
  data() {
    return {
      file: null,
    };
  },
  methods: {
    handleFileUpload(event) {
      this.file = event.target.files[0];
    },
    async uploadFirmware() {
      if (!this.file) return;

      const formData = new FormData();
      formData.append('firmware', this.file);

      try {
        const response = await axios.post('/api/firmware-upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log('result:', response.data);

      } catch (error) {
        console.error('Upload failed', error.response.data);
      }
    },
  },
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
  align-items: left;
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
</style>
