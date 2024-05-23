const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const exec = require('child_process').exec;
const path = require('path');

const app = express();
app.use(bodyParser.json());

function setWifiMode(mode, callback) {
  const configPath = '/etc/ark.env';
  fs.readFile(configPath, 'utf8', (err, data) => {
    if (err) {
      console.error(`File read error: ${err}`);
      return callback(err);
    }

    let config = data;
    config = config.replace(/^(WIFI_MODE=).*/m, `$1${mode}`);

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

app.get('/api/get-config', (req, res) => {
  const config = {
    apSsid: 'test',
    apPassword: 'test',
    stationSsid: 'test',
    stationPassword: 'test'
  };

  const readFileAsync = (path, callback) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        return callback(err);
      }
      callback(null, data);
    });
  };

  readFileAsync('/etc/hostapd/hostapd.conf', (err, data) => {
    if (!err) {
      const ssidMatch = data.match(/^ssid=(.*)$/m);
      const passMatch = data.match(/^wpa_passphrase=(.*)$/m);
      if (ssidMatch) {
        config.apSsid = ssidMatch[1];
      }
      if (passMatch) {
        config.apPassword = passMatch[1];
      }
    }

    readFileAsync('/etc/wpa_supplicant/wpa_supplicant.conf', (err, data) => {
      if (!err) {
        const ssidMatch = data.match(/ssid="([^"]*)"/);
        const passMatch = data.match(/psk="([^"]*)"/);
        if (ssidMatch) {
          config.stationSsid = ssidMatch[1];
        }
        if (passMatch) {
          config.stationPassword = passMatch[1];
        }
      }

      res.json(config);
    });
  });
});

app.post('/api/configure', (req, res) => {
  const { apSsid, apPassword, stationSsid, stationPassword, mode } = req.body;

  const apConfigPath = '/etc/hostapd/hostapd.conf';
  const stationConfigPath = '/etc/wpa_supplicant/wpa_supplicant.conf';

  const apConfig = `interface=wlan0
driver=nl80211
ssid=${apSsid}
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
ignore_broadcast_ssid=0
auth_algs=1
wpa=2
wpa_passphrase=${apPassword}
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP`;

  const stationConfig = `network={
  ssid="${stationSsid}"
  psk="${stationPassword}"
}`;

  fs.writeFile(apConfigPath, apConfig, (err) => {
    if (err) {
      console.error(`File write error: ${err}`);
      return res.status(500).send('Error configuring AP');
    }

    fs.writeFile(stationConfigPath, stationConfig, (err) => {
      if (err) {
        console.error(`File write error: ${err}`);
        return res.status(500).send('Error configuring Station');
      }

      setWifiMode(mode, (error) => {
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
