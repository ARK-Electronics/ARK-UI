const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const app = express();
app.use(bodyParser.json());

function setWifiMode(mode, apSsid, stationSsid, callback) {
  const configPath = '/etc/ark.env';
  fs.readFile(configPath, 'utf8', (err, data) => {
    if (err) {
      console.error(`File read error: ${err}`);
      return callback(err);
    }

    let config = data;
    config = config.replace(/^(WIFI_MODE=).*/m, `$1${mode}`);
    config = config.replace(/^(WIFI_AP_SSID=).*/m, `$1${apSsid}`);
    config = config.replace(/^(WIFI_STATION_SSID=).*/m, `$1${stationSsid}`);

    fs.writeFile(configPath, config, (err) => {
      if (err) {
        console.error(`File write error: ${err}`);
        return callback(err);
      }
      exec('source /etc/profile.d/ark_env.sh && sudo systemctl restart wifi_control.service', (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return callback(error);
        }
        callback(null);
      });
    });
  });
}

app.get('/api/get-config', async (req, res) => {
  const config = {
    apSsid: 'test',
    apPassword: 'test',
    stationSsid: 'test',
    stationPassword: 'test'
  };

  try {
    const { stdout } = await exec('nmcli -t -f NAME,UUID,TYPE connection show');
    const connections = stdout.split('\n').filter(line => line.includes('802-11-wireless'));

    for (const line of connections) {
      const [name] = line.split(':');
      const { stdout: details } = await exec(`nmcli -t -f 802-11-wireless.ssid,802-11-wireless-security.psk connection show "${name}"`);

      const ssidMatch = details.match(/802-11-wireless.ssid:(.*)/);
      const passMatch = details.match(/802-11-wireless-security.psk:(.*)/);

      if (ssidMatch) {
        const ssid = ssidMatch[1];
        const password = passMatch ? passMatch[1] : '';
        // Determine if this connection is the AP or Station based on the SSID
        if (ssid === config.apSsid || ssid === 'test') {
          config.apSsid = ssid;
          config.apPassword = password;
        } else {
          config.stationSsid = ssid;
          config.stationPassword = password;
        }
      }
    }

    res.json(config);
  } catch (error) {
    console.error('Error retrieving configuration:', error);
    res.status(500).send('Error retrieving configuration');
  }
});

app.post('/api/configure', (req, res) => {
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

  exec(apConfigCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send('Error configuring AP');
    }

    exec(stationConfigCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).send('Error configuring Station');
      }

      setWifiMode(mode, apSsid, stationSsid, (error) => {
        if (error) {
          return res.status(500).send('Error setting WiFi mode');
        }
        res.send('Configuration saved');
      });
    });
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
