<template>
  <div class="editor-backdrop">
    <div class="editor-container">
      <h1>{{ serviceName }}</h1>

      <div class="toml-editor">
        <!-- Top-level primitive values first -->
        <div v-for="(value, key) in topLevelPrimitives" :key="key" class="form-group">
          <label :for="key">{{ formatKey(key) }}</label>

          <!-- String input -->
          <input
            v-if="typeof value === 'string'"
            type="text"
            :id="key"
            v-model="config[key]"
            class="text-input"
          />

          <!-- Boolean input -->
          <div v-else-if="typeof value === 'boolean'" class="checkbox-group">
            <input
              type="checkbox"
              :id="key"
              v-model="config[key]"
              class="checkbox-input"
            />
          </div>

          <!-- Number input -->
          <input
            v-else-if="typeof value === 'number'"
            type="number"
            :id="key"
            v-model.number="config[key]"
            class="number-input"
            step="any"
          />
        </div>

        <!-- Then display each sub-table with a section header -->
        <div v-for="(tableValue, tableKey) in subTables" :key="tableKey" class="subtable-section">
          <div class="subtable-header">
            {{ formatKey(tableKey) }}
          </div>

          <div class="subtable-content">
            <div v-for="(subValue, subKey) in tableValue" :key="`${tableKey}.${subKey}`" class="form-group">
              <label :for="`${tableKey}.${subKey}`">{{ formatKey(subKey) }}</label>

              <!-- String input -->
              <input
                v-if="typeof subValue === 'string'"
                type="text"
                :id="`${tableKey}.${subKey}`"
                v-model="config[tableKey][subKey]"
                class="text-input"
              />

              <!-- Boolean input -->
              <div v-else-if="typeof subValue === 'boolean'" class="checkbox-group">
                <input
                  type="checkbox"
                  :id="`${tableKey}.${subKey}`"
                  v-model="config[tableKey][subKey]"
                  class="checkbox-input"
                />
              </div>

              <!-- Number input -->
              <input
                v-else-if="typeof subValue === 'number'"
                type="number"
                :id="`${tableKey}.${subKey}`"
                v-model.number="config[tableKey][subKey]"
                class="number-input"
                step="any"
              />
            </div>
          </div>
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
  name: 'TomlEditor',
  props: {
    serviceName: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      config: {},
      originalConfig: null
    };
  },
  computed: {
    // Separate top-level primitives from sub-tables
    topLevelPrimitives() {
      const primitives = {};
      Object.entries(this.config).forEach(([key, value]) => {
        if (!this.isObject(value)) {
          primitives[key] = value;
        }
      });
      return primitives;
    },
    // Get all sub-tables (nested objects)
    subTables() {
      const tables = {};
      Object.entries(this.config).forEach(([key, value]) => {
        if (this.isObject(value)) {
          tables[key] = value;
        }
      });
      return tables;
    }
  },
  mounted() {
    this.loadConfig();
  },
  methods: {
    isObject(value) {
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    },

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
              // Store original config for comparison or reset
              this.originalConfig = JSON.parse(JSON.stringify(this.config));
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
      try {
        const tomlString = toml.dump(this.config);

        axios
          .post(`/api/service/config?serviceName=${this.serviceName}`, {
            config: tomlString
          })
          .then((response) => {
            if (response.data.status === 'success') {
              this.$emit('close-editor');
              this.$emit('config-saved');
            } else {
              console.error('Error saving config:', response.data.data);
              alert('Error saving configuration');
            }
          })
          .catch((error) => {
            console.error('Error saving config:', error);
            alert('Error saving configuration');
          });
      } catch (error) {
        console.error('Error converting to TOML:', error);
        alert('Error preparing configuration for saving');
      }
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
  width: 600px;
  max-width: 90%;
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.4);
  overflow-y: auto;
  max-height: 90vh;
}

h1 {
  text-align: center;
  color: var(--ark-color-black);
  margin-bottom: 25px;
}

.toml-editor {
  margin-bottom: 20px;
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

.text-input,
.number-input {
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
  border: 2px solid var(--ark-color-black-shadow);
  border-radius: 6px;
  font-size: 16px;
  color: var(--ark-color-black);
}

.number-input {
  font-family: monospace;
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

.subtable-section {
  margin-top: 30px;
  margin-bottom: 25px;
}

.subtable-header {
  background-color: var(--ark-color-black-shadow);
  padding: 12px 15px;
  border-radius: 6px;
  font-weight: 600;
  color: var(--ark-color-black);
  margin-bottom: 15px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 14px;
}

.subtable-content {
  padding: 0 10px;
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
