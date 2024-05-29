const express = require('express');
const bodyParser = require('body-parser');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
const fs = require('fs').promises;
const fileUpload = require('express-fileupload');

const app = express();
app.use(bodyParser.json());
app.use(fileUpload());

app.get('/api/get-active-connection', async (req, res) => {
  try {
    // const { stdout } = await execFile('/usr/local/bin/get_wifi_config.sh');
    const { stdout } = await execFile('/usr/local/bin/get_active_connection_details.sh');
    const config = JSON.parse(stdout);
    res.json(config);
  } catch (error) {
    console.error('Error retrieving configuration:', error);
    res.status(500).send('Error retrieving configuration');
  }
});

app.get('/api/get-ap-connection', async (req, res) => {
  try {
    // const { stdout } = await execFile('/usr/local/bin/get_wifi_config.sh');
    const { stdout } = await execFile('/usr/local/bin/get_ap_connection_details.sh');
    const config = JSON.parse(stdout);
    res.json(config);
  } catch (error) {
    console.error('Error retrieving configuration:', error);
    res.status(500).send('Error retrieving configuration');
  }
});

app.post('/api/create-connection', async (req, res) => {
  const { ssid, password, mode } = req.body;

  try {
    let script = mode === 'ap' ? 'create_ap_connection.sh' : 'create_infra_connection.sh';
    const { stdout, stderr } = await execFile(`/usr/local/bin/${script}`, [ssid, password]);

    if (stderr) {
      console.error('Error:', stderr);
      return res.status(500).send(stderr);
    }

    res.json(JSON.parse(stdout));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Connection failed');
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

app.post('/api/upload-firmware', async (req, res) => {
  if (!req.files || !req.files.firmware) {
    return res.status(400).send('No files were uploaded.');
  }

  // Save the file to a temporary directory
  const firmwareFile = req.files.firmware;
  const uploadPath = __dirname + '/uploads/' + firmwareFile.name;

  try {
    await firmwareFile.mv(uploadPath);
    // Script is in path
    const { stdout, stderr } = await execFile('python', ['flash_px4.sh', uploadPath]);

    if (stderr) {
      console.error('Script error:', stderr);
      return res.status(500).send('Script error: ' + stderr);
    }

    res.json({ message: 'Successfully uploaded and executed the script.', output: stdout });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Failed to upload and execute script');
  }
});