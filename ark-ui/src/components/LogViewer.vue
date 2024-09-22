<template>
  <div class="log-viewer-backdrop">
    <div class="log-viewer-container">
      <h2>{{ serviceName }}</h2>
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
  background-color: var(--ark-color-black);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.log-viewer-container {
  background-color: var(--ark-color-white);
  padding: 30px;
  border-radius: 12px;
  width: 600px;
  max-width: 90%;
  max-height: 80vh;
  box-shadow: 0px 0px 20px var(--ark-color-black-shadow);
  overflow-y: auto;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: var(--ark-color-black);
}

.log-content {
  background-color: var(--ark-color-black-shadow);
  padding: 20px;
  border-radius: 4px;
  border: 1px solid var(--ark-color-black-shadow);
  max-height: 60vh;
  overflow-y: auto;
  white-space: pre-wrap; /* Ensures that the text maintains line breaks */
  font-family: monospace; /* Uses a monospaced font for log output */
  color: var(--ark-color-black-bold);
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
  background-color: var(--ark-color-red);
  color: var(--ark-color-white);;
  transition: background-color 0.3s ease;
}

.close-button:hover {
  background-color: var(--ark-color-red-hover);
}
</style>
