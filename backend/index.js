const express = require('express');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
const fileUpload = require('express-fileupload');

const app = express();
app.use(express.json());
app.use(fileUpload({ limits: { fileSize: 3 * 1024 * 1024 } })); // 3MB max, MCU flash is 2MB

// Helper function to handle the execution of shell scripts
async function executeScript(scriptPath, args = []) {
  try {
    const { stdout, stderr } = await execFile(scriptPath, args);
    if (stderr) {
      throw new Error(stderr);
    }
    return JSON.parse(stdout);
  } catch (error) {
    console.error('Script execution error:', error);
    throw error;
  }
}

// API Routes
app.get('/api/get-active-connection', async (req, res) => {
  try {
    const config = await executeScript('/usr/local/bin/get_active_connection_details.sh');
    res.json(config);
  } catch (error) {
    res.status(500).send('Error retrieving configuration');
  }
});

app.get('/api/get-ap-connection', async (req, res) => {
  try {
    const config = await executeScript('/usr/local/bin/get_ap_connection_details.sh');
    res.json(config);
  } catch (error) {
    res.status(500).send('Error retrieving configuration');
  }
});

app.post('/api/create-connection', async (req, res) => {
  const { ssid, password, mode } = req.body;
  const script = mode === 'ap' ? 'create_ap_connection.sh' : 'create_infra_connection.sh';

  try {
    const result = await executeScript(`/usr/local/bin/${script}`, [ssid, password]);
    res.json(result);
  } catch (error) {
    res.status(500).send('Connection failed');
  }
});

app.post('/api/upload-firmware', async (req, res) => {
  if (!req.files || !req.files.firmware) {
    return res.status(400).send('No files were uploaded.');
  }

  const firmwareFile = req.files.firmware;
  const uploadPath = `${__dirname}/uploads/${firmwareFile.name}`;

  try {
    await firmwareFile.mv(uploadPath);
    const result = await executeScript('/usr/local/bin/flash_px4.sh', [uploadPath]);
    res.json({ message: 'Successfully uploaded and executed the script.', output: result });
  } catch (error) {
    res.status(500).send('Failed to upload and execute script');
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
