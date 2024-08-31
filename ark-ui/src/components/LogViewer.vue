<template>
  <div class="log-viewer-backdrop">
    <div class="log-viewer-container">
      <h2>Logs for {{ serviceName }}</h2>
      <pre class="log-content">
        {{ logs }}
      </pre>
      <div class="actions">
        <button @click="closeViewer" class="close-button">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['serviceName', 'logs'],
  methods: {
    closeViewer() {
      this.$emit('close-viewer');
    }
  }
}
</script>

<style scoped>
.log-viewer-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.log-viewer-container {
  background-color: rgba(255, 255, 255, 1);
  padding: 30px;
  border-radius: 12px;
  width: 600px;
  max-width: 90%;
  max-height: 80vh;
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.4);
  overflow-y: auto;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: rgba(0, 0, 0, 0.65);
}

.log-content {
  background-color: rgba(245, 245, 245, 1);
  padding: 20px;
  border-radius: 6px;
  border: 2px solid rgba(211, 211, 211, 1); /* Light grey border */
  max-height: 60vh;
  overflow-y: auto;
  white-space: pre-wrap; /* Ensures that the text maintains line breaks */
  font-family: monospace; /* Uses a monospaced font for log output */
  color: rgba(0, 0, 0, 0.8);
}

.actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.close-button {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  background-color: rgba(244, 67, 54, 1); /* Red for close */
  color: rgba(255, 255, 255, 1);
  transition: background-color 0.3s ease;
}

.close-button:hover {
  background-color: rgba(244, 67, 54, 0.8); /* Slightly darker red on hover */
}
</style>
