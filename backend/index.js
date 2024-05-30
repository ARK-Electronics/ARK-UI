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


// API Routes
app.get('/api/get-active-connection', async (req, res) => {
  try {
    const config = await execFile('/usr/local/bin/get_active_connection_details.sh');
    res.json(JSON.parse(config.stdout));
  } catch (error) {
    res.status(500).send('Error retrieving configuration');
  }
});

app.get('/api/get-ap-connection', async (req, res) => {
  try {
    const config = await execFile('/usr/local/bin/get_ap_connection_details.sh');
    res.json(JSON.parse(config.stdout));
  } catch (error) {
    res.status(500).send('Error retrieving configuration');
  }
});

app.post('/api/create-connection', async (req, res) => {
  const { ssid, password, mode } = req.body;
  const script = mode === 'ap' ? 'create_ap_connection.sh' : 'create_infra_connection.sh';

  try {
    const result = await execFile(`/usr/local/bin/${script}`, [ssid, password]);
    res.json(JSON.parse(result.stdout));
  } catch (error) {
    res.status(500).send('Connection failed');
  }
});

app.post('/api/firmware-upload', (req, res) => {
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
