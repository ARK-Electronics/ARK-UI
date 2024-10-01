<template>
  <div class="editor-backdrop">
    <div class="editor-container">
      <h1>{{ serviceName }}</h1>

      <div v-for="(value, key) in config" :key="key" class="form-group">
        <label :for="key">{{ formatKey(key) }}</label>

        <input
          v-if="typeof value === 'string'"
          type="text"
          :id="key"
          v-model="config[key]"
          class="text-input"
        />

        <div v-if="typeof value === 'boolean'" class="checkbox-group">
          <input
            type="checkbox"
            :id="key"
            v-model="config[key]"
            class="checkbox-input"
          />
        </div>
      </div>

      <div class="actions">
        <button @click="saveConfig" class="save-button">Save</button>
        <button @click="cancelEdit" class="cancel-button">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import toml from 'toml-js';

export default {
  props: ['serviceName'],
  data() {
    return {
      config: {}
    };
  },
  mounted() {
    this.loadConfig();
  },
  methods: {
    loadConfig() {
      console.log(`Loading config for service: ${this.serviceName}`);
      axios
        .get(`/api/service/config?serviceName=${this.serviceName}`)
        .then((response) => {
          const status = response.data.status;
          const configData = response.data.data;

          if (status === 'success') {
            try {
              this.config = toml.parse(configData.trim());
            } catch (error) {
              console.error('Error parsing TOML:', error);
            }
          } else {
            console.error('Failed to load config:', configData);
          }
        })
        .catch((error) => {
          console.error('Error fetching config from API:', error);
        });
    },
    saveConfig() {
      const tomlString = toml.dump(this.config);

      axios
        .post(`/api/service/config?serviceName=${this.serviceName}`, {
          config: tomlString
        })
        .then((response) => {
          if (response.data.status === 'success') {
            this.$emit('close-editor');
          } else {
            console.error('Error saving config:', response.data.data);
            alert('Error saving configuration');
          }
        })
        .catch((error) => {
          console.error('Error saving config:', error);
          alert('Error saving configuration');
        });
    },
    cancelEdit() {
      this.$emit('close-editor');
    },
    formatKey(key) {
      // Capitalize first letter and replace underscores with spaces
      return key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
    }
  }
};
</script>

<style scoped>
.editor-backdrop {
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

.editor-container {
  background-color: var(--ark-color-white);
  padding: 30px;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.4);
  overflow-y: auto;
  max-height: 90vh;
}

h1 {
  text-align: center;
  color: var(--ark-color-black);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--ark-color-black);
}

.text-input {
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
  border: 2px solid var(--ark-color-black-shadow);
  border-radius: 6px;
  font-size: 16px;
  color: var(--ark-color-black);
}

.checkbox-group {
  display: flex;
  align-items: center;
  margin-top: 10px;
}

.checkbox-input {
  transform: scale(1.5);
  margin-right: 10px;
}

.checkbox-label {
  font-weight: 600;
  color: var(--ark-color-black);
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.save-button,
.cancel-button {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  color: var(--ark-color-white);
  transition: background-color 0.3s ease;
}

.save-button {
  background-color: var(--ark-color-green);
}

.save-button:hover {
  background-color: var(--ark-color-green-hover);
}

.cancel-button {
  background-color: var(--ark-color-red);
}

.cancel-button:hover {
  background-color: var(--ark-color-red-hover);
}
</style>
