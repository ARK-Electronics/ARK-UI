const express = require('express');
const bodyParser = require('body-parser');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
const fs = require('fs').promises;

const app = express();
app.use(bodyParser.json());

app.get('/api/get-config', async (req, res) => {
  try {
    const { stdout } = await execFile('/usr/local/bin/get_wifi_config.sh');
    const config = JSON.parse(stdout);
    res.json(config);
  } catch (error) {
    console.error('Error retrieving configuration:', error);
    res.status(500).send('Error retrieving configuration');
  }
});

app.post('/api/configure', async (req, res) => {
  const { apSsid, apPassword, stationSsid, stationPassword, mode } = req.body;

  try {
    const { stderr } = await execFile('/usr/local/bin/set_wifi_config.sh', [apSsid, apPassword, stationSsid, stationPassword, mode]);
    if (stderr) {
      console.error('Error:', stderr);
      return res.status(500).send(stderr);
    }
    res.send('Success');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Connection failed');
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

