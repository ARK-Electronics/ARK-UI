<template>
  <div id="app">
    <div class="sidebar" ref="sidebar">
      <img src="@/assets/logo.png" alt="Logo" class="logo">
      <router-link class="link" to="/">Overview</router-link>
      <router-link class="link" to="/wifi-config">Network</router-link>
      <router-link class="link" to="/firmware-upload">Firmware</router-link>
    </div>
    <div class="content" :style="{ marginLeft: sidebarWidth + 'px' }">
      <router-view/>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      sidebarWidth: 152  // Initial width; will be updated
    };
  },
  mounted() {
    this.adjustSidebarWidth();
  },
  methods: {
    adjustSidebarWidth() {
      const links = this.$refs.sidebar.querySelectorAll('.link');
      let maxWidth = 0;
      links.forEach(link => {
        maxWidth = Math.max(maxWidth, link.offsetWidth);
      });
      // Adjust for padding and any extra space you might want
      this.sidebarWidth = maxWidth + 40; // Extra 40px for padding
    }
  }
};
</script>

<style>
:root {
  --ark-color-black: rgba(0, 0, 0, 0.65);
  --ark-color-black-bold: rgba(0, 0, 0, 1);
  --ark-color-black-shadow: rgba(0, 0, 0, 0.1);
  --ark-color-white: rgba(255, 255, 255, 1);
  --ark-color-green: rgba(0, 187, 49, 1);
  --ark-color-green-hover: rgba(0, 187, 49, 0.65);
  --ark-color-green-shadow: rgba(0, 187, 49, 0.1);
  --ark-color-blue: rgba(52, 152, 219, 1);
  --ark-color-red: rgba(244, 67, 54, 1);
  --ark-color-red-hover: rgba(244, 67, 54, 0.65);
}

#app {
  display: flex;
  font-family: 'Roboto', sans-serif;
  color: var(--ark-color-black); /* Should be your black color */
  background-color: var(--ark-color-white); /* Your specified white color */
  height: 90vh;
  overflow: hidden; /* Prevent vertical scrolling */
}

.sidebar {
  position: fixed;
  height: 100vh; /* Full height */
  left: 0;
  top: 0;
  padding: 0px 20px;
  display: flex;
  flex-direction: column;
  align-items: start;
  color: var(--ark-color-black); /* Text color black */
  background-color: var(--ark-color-white); /* White background */
  box-shadow: 2px 0 10px var(--ark-color-black-shadow);
}

.link {
  padding: 10px 15px;
  margin: 8px 0;
  border-radius: 5px;
  text-decoration: none; /* No underline */
  transition: all 0.1s ease-in-out;
  white-space: nowrap; /* Prevents text wrapping */
  color: var(--ark-color-black-bold); /* Text color black */
}

.link:hover {
  transform: translateX(5px);
  color: var(--ark-color-white); /* White text on hover */
  background-color: var(--ark-color-green); /* Your green accent color */
}

.content {
  flex-grow: 1;
  padding-left: 4vh;
  height: 100vh; /* Full height */
  overflow-y: hidden; /* Enable scrolling */
  color: var(--ark-color-black-bold); /* Text color black */
  background-color: var(--ark-color-white); /* Light gray background for the content area, change to white if necessary */
}

.logo {
  width: 120px;
  height: auto;
}

</style>
