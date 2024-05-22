const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const exec = require('child_process').exec;

const app = express();
app.use(bodyParser.json());

app.post('/api/configure-ap', (req, res) => {
  const { ssid, password } = req.body;
  const config = `interface=wlan0
ssid=${ssid}
wpa_passphrase=${password}
hw_mode=g
channel=7
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP`;

  fs.writeFile('/etc/hostapd/hostapd.conf', config, (err) => {
    if (err) {
      console.error(`File write error: ${err}`);
      return res.status(500).send('Error configuring AP');
    }
    exec('sudo systemctl restart hostapd', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).send('Error configuring AP');
      }
      res.send('AP configured successfully');
    });
  });
});

app.post('/api/configure-station', (req, res) => {
  const { ssid, password } = req.body;
  const config = `network={
ssid="${ssid}"
psk="${password}"
}`;

  fs.appendFile('/etc/wpa_supplicant/wpa_supplicant.conf', config, (err) => {
    if (err) {
      console.error(`File append error: ${err}`);
      return res.status(500).send('Error configuring Station');
    }
    exec('sudo wpa_cli reconfigure', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).send('Error configuring Station');
      }
      res.send('Station configured successfully');
    });
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
