'use strict';
// pm2 3.0.0
const pm2 = require('pm2');
const Promise = require('bluebird');
const moment = require('moment');
const nodemailer = require('nodemailer');
const axios = require('axios');
const https = require('https');
const processList = {};
var notify = [];

const instance = axios.create({
  baseURL: 'https://demo.genexwifi.com:8443/wsg/api/public/',
  headers: { 'Content-Type': 'application/json' },
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  withCredentials: true
});

instance.get('/apiInfo')
.then(function(data){ 
              console.log('axios data', data);
            })
            .catch(function(err){
              console.log('axios error!', err);
            });

function verifyMail() {
    const smtpTransport = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        secure: true,
        port: 465,
        auth: { user: 'info.genexwifi@gmail.com', pass: 'oklogin12345' }
    });

    return new Promise((resolve, reject) => {
        smtpTransport.verify((error, success) => {
            if (error) {
                console.log('verify email Err', error);
                reject('verify error');
            } else {
                console.log(">> Server is ready to take our messages <<");
                resolve(smtpTransport);
            }
        });
    });
};

function sendMail(smtpTransport, data){
  const dataEmail = data.map(function(row){ return '<tr><td>'+row.name+'</td><td>'+row.pm_id+'</td><td>'+row.restart+'</td><td>'+row.time+'</td></tr>'});
    const mailOptions = {
        from: 'Genex Wifi DSP Platform <info.genexwifi@gmail.com>',
        to: 'tien@wifiex4u.vn',//'tien@wifiex4u.vn'
        cc: 'thuanpv@wifiex4u.vn, vu.nguyen@wifiex4u.vn',//'thuanpv@wifiex4u.vn, vu.nguyen@wifiex4u.vn'
        bcc: '',
        subject: '[ADS Server] Alarm Email!',
        html: '<html><head><style>table {font-family: arial, sans-serif;border-collapse: collapse;width: 100%;}td, th {border: 1px solid #dddddd;text-align: left;padding: 8px;}tr:nth-child(even) {background-color: #dddddd;}</style></head><body><table><tr><th>App</th><th>PM2 ID</th><th>Restart</th><th>Uptime</th></tr>'+dataEmail+'</table></body></html>'
    }

    return new Promise((resolve, reject) => {
        smtpTransport.sendMail(mailOptions, (error, response) => {
            if (error) {
                reject('Message sent error');
            } else {
                resolve("Message sent: " + response.messageId);
            }
            smtpTransport.close();
        });
    });
};

const CronJob = require('cron').CronJob;
new CronJob('0 */5 * * * *', function() {//* */5 * * * *
  console.log('start job at', moment().format('HH:mm DD/MM/YYYY'));
  pm2.connect(function (err) {
    if (err) {
      console.error(err);
      process.exit(2);
    }

    pm2.list(function (err, appList) {
      Promise.map(appList, function(item){
        if (item.name === 'monitor_app') return;
        if (processList[item.pm_id]) {
          if (processList[item.pm_id].pid !== item.pid && processList[item.pm_id].name === item.name) {
            notify.push({ name: item.name, pm_id: item.pm_id, restart: item.pm2_env.restart_time, time: moment(item.pm2_env.pm_uptime).format('HH:mm DD/MM/YYYY') });
          }
        }
        processList[item.pm_id] = { pid: item.pid, name: item.name };
        return;
      })
      .then(function(){
        if (notify.length) {
          verifyMail().then(function(smtpTransport) {
            sendMail(smtpTransport, notify)
            .then(function(){ 
              console.log('send Mail success!');
              notify = [];
            })
            .catch(function(err){
              console.log('sendMail error!', err);
            });
          })
          .catch(function(err) {
            console.log('verifyMail error!', err);
          });
        }
        console.log('scan done!');
      });
      pm2.disconnect(); // Disconnects from PM2
      if (err) throw err;
    });
  });
}, 
null,
true, /* Start the job right now */
'Asia/Ho_Chi_Minh' /* Time zone of this job. */
);