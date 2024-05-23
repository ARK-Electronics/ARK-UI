const express = require('express');
const bodyParser = require('body-parser');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs').promises;

const app = express();
app.use(bodyParser.json());

async function updateEnvironmentVariables(mode, apSsid, stationSsid) {
  const configPath = '/etc/ark.env';
  try {
    let config = await fs.readFile(configPath, 'utf8');
    config = config.replace(/^(WIFI_MODE=).*/m, `$1${mode}`);
    config = config.replace(/^(WIFI_AP_SSID=).*/m, `$1${apSsid}`);
    config = config.replace(/^(WIFI_STATION_SSID=).*/m, `$1${stationSsid}`);
    await fs.writeFile(configPath, config);

    await exec('source /etc/profile.d/ark_env.sh && sudo systemctl restart wifi_control.service');
  } catch (error) {
    console.error('Error setting WiFi mode:', error);
    throw error;
  }
}

async function getConnectionDetails(ssid) {
  try {
    const { stdout: details } = await exec(`nmcli -t -f 802-11-wireless.ssid,802-11-wireless-security.psk connection show "${ssid}" -s`);
    const ssidMatch = details.match(/802-11-wireless.ssid:(.*)/);
    const passMatch = details.match(/802-11-wireless-security.psk:(.*)/);

    return {
      ssid: ssidMatch ? ssidMatch[1] : 'test',
      password: passMatch ? passMatch[1] : 'test'
    };
  } catch (error) {
    console.error(`Error retrieving details for ${ssid}:`, error);
    return {
      ssid: 'test',
      password: 'test'
    };
  }
}

app.get('/api/get-config', async (req, res) => {
  try {
    const envConfig = await fs.readFile('/etc/ark.env', 'utf8');
    const apSsid = envConfig.match(/WIFI_AP_SSID=(.*)/)[1];
    const stationSsid = envConfig.match(/WIFI_STATION_SSID=(.*)/)[1];

    const apDetails = await getConnectionDetails(apSsid);
    const stationDetails = await getConnectionDetails(stationSsid);

    const config = {
      apSsid: apDetails.ssid,
      apPassword: apDetails.password,
      stationSsid: stationDetails.ssid,
      stationPassword: stationDetails.password
    };

    res.json(config);
  } catch (error) {
    console.error('Error retrieving configuration:', error);
    res.status(500).send('Error retrieving configuration');
  }
});

app.post('/api/configure', async (req, res) => {
  const { apSsid, apPassword, stationSsid, stationPassword, mode } = req.body;

  const apConfigCommand = `
    nmcli connection add type wifi ifname wlan0 con-name "${apSsid}" autoconnect no ssid ${apSsid} &&
    nmcli connection modify "${apSsid}" 802-11-wireless.mode ap 802-11-wireless.band bg ipv4.method shared &&
    nmcli connection modify "${apSsid}" wifi-sec.key-mgmt wpa-psk &&
    nmcli connection modify "${apSsid}" wifi-sec.psk ${apPassword}
  `;

  const stationConfigCommand = `
    nmcli connection add type wifi ifname wlan0 con-name "${stationSsid}" ssid ${stationSsid} &&
    nmcli connection modify "${stationSsid}" wifi-sec.key-mgmt wpa-psk &&
    nmcli connection modify "${stationSsid}" wifi-sec.psk ${stationPassword}
  `;

  try {
    await exec(apConfigCommand);
    await exec(stationConfigCommand);
    await updateEnvironmentVariables(mode, apSsid, stationSsid);
    res.send('Configuration saved');
  } catch (error) {
    console.error('Error configuring WiFi:', error);
    res.status(500).send('Error configuring WiFi');
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
