<template>
  <div class="editor-backdrop">
    <div class="editor-container">
      <h2>Edit Configuration for {{ serviceName }}</h2>

      <div v-for="(value, key) in config" :key="key" class="form-group">
        <label :for="key">{{ key }}</label>

        <input v-if="typeof value === 'string'" type="text" :id="key" v-model="config[key]" />

        <input v-if="typeof value === 'boolean'" type="checkbox" :id="key" v-model="config[key]" />
      </div>

      <div class="actions">
        <button @click="saveConfig">Save</button>
        <button @click="cancelEdit">Cancel</button>
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
        axios.get(`/api/service/config?serviceName=${this.serviceName}`)
            .then(response => {
                // Directly access the status and data properties
                const status = response.data.status;
                const tomlData = response.data.data;

                console.log('API Data:', response.data);
                console.log('Status:', status);
                console.log('TOML Data:', tomlData);

                if (status === 'success') {
                    try {
                        // Trim and parse the TOML data
                        this.config = toml.parse(tomlData.trim());
                        console.log('Config loaded:', this.config);
                    } catch (error) {
                        console.error('Error parsing TOML:', error);
                    }
                } else {
                    console.error('Failed to load config: Status is not success', tomlData);
                }
            })
            .catch(error => {
                console.error('Error fetching config from API:', error);
            });
    },
    saveConfig() {
      const tomlString = toml.dump(this.config);

      axios.post(`/api/service/config?serviceName=${this.serviceName}`, { config: tomlString })
        .then(response => {
          if (response.data.status === 'success') {
            this.$emit('close-editor');
          } else {
            console.error('Error saving config:', response.data.data);
            alert('Error saving configuration');
          }
        })
        .catch(error => {
          console.error('Error saving config:', error);
          alert('Error saving configuration');
        });
    },
    cancelEdit() {
      this.$emit('close-editor');
    }
  }
}
</script>

<style scoped>
.editor-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.editor-container {
  background-color: var(--ark-color-white);
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.3);
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: var(--ark-color-black);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: var(--ark-color-black);
}

.form-group input[type="text"] {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid var(--ark-color-grey);
  border-radius: 4px;
}

.form-group input[type="checkbox"] {
  transform: scale(1.5);
  margin-right: 10px;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: var(--ark-color-black);
  color: var(--ark-color-white);
  transition: background-color 0.3s ease;
}

.actions button:hover {
  background-color: var(--ark-color-grey);
}
</style>
