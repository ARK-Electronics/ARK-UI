const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/network': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true // Enable WebSocket proxying
      },
      '/socket.io': {
        target: 'http://localhost:3000', // Route all Socket.IO traffic to the 3000 server for now
        changeOrigin: true,
        ws: true // Enable WebSocket proxying for Socket.IO
      }
    }
  }
});
