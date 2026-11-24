//0 3 * * * /home/nntien/.nvm/versions/node/v4.8.4/bin/node /data/wifi4u/ads-production/restart_unifi_ap.js /home/nntien/restartAP.log 2>&1
const moment = require('moment');
const axios = require('axios');
const Promise = require('bluebird');
const https = require('https');

const conf = {
  baseUrl: 'https://unifi.genexwifi.com:8443', //https://192.168.6.9:8443
  username: 'admin', //admin
  password: 'Genex@123456',//genexwifi@12345
  siteName: '1r2bwruh' //
};

const instance = axios.create({
  baseURL: conf.baseUrl,
  headers: { 'Content-Type': 'application/json' },
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  withCredentials: true
});
console.log('init instance', moment().format('HH:mm DD/MM/YYYY'));

instance.post('/api/login', { username: conf.username, password: conf.password }).then((postLogin) => {
  const setcookie = postLogin.headers['set-cookie'];
  instance.get(`/api/s/${conf.siteName}/stat/device`, { headers: { Cookie: setcookie.join('; ') } }).then((getDevices) => {
    Promise.map(getDevices.data.data, (apDev) => {
      console.log('call restart', apDev.name, apDev.mac);
      return instance.post(`/api/s/${conf.siteName}/cmd/devmgr`, { cmd: 'restart', mac: apDev.mac, reboot_type: 'soft' }, { headers: { Cookie: setcookie.join('; ') } });
    }).then(() => {
        console.log('restart Done');
    });
  });
}).catch((err) => console.log('post login fail', err));
