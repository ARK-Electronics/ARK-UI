const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
const { spawn } = require('child_process');
const fileUpload = require('express-fileupload');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080", // Allow your client URL
    methods: ["GET", "POST"],
  }
});

app.use(express.json());
app.use(fileUpload({ limits: { fileSize: 3 * 1024 * 1024 } })); // 3MB max, MCU flash is 2MB
app.use(cors());

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
  });
});

// Helper function to handle the execution of shell scripts with progress
function executeScriptWithProgress(scriptPath, args, socket) {
  console.log(`Executing script: ${scriptPath} with args: ${args}`);  // Log execution command
  const script = spawn(scriptPath, args);

  script.stdout.on('data', (data) => {
    try {
      const progressData = JSON.parse(data.toString());
      console.log('Progress Data:', progressData);
      socket.emit('progress', progressData);
    } catch (err) {
      console.error('Error parsing progress data:', err.message);
    }
  });

  script.stderr.on('data', (data) => {
    console.error(`STDERR: ${data}`);  // Log raw stderr data
    socket.emit('error', data.toString());
  });

  script.on('close', (code) => {
    console.log(`Script closed with code: ${code}`);  // Log the exit code
    if (code === 0) {
      socket.emit('completed', { message: 'Firmware update completed successfully.' });
    } else {
      socket.emit('error', { message: `Script exited with code ${code}` });
    }
  });

  script.on('error', (err) => {
    console.error(`Failed to start subprocess: ${err}`);  // Log startup errors
    socket.emit('error', { message: `Failed to start subprocess: ${err.message}` });
  });
}
//// SERVICE :: GET :: STATUSES
app.get('/api/service/statuses', async (req, res) => {
  console.log('/api/service/statuses');
  try {
    const config = await execFile('/usr/local/bin/service_get_statuses.sh');
    res.json(JSON.parse(config.stdout));
  } catch (error) {
    res.status(500).send('Error retrieving configuration');
  }
});
//// SERVICE :: GET :: CONFIG
app.get('/api/service/config', async (req, res) => {
  const { serviceName } = req.query;
  console.log(`/api/service/config GET for ${serviceName}`);
  try {
    const { stdout } = await execFile('/usr/local/bin/service_get_config.sh', [serviceName]);
    res.json(JSON.parse(stdout));
    console.log(`data: ${stdout}`);
  } catch (error) {
    console.error(`Error retrieving configuration for ${serviceName}:`, error.message);
    res.status(500).send(`Error retrieving configuration for ${serviceName}`);
  }
});
//// SERVICE :: POST :: CONFIG
app.post('/api/service/config', async (req, res) => {
  const { serviceName } = req.query;
  const { config } = req.body;
  console.log(`/api/service/config POST for ${serviceName}`);
  try {
    const { stdout } = await execFile('/usr/local/bin/service_save_config.sh', [serviceName, config]);
    const result = JSON.parse(stdout);
    res.json(result);
  } catch (error) {
    console.error(`Error saving configuration for ${serviceName}:`, error.message);
    res.status(500).send(`Error saving configuration for ${serviceName}`);
  }
});
//// SERVICE :: POST :: RESTART
app.post('/api/service/restart', async (req, res) => {
  const { serviceName } = req.query;
  console.log(`/api/service/restart POST for ${serviceName}`);

  try {
    await execFile('/usr/local/bin/service_restart.sh', [serviceName]);
    res.send(`Service ${serviceName} restarted successfully.`);
  } catch (error) {
    console.error(`Error restarting service ${serviceName}:`, error.message);
    res.status(500).send(`Error restarting service ${serviceName}`);
  }
});
//// SERVICE :: GET :: LOGS
app.get('/api/service/logs', async (req, res) => {
  const { serviceName } = req.query;
  console.log(`/api/service/logs GET for ${serviceName}`);

  try {
    const { stdout } = await execFile('/usr/local/bin/service_get_logs.sh', [serviceName]);
    res.send(stdout);
  } catch (error) {
    console.error(`Error retrieving logs for ${serviceName}:`, error.message);
    res.status(500).send(`Error retrieving logs for ${serviceName}`);
  }
});
//// NETWORK :: GET :: ACTIVE_CONN
app.get('/api/network/active-connection', async (req, res) => {
  console.log('/api/network/active-connection');
  try {
    const config = await execFile('/usr/local/bin/get_active_connection_details.sh');
    res.json(JSON.parse(config.stdout));
  } catch (error) {
    res.status(500).send('Error retrieving configuration');
  }
});
//// NETWORK :: GET :: AP_CONN
app.get('/api/network/ap-connection', async (req, res) => {
  console.log('/api/network/ap-connection');
  try {
    const config = await execFile('/usr/local/bin/get_ap_connection_details.sh');
    res.json(JSON.parse(config.stdout));
  } catch (error) {
    res.status(500).send('Error retrieving configuration');
  }
});
//// NETWORK :: POST :: CREATE_CONN
app.post('/api/network/create-connection', async (req, res) => {
  console.log('/api/network/create-connection');
  const { ssid, password, mode } = req.body;
  const script = mode === 'ap' ? 'create_ap_connection.sh' : 'create_infra_connection.sh';

  try {
    const result = await execFile(`/usr/local/bin/${script}`, [ssid, password]);
    res.json(JSON.parse(result.stdout));
  } catch (error) {
    res.status(500).send('Connection failed');
  }
});
//// NETWORK :: POST :: HOSTNAME
app.post('/api/network/change-hostname', async (req, res) => {
  console.log('/api/network/change-hostname');
  try {
    await execFile(`/usr/local/bin/change_hostname.sh`, [req.body.hostname]);
  } catch (error) {
    res.status(500).send('Connection failed');
  }
});
//// VEHICLE :: GET :: STATUSES
app.get('/api/vehicle/autopilot-data', async (req, res) => {
  console.log('/api/vehicle/autopilot-data');
  try {
    const config = await execFile('/usr/local/bin/mavlink_autopilot_data.sh');
    res.json(JSON.parse(config.stdout));
  } catch (error) {
    res.status(500).send('Error retrieving configuration');
  }
});
//// VEHICLE :: POST :: FW_UPLOAD
app.post('/api/vehicle/firmware-upload', (req, res) => {
  console.log('/api/vehicle/firmware-upload');
  if (!req.files || !req.files.firmware) {
    return res.status(400).send('No files were uploaded.');
  }

  const firmwareFile = req.files.firmware;
  const uploadPath = `/tmp/${firmwareFile.name}`;
  const socketId = req.body.socketId;  // The client needs to send this
  const socket = io.sockets.sockets.get(socketId);

  if (!socket) {
    return res.status(404).send('Socket connection not found.');
  }

  firmwareFile.mv(uploadPath, (err) => {
    if (err) {
      console.error('File move error:', err);
      return res.status(500).send('Failed to save the file');
    }
    executeScriptWithProgress('/usr/local/bin/flash_px4.sh', [uploadPath], socket);
    res.send({ message: 'Starting...' });
  });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
