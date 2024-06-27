<template>
  <div class="home-container">
    <div class="grid-container">
      <div class="grid-item">Airframe</div>
      <div class="grid-item">Sensors</div>
      <div class="grid-item">Radio</div>
      <div class="grid-item">Flight Modes</div>
      <div class="grid-item">Power</div>
      <div class="grid-item">Safety</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomePage'
};
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  height: 100vh;
  padding-top: 5vh; /* Adjust padding to your preference */
  text-align: center;
}

.logo {
  width: 30%; /* Adjust based on your preference */
  max-width: 300px; /* Maximum size of the logo */
  margin-bottom: 20px; /* Space between logo and grid */
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 20px; /* Adjust gap between boxes */
  width: 90%; /* Adjust width to your preference */
  max-width: 1200px; /* Maximum width of the grid */
}

.grid-item {
  background-color: #2a2a2a; /* Adjust background color to match your theme */
  color: white; /* Text color */
  padding: 20px; /* Padding inside the boxes */
  border-radius: 10px; /* Rounded corners */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Box shadow for a slight 3D effect */
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
</style>
