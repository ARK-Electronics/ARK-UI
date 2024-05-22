<template>
  <div id="app">
    <WiFiConfig />
  </div>
</template>

<script>
import WiFiConfig from './components/WiFiConfig.vue';

export default {
  name: 'App',
  components: {
    WiFiConfig
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
