#NEW Genex Wifi
- Fix X-Frame-Options when preview iframe
- Move all fonts to local
- remove unique email validation on user
- m-sdk -> genex-jslib
- M.fuction -> GN.function
- port 80
- dspHost: 103.89.84.23:9084

Edit server/templates/.tpl.js -> npm run template
Edit server/ -> npm run server
Build client -> npm run client

lệnh build client, build server
các lệnh git

##Build App
NODE_ENV=production npm run template ==> get config.production.json build public/lib/genex-jslib@latest.min.js ***
NODE_ENV=production npm run templateOld ==> get config.production.json build public/lib/m-sdk@latest.min.js ***
NODE_ENV=production npm run loopback ==> get config.production.json generate client/lib/lb-services.hs ***
npm run client
npm run server
##Tasks
npm run babel tasks/...
###Cert SSL
In the server/ssl directory, run ssl-keygen.sh: bash ssh-keygen.sh

###Create Loopback client file
need node 10 build
NODE_ENV=production npm run loopback
Replace with
  var appConfig = require('./config.json');
  var urlBase = appConfig.restApiScheme + "//" + appConfig.restApiHost + appConfig.restApiRoot;
  //location.protocol + "//" + location.host + "/api"
###Change es structure when insert
tasks/migate-to-ads2/init-es.sh

###DEV Server
103.89.87.114:9080
wifiex4u/genexwifi@12345

###DEV Server Chorme enable Chorme Security
open -a Google\ Chrome --args --disable-web-security --user-data-dir=$HOME/Library/Application\ Support/Google/Chrome/Default

###ZOHO Mail
"mail": {
  "host": "smtp.zoho.com",
  "username": "wifiex4u@wifiex4u.vn",
  "password": "oklogin12345",
  "sender": "Genex Wifi DSP Platform <wifiex4u@wifiex4u.vn>",
  "accountCreated": false
}

###Update new IP - Relative ***
-> client/lib/config.json
      `
      {
        "restApiScheme": "http:",
        "restApiHost": "210.211.117.184:9080",
        "restApiRoot": "/api",
        "appScheme": "http:",
        "appHost": "210.211.117.184:9080",
        "cloudHost": "http://210.211.117.184:20081"
      }
      `
-> server/config.____.json
      `
      {
        "host": "0.0.0.0",
        "port": "9080",
        "appHost": "210.211.117.184:9080",
        "restApiHost": "210.211.117.184:9080",
        "cloudcmd": {
          "rootDir": "/data/wifi4u/data/cloudcmd",
          "mountPath": "/cloudcmd",
          "maxFileSize": 20,
          "resourceUrl": "http://210.211.117.184:20081",
          "resourcePath": "/resource"
        }
      }
      `

-> server/datasources.____.json
      `
      {
        "redis": {
          "port": "56381",
          "password": "wifiex4umR3dis!@#qwe123"
        },
        "redisTracking": {
          "port": "56381",
          "password": "wifiex4umR3dis!@#qwe123"
        },
        "redisTTL": {
          "port": "56381",
          "password": "wifiex4umR3dis!@#qwe123"
        },
        "kv": {
          "port": "56381",
          "password": "wifiex4umR3dis!@#qwe123"
        },
        "mongo": {
          "port": "52718",
          "database": "db",
          "password": "wifiex4um0ng0Cli3nt!%40#qwe123",
          "user": "client"
        },
        "es": {
          "name": "es",
          "connector": "es",
          "hosts": [
            {
              "host": "127.0.0.1",
              "port": "59200",
              "auth": "elastic:wifiex4u3slactic123qwe!@#"
            }
          ],
          "index": "ads2-v1",
          "log": "debug",
          "apiVersion": "2.3",
          "defaultSize": 10,
          "requestTimeout": 30000
        }
      }
      `
