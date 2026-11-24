const axios = require('axios');
const https = require('https');
const moment = require('moment');
const lodash = require('lodash');
const fs = require('fs');
const emailCheck = require('email-check');
const { allowCrossOrigin } = require('../import/access-utils');
const { embedCodeHtml } = require('../import/banner-util');
const {
    extractDeviceOptions,
    standardizeMacAddress,
    standardizeMacAddressCNA,
    standardizeURL
} = require('../import/utils');

const portalBilling = 'http://localhost:9000/api';
const HOME_FOLDER = 'nntien';
const LOGO_LOADING = 'http://static.genexwifi.com/asset/logo/logo-genexwifi-flatform-black.png';

module.exports = (server) => {
    const {
        SelectOption,
        User,
        Voucher,
        Banner,
        Device,
        Tracking,
        SessionCached
    } = server.models;
    // Install a `/` route that returns server status
    const router = server.loopback.Router();
    router.get('/status', server.loopback.status());
    router.get('/null', (req, res) => {
        res.header('Content-Type', 'text/html');
        res.header('X-Frame-Options', 'SAMEORIGIN');
        res.header('Access-Control-Allow-Methods', 'GET');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Origin', '*');
        res.send(server.loopback.status());
    });

    router.get('/.well-known/pki-validation/54187192FC9948902ED2B57491937D12.txt', (req, res) => {
        res.send(`3709DFDCC3F8AD1B0B6AD54B4256E9C293FAA06BF1E8943978599AED601E465E
comodoca.com
aac771283611256`);
    });


    router.post('/GponForm/diag_Form', (req, res) => {
        console.log('Log unknown: ', req.body, req.params);
        res.end();
    });

    router.get('favicon.ico', (req, res) => {
        res.end();
    });
    router.post('/verifySecretKey', async (req, res) => {
        const usr = await User.findOne({ where: { id: req.body.clientId, clientkey: req.body.clientKey } });
        if (usr) {
            res.send('OK');
        } else {
            res.status(500);
            res.send('CREDENTIALS_NOT_VALID');
        }
        res.end();
    });
    router.post('/login', (req, res) => {
        if (req.body && req.body.redirect) {
            res.writeHead(302, {
                Location: req.body.redirect.indexOf('://') > -1 ? req.body.redirect : decodeURIComponent(req.body.redirect)
            });
        }
        res.end();
    });

    const unifiProcess = (conf, res, redirectUrl, params, trackUsage) => {
        const startTime = moment().valueOf();
        const instance = axios.create({
            baseURL: conf.baseUrl,
            headers: { 'Content-Type': 'application/json' },
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            withCredentials: true
        });
        instance.post(
            conf.isUnifiOs ? '/api/auth/login' : '/api/login',
            { username: conf.username, password: conf.password }
        )
        .then((postLogin) => {
            const setcookie = postLogin.headers['set-cookie'];
            console.log('postLogin->>>>', `${moment().diff(startTime, 'seconds')} sec`, params.si);
            const loginParams = { cmd: 'authorize-guest', mac: params.m.toLowerCase() };
            // ap: params.ap.toLowerCase(),
            if (conf.sesion) {
                loginParams.minutes = Number(conf.sesion);
            }
            if (conf.up) {
                loginParams.up = Number(conf.up);
            }
            if (conf.down) {
                loginParams.down = Number(conf.down);
            }
            const headerData = {
                Cookie: setcookie.join('; ')
            };
            if (conf.isUnifiOs) {
                headerData['x-csrf-token'] = postLogin.headers['x-csrf-token'];
            }
            instance.post(
                `${conf.isUnifiOs ? '/proxy/network' : ''}/api/s/${params.si}/cmd/stamgr`,
                loginParams,
                { headers: headerData }
            )
            .then((postPass) => {
                if (trackUsage) {
                    try {
                        axios.post(`${server.get('reportUsageURL')}/api/v1/tracking`, {
                            mac: params.m.toLowerCase(),
                            campaign: params.ci,
                            location: params.li,
                            trackingId: params.lci,
                            ap: params.ap.toLowerCase(),
                            unifiSiteId: params.si
                        });
                    } catch (error) {}
                }
                console.log('postPass->>>>>', `${moment().diff(startTime, 'seconds')} sec`, JSON.stringify(postPass.data));
                fs.appendFile(`/home/${HOME_FOLDER}/unifiLog/${params.si}.log`, `${moment().format('MMM DD, HH:mm:ss')} | ${params.m} | ${params.ap} | Authorized | ${JSON.stringify(postPass.data)} | ${JSON.stringify(loginParams)} \n`, (err) => {
                    if (err) console.log('write file err', err);
                });
                // res.send(redirectUrl);
                if (redirectUrl) {
                    const loadingLogo = conf.loadingLogo || LOGO_LOADING;
                    res.header('Content-Type', 'text/html');
                    res.header('Access-Control-Request-Headers', 'text/html');
                    res.send(`<!DOCTYPE html><html><head lang="en"><meta name="viewport" content="width=device-widthinitial-scale=1maximum-scale=1"><meta charset="UTF-8"><title>Genex Wifi</title><style>html{height:100%;background:#fff}body{padding:0;margin:0}.center{text-align:center}@keyframes offset{100%{stroke-dashoffset:0}}#container{display:flex;align-items:center;justify-content:center;margin-top:20px;margin-bottom:20px}figure{margin:1rem!important}@media screen and (max-width:999px){.landscape img{height:auto;width:50%}.landscape p{font-size:20px}.landscape #percentage{top:5px}.landscape #connecting{font-size:20px}.portrait img{height:auto;width:70%}.portrait p{font-size:20px}}img.logo{height:auto;width:200px}@media screen and (min-width:1000px){p{font-size:25px}}</style></head><body class="portrait"><p style="display:none">Success</p><div style="text-align:center;padding-top:20px"><img id="logo" src="${loadingLogo}" width="300"></div><div style="text-align:center"><p style="font-weight:700">Vui lòng đợi trong giây lát...</p></div><script>"use strict";setInterval(function(){window.innerWidth<1e3&&window.innerWidth>window.innerHeight?document.body.className="landscape":document.body.className="portrait"},200);var redirectUrl="${redirectUrl}",image=new Image,time=new Date,imgSrc="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_120x44dp.png?version=("+time.getTime()+")";image.src=imgSrc;var intervalOnline=setInterval(function(){image.complete&&image.naturalWidth&&(window.location.href=redirectUrl)},500),intervalImg=setInterval(function(){image.src="null",image.src=imgSrc},2e3);</script></body></html>`);
                    // res.send('<!doctype html><html>'+
                    // '<head>'+
                    // '<meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>WiFiEX4U</title>'+
                    // '<style>.loader {border: 10px solid #f3f3f3;border-top: 10px solid #3498db;border-radius: 50%;width: 60px;height: 60px;animation: spin 2s linear infinite;margin:0 auto}@keyframes spin {0% { transform: rotate(0deg); }100% { transform: rotate(360deg); }}</style>'+
                    // '</head>'+
                    // '<body style="text-align: center; padding-top: 30px;">'+
                    // '<script type="text/javascript">'+
                    // '"use strict";'+
                    // 'var redirectUrl = "'+redirectUrl+'";var image = new Image();var time = new Date();var imgSrc = "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_120x44dp.png?version=("+time.getTime()+")";'+
                    // 'image.src = imgSrc;'+
                    // 'var intervalOnline = setInterval(function() {if (image.complete && image.naturalWidth) {console.log(image.complete, image.naturalWidth);clearInterval(intervalOnline);clearInterval(intervalImg);window.location.href=redirectUrl;}}, 500);'+
                    // 'var intervalImg = setInterval(function() {image.src = "null";image.src = imgSrc;}, 2000);'+
                    // '</script>'+
                    // '<h4 style="color: blue;">System is processing, please waiting in some seconds</h4>'+
                    // '<div class="loader"></div>'+
                    // '</body></html>');
                } else {
                    res.status(200).send('OK');
                }
            })
            .catch((e) => {
                console.log('post Unifi set authorize failed', e);
                res.header('Content-Type', 'text/html');
                res.header('Access-Control-Request-Headers', 'text/html');
                res.send('Authorize Unifi controller fail. Please contact Administrator to have the support.');
            });
        })
        .catch((e) => {
            console.log('post Unifi Login failed', e);
            res.header('Content-Type', 'text/html');
            res.header('Access-Control-Request-Headers', 'text/html');
            res.send('Login Unifi controller fail. Please contact Administrator to have the support.');
        });
    };
    router.get('/email-check/:email', (req, res) => {
        if (req.params.email) {
            emailCheck(req.params.email, {
                from: 'info.genexwifi@gmail.com',
                host: 'smtp.gmail.com',
                timeout: 3000
            })
            .then((resEmail) => {
                console.log(`email check ${req.params.email}`, resEmail);
                if (!resEmail) {
                    res.send('ERR');
                } else {
                    res.send('OK');
                }
            })
            .catch((err) => {
                console.log('err check mail', err);
                res.send('ERR');
            });
        } else {
            res.send('OK');
        }
    });
    const ruckusCloudProcess = async (params, redirectUrl, res, trackUsage) => {
        const startTime = moment().valueOf();
        const instance = axios.create({
            baseURL: params.loginurl,
            headers: { 'Content-Type': 'application/json' },
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            withCredentials: true
        });
        try {
            const postLogin = await instance.post('', {
                Vendor: 'Ruckus',
                APIVersion: '1.0',
                RequestUserName: 'api',
                RequestPassword: params.integrateKey,
                RequestCategory: 'UserOnlineControl',
                RequestType: 'Login',
                'UE-IP': params.uip,
                'UE-MAC': params.client_mac,
                'UE-Username': params.lci,
                'UE-Password': params.lci
            });
            console.log('ruckusLogin->>>>>', `${moment().diff(startTime, 'seconds')} sec`,
            JSON.stringify(postLogin.data), JSON.stringify({
                Vendor: 'Ruckus',
                APIVersion: '1.0',
                RequestUserName: 'api',
                RequestPassword: params.integrateKey,
                RequestCategory: 'UserOnlineControl',
                RequestType: 'Login',
                'UE-IP': params.uip,
                'UE-MAC': params.client_mac,
                'UE-Username': params.lci,
                'UE-Password': params.lci
            }), params);
            if (postLogin.data && [201, 101].indexOf(postLogin.data.ResponseCode) > -1) {
                if (trackUsage) {
                    try {
                        axios.post(`${server.get('reportUsageURL')}/api/v1/tracking`, {
                            mac: params.m.toLowerCase(),
                            campaign: params.ci,
                            location: params.li,
                            ap: params.ap.toLowerCase()
                        });
                    } catch (error) {}
                }
                if (redirectUrl) {
                    const loadingLogo = 'https://static.kaimedia.org/asset/logo/logo-genexwifi-flatform-black.png';
                    res.header('Content-Type', 'text/html');
                    res.header('Access-Control-Request-Headers', 'text/html');
                    res.send(`<!DOCTYPE html><html><head lang="en"><meta name="viewport" content="width=device-width initial-scale=1.0 maximum-scale=1.0"><meta charset="UTF-8"><title>Genex Wifi</title><style>html{height: 100%;background: white;}body{padding: 0;margin: 0;}.center{text-align: center;}.chart-three{width: 200px;height: 200px;margin: 0;position: relative;}.chart-three.animate svg .circle-foreground{animation: offset 5s ease-in-out forwards;animation-delay: 0s;}.chart-three.animate figcaption:after{animation: chart-three-label 5s steps(100) forwards;animation-delay: 0s;}.chart-three svg{width: 100%;height: 100%;}.chart-three svg .circle-background, .chart-three svg .circle-foreground{r: 87.5px;cx: 50%;cy: 50%;fill: none;stroke: #305556;stroke-width: 25px;}.chart-three svg .circle-foreground{stroke: url(#test);stroke-dasharray: 549.5px 549.5px;stroke-dashoffset: 549.5px;stroke-linecap: round;transform-origin: 50% 50%;transform: rotate(-90deg);}.chart-three figcaption{display: inline-block;width: 100%;height: 2.5rem;overflow: hidden;text-align: center;color: #c6e8d7;position: absolute;top: calc(50% - 1.25rem);left: 0;font-size: 0;font-weight: bold;}.chart-three figcaption:after{display: inline-block;content: "0%a 1%a 2%a 3%a 4%a 5%a 6%a 7%a 8%a 9%a 10%a 11%a 12%a 13%a 14%a 15%a 16%a 17%a 18%a 19%a 20%a 21%a 22%a 23%a 24%a 25%a 26%a 27%a 28%a 29%a 30%a 31%a 32%a 33%a 34%a 35%a 36%a 37%a 38%a 39%a 40%a 41%a 42%a 43%a 44%a 45%a 46%a 47%a 48%a 49%a 50%a 51%a 52%a 53%a 54%a 55%a 56%a 57%a 58%a 59%a 60%a 61%a 62%a 63%a 64%a 65%a 66%a 67%a 68%a 69%a 70%a 71%a 72%a 73%a 74%a 75%a 76%a 77%a 78%a 79%a 80%a 81%a 82%a 83%a 84%a 85%a 86%a 87%a 88%a 89%a 90%a 91%a 92%a 93%a 94%a 95%a 96%a 97%a 98%a 99%a 100%a";white-space: pre;font-size: 2.5rem;line-height: 2.5rem;background: linear-gradient(to right, #00bc9b 0%, #5eaefd 100%);-webkit-background-clip: text;-webkit-text-fill-color: transparent;}@keyframes chart-three-label{100%{transform: translateY(-250rem);}}@keyframes offset{100%{stroke-dashoffset: 0;}}#container{display: flex;align-items: center;justify-content: center;margin-top: 20px;margin-bottom: 20px;}figure{margin: 1rem !important;}@media screen and (max-width: 999px){.landscape img{height: auto;width: 50%;}.landscape p{font-size: 20px;}.landscape #percentage{top: 5px;}.landscape #connecting{font-size: 20px;}.portrait img{height: auto;width: 70%;}.portrait p{font-size: 20px;}}img.logo{height: auto;width: 200px;}@media screen and (min-width: 1000px){p{font-size: 25px;}}</style></head><body class="portrait"><p style="display:none;">Success</p><div style="text-align: center; padding-top: 20px;"><img id="logo" src="${loadingLogo}" width="300"/></div><div id="container" class="center"><figure class="chart-three animate"><svg role="img" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><title>Connecting</title><desc>Connecting</desc><defs><linearGradient id="test"><stop offset="0%" stop-color="#00bc9b"/><stop offset="100%" stop-color="#5eaefd"/></linearGradient></defs><circle class="circle-background"/><circle class="circle-foreground"/></svg><figcaption>Vui l\xF2ng \u0111\u1EE3i trong gi\xE2y l\xE1t...</figcaption></figure></div><div style="text-align: center"><p style="font-weight: bold">Vui l\xF2ng \u0111\u1EE3i trong gi\xE2y l\xE1t...</p></div><script>"use strict";setInterval(function (){if (window.innerWidth < 1000 && (window.innerWidth > window.innerHeight)){document.body.className="landscape";}else{document.body.className="portrait";}}, 200);var redirectUrl="${redirectUrl}";var image=new Image();var time=new Date();var imgSrc="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_120x44dp.png?version=("+time.getTime()+")";image.src=imgSrc;var intervalOnline=setInterval(function(){if (image.complete && image.naturalWidth){clearInterval(intervalOnline);clearInterval(intervalImg);window.location.replace(redirectUrl);}}, 500);var intervalImg=setInterval(function(){image.src="null";image.src=imgSrc;}, 2000);</script></body></html>`);
                } else {
                    res.status(200).send('OK');
                }
            } else {
                res.header('Content-Type', 'text/html');
                res.header('Access-Control-Request-Headers', 'text/html');
                res.send(`Authorize Ruckus controller fail. [${postLogin.data.ReplyMessage}]. Please contact Administrator to have the support.`);
            }
          // res.send(redirectUrl);
        } catch (error) {
            console.log('post Ruckus set authorize failed', error);
            res.header('Content-Type', 'text/html');
            res.header('Access-Control-Request-Headers', 'text/html');
            res.send(
            'Authorize Ruckus controller fail. Please contact Administrator to have the support.');
        }
    };
    router.get('/guest/s/:siteId', (req, res) => {
        res.writeHead(302, {
            'Content-Type': 'text/plain',
            Location: `http://${server.get('appHost') || server.get('restApiHost')}/api/common/unifiSplash${req.url}`
        });
        res.end();
    });

    router.get('/ruckus_cloud_login', async (req, res) => {
        const params = {};
        Object.keys(req.query).forEach((dat) => {
            if (typeof req.query[dat] === 'string') {
                params[dat] = req.query[dat];
            } else if (typeof req.query[dat] === 'object') {
                params[dat] = req.query[dat][0];
            }
        });
        const groupData = await SelectOption.findById(params.lci);
        params.integrateKey = groupData && groupData.options ? groupData.options.integrateKey : 'unknown';
        let redirectUrl = '';
        if (params.redirect) {
            redirectUrl =
                params.redirect.indexOf('://') > -1 ?
                params.redirect :
                decodeURIComponent(params.redirect);
        }
        allowCrossOrigin(res);
        return ruckusCloudProcess(params, redirectUrl, res, groupData.options.isTrackUsage || false);
    });

    router.post('/unifiLogin', async (req, res) => {
        const params = Object.assign({}, req.body, req.query);
        const group = await SelectOption.findById(params.lci);
        let redirectUrl = '';
        if (req.body.redirect) {
            redirectUrl = req.body.redirect.indexOf('://') > -1 ? req.body.redirect : decodeURIComponent(req.body.redirect);
        }

        allowCrossOrigin(res);
        const deviceOptions = extractDeviceOptions(req.useragent);
        fs.appendFile(`/home/${HOME_FOLDER}/unifiLog/${params.si}.log`, `${moment().format('MMM DD, HH:mm:ss')} | ${params.m} | ${params.ap} | ${deviceOptions.device}-${deviceOptions.os} | Authorize \n`, (err) => {
            if (err) console.log('write file err', err);
        });
        if (!group) {
            return res.send('<h5 style="text-align: center;">Location not belong to any Wifi Network!<br> Please contact Administrator to have the support.</h5>');
        }
        if (group.unifi) {
            const instancePortal = axios.create({
                baseURL: portalBilling,
                headers: { 'Content-Type': 'application/json' }
            });
            try {
                const getValidateUser = await instancePortal.post(
                    '/plans/validate-cl-div',
                    {
                        code: params.loginCode,
                        macAddress: params.m.toLowerCase(),
                        userAgent: req.headers['user-agent'],
                        logoutUrl: group.unifi.baseUrl,
                        locationId: params.ap.toLowerCase(),
                        siteId: params.si,
                        logoutUser: group.unifi.username,
                        logoutPass: group.unifi.password
                    }
                );
                if (getValidateUser.data) {
                    if (getValidateUser.data.success) {
                        const planModify = {};
                        if (getValidateUser.data.plan.upBandwidth) {
                            planModify.up = getValidateUser.data.plan.upBandwidth;
                        }
                        if (getValidateUser.data.plan.downBandwidth) {
                            planModify.down = getValidateUser.data.plan.downBandwidth;
                        }
                        if (getValidateUser.data.plan.endTime) {
                            planModify.minutes = Math.abs(moment().diff(getValidateUser.data.plan.endTime, 'minutes'));
                        }
                        return unifiProcess(Object.assign({}, group.unifi, planModify), res, redirectUrl, params, group.options.isTrackUsage || false);
                    }
                        return res.send({ error: getValidateUser.data.message });
                }
                    return res.send({ error: 'Failed to validate code!' });
            } catch (error) {
                console.log('Failed to validate code', error);
                return res.send({ error: 'Failed to validate code!' });
            }
        } else {
            return res.send('OK');
        }
        // res.end();
    });
    router.get('/unifiLogin', async (req, res) => {
        const params = {};
        Object.keys(req.query).forEach((dat) => {
            if (typeof req.query[dat] === 'string') {
                params[dat] = req.query[dat];
            } else if (typeof req.query[dat] === 'object') {
                params[dat] = req.query[dat][0];
            }
        });
        const group = await SelectOption.findById(params.lci);
        let redirectUrl = '';
        if (params.redirect) {
            redirectUrl = params.redirect.indexOf('://') > -1 ? params.redirect : decodeURIComponent(params.redirect);
        }

        allowCrossOrigin(res);
        const deviceOptions = extractDeviceOptions(req.useragent);
        fs.appendFile(`/home/${HOME_FOLDER}/unifiLog/${params.si}.log`, `${moment().format('MMM DD, HH:mm:ss')} | ${params.m} | ${params.ap} | ${deviceOptions.device}-${deviceOptions.os} | Authorize \n`, (err) => {
            if (err) console.log('write file err', err);
        });
        if (!group) {
            return res.send('<h5 style="text-align: center;">Location not belong to any Wifi Network!<br> Please contact Administrator to have the support.</h5>');
        }
        if (group.unifi) {
            return unifiProcess(group.unifi, res, redirectUrl, params, group.options.isTrackUsage || false);
        }
        res.send('OK');

        // res.end();
    });

    router.get('/chillispot-login', async (req, res) => {
        const params = {};
        Object.keys(req.query).forEach((dat) => {
            if (typeof req.query[dat] === 'string') {
                params[dat] = req.query[dat];
            } else if (typeof req.query[dat] === 'object') {
                params[dat] = req.query[dat][0];
            }
        });
        if (!params.userurl || !params.mac) return res.send('Need params!');
        await SessionCached.upsert({
            id: Device.toId(standardizeMacAddress(params.mac)),
            redirect: params.userurl
        });
        res.redirect(`http://genexwifi.com/hotspot/hotspotlogin.php${req._parsedUrl.search}`);
    });

    router.post('/vsz-nbi', async (req, res) => {
        const params = {};
        Object.keys(req.body).forEach((dat) => {
            if (typeof req.body[dat] === 'string') {
                params[dat] = req.body[dat];
            } else if (typeof req.body[dat] === 'object') {
                params[dat] = req.body[dat][0];
            }
        });
        let redirectUrl = '';
        if (params.redirect) {
            redirectUrl = params.redirect.indexOf('://') > -1 ? params.redirect : decodeURIComponent(params.redirect);
        }

        allowCrossOrigin(res);
        // call NBI
        const instance = axios.create({
            baseURL: 'http://103.136.114.26:9080',
            headers: { 'Content-Type': 'application/json' }
            // httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            // withCredentials: true
        });
        console.log('post nbi data', JSON.stringify({
            Vendor: 'Ruckus',
            RequestPassword: 'Genex@123456',
            APIVersion: '1.0',
            RequestCategory: 'UserOnlineControl',
            RequestType: 'Login',
            'AP-MAC': params.ap,
            'UE-IP': params.uip,
            'UE-MAC': params.client_mac,
            'UE-Proxy': '0',
            'UE-Username': params['UE-Username'],
            'UE-Password': params['UE-Password']
        }));
        instance.post(
            '/portalintf',
            {
                Vendor: 'Ruckus',
                RequestPassword: 'Genex@123456',
                APIVersion: '1.0',
                RequestCategory: 'UserOnlineControl',
                RequestType: 'Login',
                'AP-MAC': params.ap,
                'UE-IP': params.uip,
                'UE-MAC': params.client_mac,
                'UE-Proxy': '0',
                'UE-Username': params['UE-Username'],
                'UE-Password': params['UE-Password']
            }
        )
        .then((postPass) => {
            console.log('nbi post login->>>>>', JSON.stringify(postPass.data));
            res.send(postPass.data);
        })
        .catch((e) => {
            console.log('nbi post failed', e);
            res.send({ ReplyMessage: 'Authorize Ruckus vSzz controller fail. Please contact Administrator to have the support' });
        });
    });

    router.post('/voucherLogin', async (req, res, cb) => {
        const usr = await User.findOne({ where: { _id: req.body.clientId, clientkey: req.body.clientKey } });
        let err;
        let limit = {};
        if (!req.body.clientId || !req.body.clientKey || !usr) {
            res.status(500);
            res.send('CREDENTIALS_NOT_VALID');
        } else {
            const vou = await Voucher.findOne({ where: { code: req.body.voucher } });
            let mac = req.body.mac;
            let locationId = req.body.locationId;
            if (vou) {
                if (mac.indexOf('-')) {
                    mac = mac.split('-').join(':');
                }
                if (vou.expiredAt && moment().valueOf() > vou.expiredAt) {
                    err = 'VOUCHER_EXPIRED';
                } else if (vou.quota && vou.current && !vou.current[mac] && lodash.size(vou.current) >= vou.quota && !req.body.forceVoucher) {
                    err = 'VOUCHER_MAXUSER';
                } else if (vou.loggedIn && vou.loggedIn[mac] && vou.byte > 0 && vou.loggedIn[mac].totalData >= (vou.byte * 1024 * 1024)) {
                    err = 'VOUCHER_MAXDATA';
                } else {
                    if (vou.upload) { limit.up = vou.upload; }
                    if (vou.download) { limit.down = vou.download; }
                    if (vou.quota) { limit.quota = vou.quota; }
                    if (vou.byte) {
                        if (vou.loggedIn && vou.loggedIn[mac] && vou.loggedIn[mac].totalData) {
                            limit.byte = ((vou.byte * 1024 * 1024) - vou.loggedIn[mac].totalData) / 1024 / 1024;
                        } else {
                            limit.byte = vou.byte;
                        }
                    }
                    if (!vou.expiredAt) {
                        limit.expire = vou.expireTime + moment().valueOf();
                    } else {
                        limit.expire = vou.expiredAt;
                    }
                    if (vou.makeSurvey) {
                        limit.makeSurvey = vou.makeSurvey;
                    }
                }
            } else {
                err = 'VOUCHER_INVALID';
            }
            if (err) {
                res.status(500);
                if (err === 'VOUCHER_MAXUSER') {
                    res.send(`${err}:${lodash.map(vou.current, (info, mac) => `Device ${info.device}-${info.os} ${mac}`).join(', ')}`);
                } else {
                    res.send(err);
                }
            } else {
                res.header('Content-Type', 'application/json');
                res.send(limit);
                if (!vou.current) { vou.current = {}; }
                if (!vou.loggedIn) { vou.loggedIn = {}; }
                if (!vou.loggedIn[mac]) { vou.loggedIn[mac] = { totalData:0, history: [] }; }
                vou.loggedIn[mac].history.push({ action: 'login', time: moment().valueOf(), locationId });
                vou.current[mac] = { device: req.body.device, os: req.body.os };

                const esDeviceConn = Device.getDataSource().connector;
                const esDeviceDb = esDeviceConn.db;
                Promise.promisify(esDeviceDb.bulk).call(esDeviceDb, {
                    index: esDeviceConn.searchIndex,
                    type: Device.modelName,
                    body: [
                        { update: { _id: Device.toId(mac) } },
                        { doc: { voucher: vou.code } }
                    ]
                });
                if (req.body.makeSurvey) {
                    vou.updateAttribute('makeSurvey', true);
                }
                vou.updateAttribute('loggedIn', vou.loggedIn);
                vou.updateAttribute('current', vou.current);
                if (!vou.status) {
                    if (!vou.expiredAt) {
                        vou.updateAttribute('expiredAt', vou.expireTime + moment().valueOf());
                    }
                    vou.updateAttribute('status', 1);
                }
                vou.updateAttribute('updatedAt', moment().valueOf());
            }
        }
        res.end();
    });

    router.post('/voucher_login', async (req, res, cb) => {
        const params = req.body;
        let err;
        const vou = await Voucher.findOne({ where: { code: params.voucher } });
        let mac = req.query.m;
        let locationId = req.query.li;
        if (vou) {
            if (mac.indexOf('-')) {
                mac = mac.split('-').join(':');
            }
            if (vou.expiredAt && moment().valueOf() > vou.expiredAt) {
                err = 'VOUCHER_EXPIRED';
            } else if (vou.quota && vou.current && !vou.current[mac] && lodash.size(vou.current) >= vou.quota) {
                err = 'VOUCHER_MAXUSER';
            } else if (vou.loggedIn && vou.loggedIn[mac] && vou.byte > 0 && vou.loggedIn[mac].totalData >= (vou.byte * 1024 * 1024)) {
                err = 'VOUCHER_MAXDATA';
            }
        } else {
            err = 'VOUCHER_INVALID';
        }
        if (err) {
            res.redirect(`/loginFailed?error=${encodeURIComponent(err)}&referral=${encodeURIComponent(req.headers.referer)}`);
        } else {
            if (!vou.current) { vou.current = {}; }
            if (!vou.loggedIn) { vou.loggedIn = {}; }
            if (!vou.loggedIn[mac]) { vou.loggedIn[mac] = { totalData:0, history: [] }; }
            vou.loggedIn[mac].history.push({ action: 'login', time: moment().valueOf(), locationId });
            vou.current[mac] = 1;
            vou.updateAttribute('loggedIn', vou.loggedIn);
            vou.updateAttribute('current', vou.current);
            if (!vou.status) {
                if (!vou.expiredAt) {
                    vou.updateAttribute('expiredAt', vou.expireTime + moment().valueOf());
                }
                vou.updateAttribute('status', 1);
            }
            vou.updateAttribute('updatedAt', moment().valueOf());

            // return login
                allowCrossOrigin(res);
                // res.header('Content-Type', 'text/html');
                // res.header('Access-Control-Request-Headers', 'text/html');
                // res.send('<!doctype html><html>'+
                // '<head>'+
                // '<meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>WiFiEX4U</title>'+
                // '</head>'+
                // '<body style="text-align: center; padding-top: 30px;">'+
                // '<h4 style="color: red;">Đăng nhập thành công</h4>'+
                // '<form name="formLogin" style="display: none" action="loginurl" method="POST">'+
                // '<input type="hidden" id="usr" name="username" value="0">'+
                // '<input type="hidden" id="pswrd" name="password" value="0">'+
                // '<input type="hidden" name="userurl"></input>'+
                // '<input type="hidden" name="redirect"></input>'+
                // '</form>'+
                // '<script type="text/javascript">'+
                // '"use strict";'+
                // 'var formLogin = document.formLogin;'+
                // 'formLogin.action="'+params.loginurl+'";'+
                // 'formLogin.elements.userurl.value="'+(params.userurl||'')+'";'+
                // 'formLogin.elements.redirect.value="'+(params.userurl||'')+'";'+
                // 'formLogin.submit();'+
                // '</script>'+
                // '</body></html>');
            res.redirect(params.userurl);
        }
        res.end();
    });

    router.post('/voucherLogout', async (req, res, cb) => {
        const usr = await User.findOne({ where: { id: req.body.clientId, clientkey: req.body.clientKey } });
        let err, limit = {};
        if (!req.body.clientId || !req.body.clientKey || !usr) {
            res.status(500);
            res.send('CREDENTIALS_NOT_VALID');
        } else {
            const vou = await Voucher.findOne({ where: { code: req.body.voucher } });
            if (vou) {
                let mac = req.body.mac;
                if (mac.indexOf('-')) {
                    mac = mac.split('-').join(':');
                }
                const currentSession = vou.current || {};
                const loginSessions = vou.loggedIn || {};
                if (currentSession[mac]) {
                    delete currentSession[mac];
                    vou.updateAttribute('current', currentSession);
                }
                if (loginSessions[mac] && loginSessions[mac].history) {
                    loginSessions[mac].totalData += req.body.totalData;
                    loginSessions[mac].history.push({ action: 'logout', time: moment().valueOf() });
                    vou.updateAttribute('loggedIn', loginSessions);
                }
                if (vou.makeSurvey) {
                    const esDeviceConn = Device.getDataSource().connector;
                    const esDeviceDb = esDeviceConn.db;
                    Promise.promisify(esDeviceDb.bulk).call(esDeviceDb, {
                        index: esDeviceConn.searchIndex,
                        type: Device.modelName,
                        body: [
                            { update: { _id: Device.toId(mac) } },
                            { script: { inline: 'ctx._source.remove("voucher")' } }
                        ]
                    });
                }
            } else {
                err = 'VOUCHER_INVALID';
            }
            if (err) {
                res.status(500);
                res.send(err);
            }
        }
        res.end();
    });

    router.get('/loginFailed', (req, res) => {
        const errHash = {
            VOUCHER_INVALID: 'Voucher không tồn tại!',
            VOUCHER_EXPIRED: 'Voucher đã hết hạn!',
            VOUCHER_MAXUSER: 'Mã Voucher này đã vượt quá số lượng thiết bị sử dụng, vui lòng sử dụng mã khác!',
            VOUCHER_MAXDATA: 'Voucher đã hết dung lượng sử dụng!'
        };
        const params = req.query;
        const errorMess = errHash[params.error] || params.error;
        allowCrossOrigin(res);
        res.header('Content-Type', 'text/html');
        res.header('Access-Control-Request-Headers', 'text/html');
        res.send(`${'<!doctype html><html>' +
        '<head>' +
        '<meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>WiFiEX4U</title>' +
        '</head>' +
        '<body style="text-align: center; padding-top: 30px;">' +
        '<script type="text/javascript">' +
        '"use strict";' +
        'function goBack(){var backLink = "'}${params.referral}";if(backLink){window.location.href = backLink;} else {window.history.back()}}` +
        'var counter = 10;var intervalCount = setInterval(function(){counter-=1;document.getElementById("counter").innerHTML = counter;if(counter<1){goBack();clearInterval(intervalCount)}}, 1000)' +
        '</script>' +
        `<h4 style="color: red;">${errorMess}</h4>` +
        '<h5>Tự động quay lại trang đăng nhập sau <span id="counter">10</span></h5>' +
        '<button onclick="goBack()">Quay lại ngay</button>' +
        '</body></html>');
        res.end();
    });

    router.get('/alert.html', async (req, res) => {
        const banners = await Banner.find({ where: { alertBanner: true }, order: 'updatedAt DESC' });
        allowCrossOrigin(res);
        res.header('Content-Type', 'text/html');
        res.header('Access-Control-Request-Headers', 'text/html');
        res.header('X-Frame-Options', 'ALLOW-FROM SAMEORIGIN');
        if (banners.length) {
            res.send(embedCodeHtml(banners[0]));
        } else {
            res.send('<!doctype html><html>' +
            '<head>' +
            '<meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>WiFiEX4U</title>' +
            '</head>' +
            '<body style="text-align: center; padding-top: 30px;">' +
            '<h4 style="color: red;">Not found any alert banner!</h4>' +
            '</body></html>');
        }
        res.end();
    });

    router.get('/portal', async (req, res) => {
        const params = req.query;
        const redirectUrl = params.redirect || 'http://genexwifi.com';
        if (params.type === 'wait') {
            res.header('Content-Type', 'text/html');
            res.header('Access-Control-Request-Headers', 'text/html');
            res.send(`<!DOCTYPE html><html><head lang="en"><meta name="viewport" content="width=device-widthinitial-scale=1maximum-scale=1"><meta charset="UTF-8"><title>Genex Wifi</title><style>html{height:100%;background:#fff}body{padding:0;margin:0}.center{text-align:center}@keyframes offset{100%{stroke-dashoffset:0}}#container{display:flex;align-items:center;justify-content:center;margin-top:20px;margin-bottom:20px}figure{margin:1rem!important}@media screen and (max-width:999px){.landscape img{height:auto;width:50%}.landscape p{font-size:20px}.landscape #percentage{top:5px}.landscape #connecting{font-size:20px}.portrait img{height:auto;width:70%}.portrait p{font-size:20px}}img.logo{height:auto;width:200px}@media screen and (min-width:1000px){p{font-size:25px}}</style></head><body class="portrait"><p style="display:none">Success</p><div style="text-align:center;padding-top:20px"><img id="logo" src="${loadingLogo}" width="300"></div><div style="text-align:center"><p style="font-weight:700">Vui lòng đợi trong giây lát...</p></div><script>"use strict";setInterval(function(){window.innerWidth<1e3&&window.innerWidth>window.innerHeight?document.body.className="landscape":document.body.className="portrait"},200);var redirectUrl="${redirectUrl}",image=new Image,time=new Date,imgSrc="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_120x44dp.png?version=("+time.getTime()+")";image.src=imgSrc;var intervalOnline=setInterval(function(){image.complete&&image.naturalWidth&&(window.location.href=redirectUrl)},500),intervalImg=setInterval(function(){image.src="null",image.src=imgSrc},2e3);</script></body></html>`);
        } else {
            const loadingLogo = params.loadingLogo || LOGO_LOADING;
            res.header('Content-Type', 'text/html');
            res.header('Access-Control-Request-Headers', 'text/html');
            res.send(`<!DOCTYPE html><html><head lang="en"><meta name="viewport" content="width=device-widthinitial-scale=1maximum-scale=1"><meta charset="UTF-8"><title>Genex Wifi</title><style>html{height:100%;background:#fff}body{padding:0;margin:0}.center{text-align:center}@keyframes offset{100%{stroke-dashoffset:0}}#container{display:flex;align-items:center;justify-content:center;margin-top:20px;margin-bottom:20px}figure{margin:1rem!important}@media screen and (max-width:999px){.landscape img{height:auto;width:50%}.landscape p{font-size:20px}.landscape #percentage{top:5px}.landscape #connecting{font-size:20px}.portrait img{height:auto;width:70%}.portrait p{font-size:20px}}img.logo{height:auto;width:200px}@media screen and (min-width:1000px){p{font-size:25px}}</style></head><body class="portrait"><p style="display:none">Success</p><div style="text-align:center;padding-top:20px"><img id="logo" src="${loadingLogo}" width="300"></div><div style="text-align:center"><p style="font-weight:700">Vui lòng đợi trong giây lát...</p></div><script>"use strict";setInterval(function(){window.innerWidth<1e3&&window.innerWidth>window.innerHeight?document.body.className="landscape":document.body.className="portrait"},200);var redirectUrl="${redirectUrl}",image=new Image,time=new Date,imgSrc="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_120x44dp.png?version=("+time.getTime()+")";image.src=imgSrc;var intervalOnline=setInterval(function(){image.complete&&image.naturalWidth&&(window.location.href=redirectUrl)},500),intervalImg=setInterval(function(){image.src="null",image.src=imgSrc},2e3);</script></body></html>`);
        }
    });

    router.get('/tracking-click-analyze', async (req, res) => {
        console.log('req.headers.referer', req.headers.referer); // https://cloud.kaimedia.org/api/common/5e6517f68491f17f2fe1e074/externalType/ruckus?nbiIP=103.136.114.26&client_mac=60:83:73:2B:68:A4&domain_name=Administration+Domain&reason=Un-Auth-Captive&wlanName=NamA+Staff&dn=scg.ruckuswireless.com&ssid=NamA+Staff&mac=54:ec:2f:3c:c7:60&url=http%3A%2F%2Fcaptive.apple.com%2Fhotspot-detect.html&proxy=0&vlan=3&wlan=9&sip=scg.ruckuswireless.com&zoneName=dVwCJOftWsovEpkfuqJ7RsKox3AVPTckfpWbRi0OfZc_1584701495760&apip=192.168.0.161&sshTunnelStatus=1&uip=192.168.200.195&StartURL=https%3A%2F%cloud.kaimedia.org%2Ftracking-click-analyze
        const params = req.query;
        const esCon = Tracking.getDataSource().connector;
        const esDb = esCon.db;
        const body = {
            query: {
                range: {
                createdAt: {
                    gte: Number(params.gte) || moment().startOf('day').valueOf(),
                    lte: Number(params.lte) || moment().endOf('day').valueOf()
                }
                }
            },
            size: 0,
            aggs: {
                listMac: {
                    terms: { field: 'mac', size: 2000 },
                    aggs: {
                        actions: {
                            nested: { path: 'actions' },
                            aggs: { action: { terms: { field: 'actions.action', size: 3 } } }
                        }
                    }
                }
            }
        };
        const data = await Promise.promisify(esDb.search).call(esDb, {
            index: esCon.searchIndex,
            type: Tracking.modelName,
            body
        });
        let click = 0;
        let impress = 0;
        const warningList = [];
        data.aggregations.listMac.buckets.forEach((perMac) => {
            click = 0;
            impress = 0;
            perMac.actions.action.buckets.forEach((act) => {
                if (act.key === 'impression') impress = act.doc_count;
                if (act.key === 'click') click = act.doc_count;
            });
            if (click > impress) warningList.push({ mac: perMac.key, click: Number(click), impress: Number(impress) });
        });
        if (params.clear && warningList.length) {
            await Promise.promisify(esDb.deleteByQuery).call(esDb, {
                index: esCon.searchIndex,
                type: Tracking.modelName,
                body: {
                    query: {
                        bool: {
                            must: [{ terms: { mac: warningList.map(item => item.mac) } }],
                            filter: [{ range: { createdAt: { gte: Number(params.gte) || moment().startOf('day').valueOf(), lte: Number(params.lte) || moment().endOf('day').valueOf() } } }]
                        }
                    }
                },
                fields: null,
                stored_fields: 'id'
            });
        }
        res.header('Content-Type', 'application/json');
        res.send(warningList.length);
    });

    router.get('/wifitracking', async (req, res) => {
        const params = req.query;
        if (!params.sessionid) {
            res.status(401);
            return res.send('Need sessionid');
        }
        res.header('Content-Type', 'application/json');
        const findSession = await SessionCached.findById(params.sessionid);
        console.log('/wifitracking', findSession);
        if (findSession && findSession.id) {
            return res.send(JSON.parse(findSession.redirect));
        }
        return res.send({});
    });

    router.post('/wifitracking', async (req, res) => {
        const params = req.body;
        fs.appendFile(`/home/${HOME_FOLDER}/wifitrackinglog/request.log`, `${moment().format('MMM DD, HH:mm:ss')} | ${params.sessionid} | ${JSON.stringify(params)} \n`, (err) => {
            if (err) console.log('write file err', err);
        });
        if (!params.sessionid) {
            res.status(401);
            return res.send('Need sessionid');
        }
        if (params.mac) {
            await SessionCached.upsert({
                id: params.sessionid,
                redirect: JSON.stringify(params)
            });
            return res.send('OK');
        }
        res.header('Content-Type', 'application/json');
        const findSession = await SessionCached.findById(params.sessionid);
        return res.send(findSession || {});
    });

    router.post('/report_usage', async (req, res) =>
        axios.post(`${server.get('reportUsageURL')}/api/v1/report-list`, req.body || {})
        .then(rep => res.send(rep.data))
    );

    router.post('/export_usage', async (req, res) =>
        axios.post(`${server.get('reportUsageURL')}/api/v1/export-report-list`, req.body || {})
        .then(rep => res.send(rep.data))
    );

    router.post('/report_usage_analytic', async (req, res) =>
        axios.post(`${server.get('reportUsageURL')}/api/v1/analytic`, req.body || {})
        .then(rep => res.send(rep.data))
    );

    server.use(router);
};
