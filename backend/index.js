const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { exec, spawn } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fileUpload = require('express-fileupload');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

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
  console.log('New socket connection established:', socket.id);

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Helper function to execute a script with arguments, using shell and PATH
async function execScript(scriptName, args = []) {
  try {
    // Construct the command by combining the script and arguments
    const command = `${scriptName} ${args.join(' ')}`;
    const { stdout, stderr } = await execPromise(command, { shell: '/bin/bash' });

    if (stderr) {
      console.error(`Error output: ${stderr}`);
    }

    return stdout; // Return stdout, the actual script output
  } catch (error) {
    throw new Error(`Error executing script: ${error.message}`);
  }
}

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

//// VEHICLE :: GET :: STATUSES
app.get('/api/vehicle/autopilot-details', async (req, res) => {
  console.log('/api/vehicle/autopilot-details');
  try {
    const result = await execScript('mavlink_autopilot_details.sh');
    res.json(JSON.parse(result));
  } catch (error) {
    res.status(500).send('Error retrieving autopilot details');
    console.error(`Error retrieving autopilot details`);

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
    return res.status(404).send('Socket connection not found. Firmware upload failed.');
    console.error(`Error firmware upload failed`);
  }

  firmwareFile.mv(uploadPath, (err) => {
    if (err) {
      console.error('File move error:', err);
      return res.status(500).send('Failed to save the file');
    }
    executeScriptWithProgress('px4_flash.sh', [uploadPath], socket);
    res.send({ message: 'Starting...' });
  });
});

// Network connection proxy
// Proxy API calls for the network service
app.use('/api/network', (req, res) => {
  const connectionManagerPort = 3001;
  const targetUrl = `http://localhost:${connectionManagerPort}${req.url}`;

  // Forward the request to the connection manager service
  fetch(targetUrl, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      ...req.headers
    },
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
  })
  .then(response => response.json())
  .then(data => res.json(data))
  .catch(error => {
    console.error(`Error proxying to connection manager: ${error}`);
    res.status(500).json({ error: "Failed to communicate with connection manager service" });
  });
});

// Service management proxy
// Proxy API calls for the service manager
app.use('/api/service', (req, res) => {
  const serviceManagerPort = 3002;
  const targetUrl = `http://localhost:${serviceManagerPort}${req.url}`;

  // Forward the request to the service manager service
  fetch(targetUrl, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      ...req.headers
    },
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
  })
  .then(response => response.json())
  .then(data => res.json(data))
  .catch(error => {
    console.error(`Error proxying to service manager: ${error}`);
    res.status(500).json({ error: "Failed to communicate with service manager service" });
  });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
