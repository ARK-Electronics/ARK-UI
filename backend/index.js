const express = require('express');
const bodyParser = require('body-parser');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
const fs = require('fs').promises;

const app = express();
app.use(bodyParser.json());

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