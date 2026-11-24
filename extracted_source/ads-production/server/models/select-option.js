const { ObjectId } = require('mongodb').ObjectID;
const axios = require('axios');
const https = require('https');
const lodash = require('lodash');
const mysql = require('mysql');
const fs = require('fs');
const moment = require('moment');
const {
    extractDeviceOptions,
    standardizeMacAddress,
    standardizeMacAddressCNA,
    standardizeURL
} = require('../import/utils');
const { allowCrossOrigin } = require('../import/access-utils');
const { isRulesMatch } = require('../import/banner-util');

const pool = mysql.createPool({
    multipleStatements: true,
    connectionLimit: 50,
    host: 'localhost',
    user: 'root',
    password: 'Genexwifi@2022', // wifiex4udb123qwe!@#
    database: 'radius'
});
module.exports = (SelectOption) => {
    SelectOption.CITY = 'city';
    SelectOption.LOCATION_CATEGORY = 'location_category';
    SelectOption.CAMPAIGN_CATEGORY = 'campaign_category';
    SelectOption.OS_CATEGORY = 'os_category';
    SelectOption.AGE_CATEGORY = 'age_category';
    SelectOption.DEVICE_CATEGORY = 'device_category';
    SelectOption.GENDER_CATEGORY = 'gender_category';
    SelectOption.INCOME_CATEGORY = 'income_category';
    SelectOption.TRACKING_ACTION = 'tracking_action';

    SelectOption.disableRemoteMethodByName('count');
    SelectOption.disableRemoteMethodByName('createChangeStream');
    SelectOption.defineProperty('createdBy', { type: ObjectId, require: true });

    SelectOption.observe('before save', (ctx, next) => {
        const data = ctx.instance || ctx.data;
        if (data && data.options) {
            delete data.options.currentContext;
            if (data.options && (data.options.hotspotType === 'aerohive' || data.options.hotspotType === 'mikrotik' || data.options.hotspotType === 'ruckus_cloud' || data.options.hotspotType === 'draytek') && data.aerohive && data.aerohive.sessionTimeout && data.aerohive.idleTimeout) {
                pool.getConnection((err, connection) => {
                    connection.query(`SELECT radcheck.id, radcheck.username, radreply.id as attId, radreply.attribute, radreply.value FROM radcheck LEFT JOIN radreply ON radcheck.username = radreply.username WHERE radcheck.username='${data.id}'`, (error, result) => {
                        let queries = '';
                        if (result && result.length) {
                            result.forEach((item) => {
                                switch (item.attribute) {
                                    case 'Session-Timeout':
                                        queries += `UPDATE radreply SET value='${data.aerohive.sessionTimeout}' WHERE id=${item.attId}; `;
                                        break;
                                    case 'Idle-Timeout':
                                        queries += `UPDATE radreply SET value='${data.aerohive.idleTimeout}' WHERE id=${item.attId}; `;
                                        break;
                                    case 'Mikrotik-Rate-Limit':
                                        queries += `UPDATE radreply SET value='${data.aerohive.mikrotikRateLimit || 0}' WHERE id=${item.attId}; `;
                                        break;
                                    default:
                                }
                            });
                        } else {
                            queries += `INSERT INTO radcheck (username, attribute, op, value) VALUES ('${data.id}', 'Cleartext-Password', ':=', '${data.id}'); `;
                            queries += `INSERT INTO radreply (username, attribute, value) VALUES ('${data.id}', 'Idle-Timeout', '${data.aerohive.idleTimeout}'); `;
                            queries += `INSERT INTO radreply (username, attribute, value) VALUES ('${data.id}', 'Session-Timeout', '${data.aerohive.sessionTimeout}'); `;
                            queries += `INSERT INTO radreply (username, attribute, value) VALUES ('${data.id}', 'Mikrotik-Rate-Limit', '${data.aerohive.mikrotikRateLimit || 0}');`;
                        }
                        connection.query(queries, () => {
                            connection.release();
                        });
                    });
                });
                if (data.options.locationConfig && lodash.size(data.options.locationConfig)) {
                    lodash.forEach(data.options.locationConfig, (info, id) => {
                        pool.getConnection((err, connection) => {
                            if (info.sessionTimeout || info.idleTimeout) {
                                connection.query(`SELECT radcheck.id, radcheck.username, radreply.id as attId, radreply.attribute, radreply.value FROM radcheck LEFT JOIN radreply ON radcheck.username = radreply.username WHERE radcheck.username='${id}'`, (err, result) => {
                                    let queriesLocation = '';
                                    if (result && result.length) {
                                        result.forEach((item) => {
                                            queriesLocation += `UPDATE radreply SET value='${item.attribute === 'Session-Timeout' ? info.sessionTimeout : info.idleTimeout}' WHERE id=${item.attId}; `;
                                        });
                                    } else {
                                        queriesLocation += `INSERT INTO radcheck (username, attribute, op, value) VALUES ('${id}', 'Cleartext-Password', ':=', '${id}'); `;
                                        queriesLocation += `INSERT INTO radreply (username, attribute, value) VALUES ('${id}', 'Idle-Timeout', '${info.idleTimeout}'); `;
                                        queriesLocation += `INSERT INTO radreply (username, attribute, value) VALUES ('${id}', 'Session-Timeout', '${info.sessionTimeout}')`;
                                    }
                                    connection.query(queriesLocation, () => {
                                        connection.release();
                                    });
                                });
                            } else {
                                connection.query(`DELETE FROM radcheck WHERE username='${id}'; DELETE FROM radreply WHERE username='${id}'`, function (errMany) {
                                    connection.release();
                                });
                            }
                        });
                    });
                }
            }
        }
        next();
    });
    SelectOption.cacheUnifiCookie = {};

    SelectOption.getExternalUrl = (locationGroupId, type, res) =>
        SelectOption.findById(locationGroupId).then((group) => {
            if (!group) {
                return res.invalidRequest();
            }
            const app = SelectOption.app;
            if (group.options && type === 'mikrotik') {
                const baseHtml = `<html>\n<head>\n<meta http-equiv=\\"refresh\\" content=\\"0; url=${app.get('appScheme')}//${app.get('appHostName')}/api/common/${locationGroupId}/externalType/mikrotik/?ap=$mac&mac=\\$(mac)&client_ip=\\$(ip)&userurl=\\$(link-orig)&login_url=\\$(link-login-only)\\" /><meta http-equiv=\\"pragma\\" content=\\"no-cache\\">\n<meta http-equiv=\\"expires\\" content=\\"-1\\">\n</head>\n</html>`;
                return {
                    jsCode: `:local mac [interface ethernet get ether1 mac-address];\n/file set "hotspot/login.html" contents="${baseHtml}"`
                };
            }
            if (group.options && type === 'aerohive') {
                return {
                    jsCode: `${app.get('appScheme')}//${app.get('appHostName')}/api/common/${locationGroupId}/externalType/aerohive`,
                    successUrl: `${app.get('appScheme')}//${app.get('appHostName')}/api/common/${locationGroupId}/externalType/successAerohive`
                };
            }
            if (group.options && type === 'extreme') {
                return {
                    jsCode: `${app.get('appScheme')}//${app.get('appHostName')}/api/common/${locationGroupId}/externalType/extreme?case=login&client_mac=WING_TAG_CLIENT_MAC&ap_mac=WING_TAG_AP_MAC`,
                    options: {
                        agree: `${app.get('appScheme')}//${app.get('appHostName')}/api/common/${locationGroupId}/externalType/extreme?case=agree&client_mac=WING_TAG_CLIENT_MAC&ap_mac=WING_TAG_AP_MAC`,
                        welcome: `${app.get('appScheme')}//${app.get('appHostName')}/api/common/${locationGroupId}/externalType/extreme?case=welcome&client_mac=WING_TAG_CLIENT_MAC&ap_mac=WING_TAG_AP_MAC`,
                        fail: `${app.get('appScheme')}//${app.get('appHostName')}/api/common/${locationGroupId}/externalType/extreme?case=fail&client_mac=WING_TAG_CLIENT_MAC&ap_mac=WING_TAG_AP_MAC`,
                        noService: `${app.get('appScheme')}//${app.get('appHostName')}/api/common/${locationGroupId}/externalType/extreme?case=noService&client_mac=WING_TAG_CLIENT_MAC&ap_mac=WING_TAG_AP_MAC`,
                        reg: `${app.get('appScheme')}//${app.get('appHostName')}/api/common/${locationGroupId}/externalType/extreme?case=reg&client_mac=WING_TAG_CLIENT_MAC&ap_mac=WING_TAG_AP_MAC`
                    }
                };
            }
            if (group.options && type === 'ruijie') {
                return { jsCode: `${app.get('appScheme')}//${app.get('appHostName')}/api/common/${locationGroupId}/captiveRuijie` };
            }
            if (group.options && type === 'ruijieGateway') {
                return { jsCode: `${app.get('appScheme')}//${app.get('appHostName')}/api/common/${locationGroupId}/captiveRuijie/login` };
            }
            if (group.options && ['engenius', 'tplink', 'ruckus', 'ruckus_cloud', 'ruckus_alone', 'ruckus_hotzone', 'aruba', 'aruba_mobility', 'meraki_cloud', 'chillispot', 'cisco_wlc', 'zyxelNebula', 'draytek'].indexOf(type) > -1) {
                return { jsCode: `${app.get('appScheme')}//${app.get('appHostName')}/api/common/${locationGroupId}/externalType/${type}` };
            }
            return { jsCode: `${app.get('appScheme')}//${app.get('appHostName')}/api/common/${locationGroupId}/externalGroup` };
        });

    SelectOption.remoteMethod('getExternalUrl', {
        description: 'Return js tracking code',
        accepts: [
            { arg: 'id', type: 'string', description: 'Location Group ID' },
            { arg: 'type', type: 'string', description: 'Hotspot Type' },
            { arg: 'res', type: 'object', http: { source: 'res' } },
        ],
        http: { verb: 'get', path: '/:id/tracking-code' },
        returns: [{ arg: 'body', type: 'object', root: true }],
    });

    SelectOption.verifyUnifiLogin = async (baseUrl, username, password) => {
        let reason;
        try {
            let postLogin = await axios.post(
                '/api/login',
                { username, password },
                {
                    baseURL: baseUrl,
                    headers: { 'Content-Type': 'application/json' },
                    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                    withCredentials: true
                },
            );
            if (postLogin.status === 400 && postLogin.statusText === 'OK') {
                reason = '';
            }
        } catch (e) {
            console.log('post Unifi Login failed');
            if (e.response) {
                reason = 'Username or password incorrect!';
            } else {
                reason = 'Base Url incorrect!';
            }
        }
        return reason;
    };

    SelectOption.remoteMethod('verifyUnifiLogin', {
        description: 'Verify unifi login info',
        accepts: [
            { arg: 'baseUrl', type: 'string', description: 'baseUrl' },
            { arg: 'username', type: 'string', description: 'username' },
            { arg: 'password', type: 'string', description: 'password' },
        ],
        http: { verb: 'get', path: '/verifyUnifiLogin' },
        returns: [{ arg: 'reason', type: 'string' }],
    });

    const getJsonFromUrl = (search) => {
        let query = search.substr(1);
        let result = {};
        // console.log('getJsonFromUrl', query);
        let decodeString = query;
        try {
            decodeString = decodeURIComponent(query);
        } catch (err) {
            console.log('string decoded', decodeString);
        }
        decodeString.split('&').forEach((part) => {
            let item = part.split('=');
            try {
                result[item[0]] = decodeURIComponent(item[1]);
            } catch (err) {
                console.log('variable decoded', item[0], item[1]);
                result[item[0]] = item[1];
            }
        });
        return result;
    };

    const getJsonFromUrlOne = (search) => {
        let query = search.substr(1);
        let result = {};
        console.log('getJsonFromUrl', query);
        let decodeString = query;
        decodeString.split('&').forEach((part) => {
            let item = part.split('=');
            try {
                result[item[0]] = decodeURIComponent(item[1]);
            } catch (err) {
                console.log('variable decoded', item[0], item[1]);
                result[item[0]] = item[1];
            }
        });
        return result;
    };
    const generateHtml = (id, paramsString) => {
        const app = SelectOption.app;
        return `${'<!doctype html><html>' +
            '<head><meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>Genex Wifi</title></head>' +
            '<body>' +
            '<script type="text/javascript">' +
            '"use strict";function getJsonFromUrl(){var o=location.search.substr(1),e={},c=o;try{c=decodeURIComponent(o)}catch(o){console.log("string decoded",c)}return c.split("&").forEach(function(o){var c=o.split("=");try{e[c[0]]=decodeURIComponent(c[1])}catch(o){console.log("variable decoded",c[0],c[1]),e[c[0]]=c[1]}}),e}' +
            'function getQueryVariable(r){for(var t=window.location.search.substring(1).split(/[?&]/),n=0;n<t.length;n++){var e=t[n].split("=");if(e[0]==r)return"Qv"==e[0]?t[n].substr(3,t[n].length):e[1]}return""}' +
            'var params = getJsonFromUrl();params.locationId="'}${id}";${paramsString 
            }!function (e, a, t) {var l = function l() {M.init(params), M.loadAd();};if (!e.getElementById(t)) {var c = e.getElementsByTagName(a)[0],o = e.createElement(a);o.src = "${app.get('appScheme')}//${app.get('appHostName')}/lib/m-sdk@latest.min.js", o.id = t, o.onload = l, c.parentNode.insertBefore(o, c);}}(document, "script", "m-jssdk");` +
            `</script>` +
            `</body></html>`;
    };
    const generateHtmlAutologin = () => {
        return '<!doctype html><html>' +
            '<head><meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>Genex Wifi</title></head>' +
            '<body style="text-align: center; padding-top: 30px;">' +
            '<h5>Waiting for redirect to splashpage...' +
            '<script type="text/javascript">' +
            '"use strict";function getJsonFromUrl(){var o=location.search.substr(1),e={},c=o;try{c=decodeURIComponent(o)}catch(o){console.log("string decoded",c)}return c.split("&").forEach(function(o){var c=o.split("=");try{e[c[0]]=decodeURIComponent(c[1])}catch(o){console.log("variable decoded",c[0],c[1]),e[c[0]]=c[1]}}),e}' +
            'function getQueryVariable(r){for(var t=window.location.search.substring(1).split(/[?&]/),n=0;n<t.length;n++){var e=t[n].split("=");if(e[0]==r)return"Qv"==e[0]?t[n].substr(3,t[n].length):e[1]}return""}' +
            'var params = getJsonFromUrl();' +
            'var formLogEng = document.createElement("form");formLogEng.setAttribute("method", "POST");formLogEng.setAttribute("name", "formLogin");formLogEng.setAttribute("action", params.loginurl);' +
            'var iusr = document.createElement("input");iusr.setAttribute("type", "hidden");iusr.setAttribute("name", "username");' +
            'var ipswrd = document.createElement("input");ipswrd.setAttribute("type", "hidden");ipswrd.setAttribute("name", "password");' +
            'var iUserurl = document.createElement("input");iUserurl.setAttribute("type", "hidden");iUserurl.setAttribute("name", "userurl");' +
            'formLogEng.appendChild(iusr);formLogEng.appendChild(ipswrd);formLogEng.appendChild(iUserurl);document.getElementsByTagName("body")[0].appendChild(formLogEng);' +
            'formLogEng.elements.username.value = "0";formLogEng.elements.password.value = "0";' +
            'formLogEng.elements.userurl.value = encodeURIComponent(location.href.replace("externalType/engenius_extend", "externalGroup"));' +
            'setTimeout(function() { formLogEng.submit(); }, 2000);' +
            '</script>' +
            '</body></html>';
    };

    SelectOption.externalGroup = (id, req, res, cb) => {
        SelectOption.findById(id).then((group) => {
            if (!group) {
                res.send('Location Group not found');
                cb();
                return;
            }
            if (!req._parsedUrl.search) {
                res.send('Query Params is required');
                cb();
                return;
            }
            let params = getJsonFromUrl(req._parsedUrl.search);
            let { APMap } = SelectOption.app.models;
            let mac = params.called || params["ap_mac"];
            APMap.find({ where: { or: [{ macLan: standardizeMacAddress(mac) }, { mac: standardizeMacAddress(mac) }, { mac5: standardizeMacAddress(mac) }] } }).then((apMaps) => {
                res.header('Content-Type', 'text/html');
                res.header('X-Frame-Options', 'ALLOWALL');
                res.header('Access-Control-Allow-Methods', 'GET');
                res.header('Access-Control-Allow-Credentials', 'true');
                res.header('Access-Control-Allow-Origin', '*');
                if (!apMaps.length) {
                    console.log('ap not in system', mac);
                    res.send(`${'<!doctype html><html>' +
                        '<head><meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>Genex Wifi</title></head>' +
                        '<body style="text-align: center; padding-top: 30px;">' +
                        '<h4 style="color: red;">Access point on which you’re accessing then doesn’t exist on the system!</h4>' +
                        '<h5>Please contact Administrator to have the support.</h5>' +
                        '<p>MAC Address: '}${mac}</p>` +
                        `</body></html>`);
                } else if (apMaps[0].status) {
                    let paramsString = '';
                    paramsString += 'params.ap_type = "engenius";';
                    paramsString += 'params.redirect_param = "userurl";';
                    paramsString += 'params.loginurl = params["loginurl"] || params["userurl"] || params["actionurl"] || "";';
                    paramsString += 'params.ap = params["called"] || params["ap_mac"] || "";';
                    paramsString += 'params.macFieldName = params["mac"] || params["client_mac"] || "";';
                    res.send(generateHtml(apMaps[0].locationId, paramsString));
                } else {
                    res.send(`${'<!doctype html><html>' +
                        '<head><meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>Genex Wifi</title></head>' +
                        '<body style="text-align: center; padding-top: 30px;">' +
                        '<h4 style="color: red;">Access point on which you’re accessing then temporarily suspend!</h4>' +
                        '<h5>Please contact Administrator to have the support.</h5>' +
                        '<p>MAC Address: '}${mac}</p>` +
                        `</body></html>`);
                }
            });
        });
    };
    SelectOption.remoteMethod('externalGroup', {
        accepts: [
            { arg: 'id', type: 'string', required: true },
            { arg: 'req', type: 'object', http: { source: 'req' } },
            { arg: 'res', type: 'object', http: { source: 'res' } }
        ],
        http: { path: '/:id/externalGroup/', verb: 'get' }
    });

    const getMatchedCampaign = (campaigns, locationId, device) =>
        campaigns.filter((campaign) => {
            if (campaign.kpi && campaign.click && campaign.click >= campaign.kpi) {
                return false;
            }
            if (
                campaign.kpiPerDay &&
                campaign.clickToday &&
                campaign.clickToday >= campaign.kpiPerDay
            ) {
                return false;
            }
            if (
                campaign.audience &&
                Array.isArray(campaign.audience) &&
                device.frequencyData &&
                device.frequencyData[campaign.campaignId]
            ) {
                device.frequency = convertFrequency(device.frequencyData, campaign.campaignId, locationId);
            }
            device.visitTime = device.frequencyData && device.frequencyData[campaign.campaignId] ? device.frequencyData[campaign.campaignId].total : 0;
            device.visitTime = String(device.visitTime);
            if (
                campaign.audience &&
                Array.isArray(campaign.audience) &&
                !isRulesMatch(campaign.audience, device)
            ) {
                return false;
            }

            return true;
        });
    const pickCampaign = async (location, device) => {
        const campaigns = location.activeCampaigns || [];
        if (!campaigns.length) {
            return Promise.reject({ message: 'No active campaign', statusCode: 400 });
        }

        let filteredCampaigns = campaigns;
        filteredCampaigns = getMatchedCampaign(filteredCampaigns, location.id, device);
        const { CampaignCached } = SelectOption.app.models;
        const campaign = await CampaignCached.findById(
            filteredCampaigns[0].campaignId,
        );

        return campaign;
    };
    const convertFrequency = (data, campaignId, locationId) => {
        let result = [];
        if (data[campaignId].total) {
            if (data[campaignId].total < 10) {
                result.push('10');
                if (data[campaignId].total < 6) {
                    result.push('6');
                    if (data[campaignId].total < 2) {
                        result.push('2');
                    }
                }
            }
        }
        if (data[campaignId][locationId]) {
            if (data[campaignId].total < 10) {
                result.push('100');
                if (data[campaignId].total < 6) {
                    result.push('60');
                    if (data[campaignId].total < 2) {
                        result.push('20');
                    }
                }
            }
        }
        return result;
    };

    const processRuckusCloud = async (params, headerData, locationId, res) => {
        let paramsString = '';
        try {
            const getMacData = await axios.post(
                `https://${params.sip}:443/portalintf`,
                {
                    Vendor: 'ruckus',
                    RequestPassword: params.integrateKey,
                    APIVersion: '1.0',
                    RequestCategory: 'GetConfig',
                    RequestType: 'Decrypt',
                    Data: params.client_mac
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    httpsAgent: new https.Agent({ rejectUnauthorized: false })
                }
            );
            if (getMacData.data) {
                paramsString += 'params.ap_type = "ruckus_cloud";';
                paramsString += 'params.redirect_param = "url";';
                paramsString += `params.loginurl = "https://${params.sip}:443/portalintf";`;
                paramsString += `params.ap = "${params.mac}";`;
                paramsString += `params.macFieldName = "${standardizeMacAddressCNA(getMacData.data.Data)}";`;

                res.send(generateHtml(locationId, paramsString, headerData));
            } else {
                console.log('GET_RUCKUS_DATA->>>>>not have data', getMacData);
            }
        } catch (e) {
            console.log('GET_RUCKUS_DATA->>>>>error', e);
        }
    };

    SelectOption.externalType = (id, type, req, res, cb) => {
        SelectOption.findById(id).then((group) => {
            if (!group) {
                res.send('Location Group not found');
                cb();
                return;
            }
            let params = {};
            let mac;
            const { APMap, LocationCached, Device, SessionCached } = SelectOption.app.models;
            if (['successAerohive', 'zyxelNebulaLanding'].indexOf(type) > -1) {
                console.log('____successAerohive', req.headers.referer);
                if (!req.headers.referer) {
                    res.send('Query Params is required');
                    cb();
                    return;
                }
                params = getJsonFromUrl(`?${req.headers.referer.split('?')[1]}`);
                mac = params['Called-Station-Id'] || params.ap;
                mac = standardizeMacAddressCNA(mac);
            } else {
                if (!req._parsedUrl.search) {
                    if (type === 'aruba_mobility' && req.headers.referer) {
                        params = getJsonFromUrl(`?${req.headers.referer.split('?')[1]}`);
                    } else {
                        res.send('Query Params is required');
                        cb();
                        return;
                    }
                } else {
                    params = getJsonFromUrl(req._parsedUrl.search);
                }
                if (type === 'chillispot' && params.res === 'success') {
                    const privateParams = getJsonFromUrlOne(req._parsedUrl.search);
                    console.log('chillispot params', privateParams);
                    SessionCached.findById(Device.toId(standardizeMacAddress(params.mac))).then((sess) => {
                        if (sess && sess.id) {
                            console.log('--->Chillispot click session', standardizeMacAddress(params.mac), JSON.stringify(sess));
                            res.redirect(sess.redirect);
                            sess.destroy();
                        } else {
                            res.redirect('https://cloud.kaimedia.org');
                        }
                    });
                    return;
                }
                // get ap's mac address
                if (type === 'aerohive') {
                    mac = params['Called-Station-Id'];
                    mac = standardizeMacAddressCNA(mac);
                } else if (type === 'engenius_extend' || type === 'engenius' || type === 'chillispot' || type === 'cisco_wlc') {
                    mac = params.called || params.ap_mac;
                    mac = standardizeMacAddress(mac);
                } else if (type === 'aruba' || type === 'aruba_mobility') {
                    mac = standardizeMacAddress(params.apmac || (params.apname && params.apname.indexOf('**') > -1 ? params.apname.split('**')[1] : params.apname));
                } else if (type === 'meraki_cloud') {
                    mac = standardizeMacAddress(params.ap_mac);
                } else if (type === 'tplink' || type === 'mikrotik') {
                    mac = standardizeMacAddressCNA(params.ap);
                } else if (type === 'ruckus' || type === 'ruckus_cloud' || type === 'ruckus_alone') {
                    mac = standardizeMacAddressCNA(params.mac);
                } else if (type === 'ruckus_hotzone') {
                    mac = standardizeMacAddressCNA(params.called);
                } else if (type === 'extreme') {
                    mac = standardizeMacAddressCNA(params.ap_mac);
                } else if (type === 'zyxelNebula' || type === 'draytek') {
                    mac = standardizeMacAddressCNA(params.apmac);
                } else {
                    res.send('Not support this hotspot model!');
                    return;
                }
            }

            APMap.find({ where: { or: [{ macLan: mac }, { mac }, { mac5: mac }] } }).then((apMaps) => {
                allowCrossOrigin(res);
                res.header('Content-Type', 'text/html');
                let paramsString = '';
                if (!apMaps.length) {
                    if ((['successAerohive', 'zyxelNebulaLanding'].indexOf(type) > -1) || (type === 'aruba_mobility' && req.headers.referer)) {
                        res.send(`${'<!doctype html><html>' +
                            '<head><meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>Genex Wifi</title></head>' +
                            '<body style="text-align: center; padding-top: 30px;">' +
                            '<h4 style="color: red;">Access point on which you’re accessing then doesn’t exist on the system!</h4>' +
                            '<h5>Please contact Administrator to have the support.</h5>' +
                            '<p>MAC Address: '}${mac}</p>` +
                            `<p>DATA: ${req.headers.referer}</p>` +
                            `</body></html>`);
                    } else {
                        res.send(`${'<!doctype html><html>' +
                            '<head><meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>Genex Wifi</title></head>' +
                            '<body style="text-align: center; padding-top: 30px;">' +
                            '<h4 style="color: red;">Access point on which you’re accessing then doesn’t exist on the system!</h4>' +
                            '<h5>Please contact Administrator to have the support.</h5>' +
                            '<p>MAC Address: '}${mac}</p>` +
                            `</body></html>`);
                    }
                } else if (apMaps[0].status) {
                    const locationId = apMaps[0].locationId;
                    if (type === 'engenius_extend') {
                        res.send(generateHtmlAutologin());
                    } else if (type === 'engenius') {
                        paramsString += 'params.ap_type = "engenius";';
                        paramsString += 'params.redirect_param = "userurl";';
                        paramsString += `params.loginurl = "${params.loginurl || params.userurl || params.actionurl || '/'}?username=0&password=0";`;
                        paramsString += `params.ap = "${mac}";`;
                        paramsString += `params.macFieldName = "${standardizeMacAddress(params.mac || params.client_mac)}";`;
                        res.send(generateHtml(apMaps[0].locationId, paramsString));
                    } else if (type === 'cisco_wlc') {
                        paramsString += 'params.ap_type = "cisco_wlc";';
                        paramsString += 'params.redirect_param = "redirect_url";';
                        paramsString += `params.loginurl = "${params.switch_url}";`;
                        paramsString += `params.ap = "${mac}";`;
                        paramsString += `params.macFieldName = "${standardizeMacAddress(params.mac || params.client_mac)}";`;
                        res.send(generateHtml(apMaps[0].locationId, paramsString));
                    } else if (type === 'aruba') {
                        paramsString += 'params.ap_type = "aruba";';
                        paramsString += 'params.redirect_param = "url";';
                        paramsString += `params.loginurl = "http://${params.switchip}/swarm.cgi?cmd=authenticate&user=genex&password=genexwifi";`;
                        // paramsString += 'params.loginurl = "https://securelogin.arubanetworks.com/cgi-bin/login?cmd=authenticate&user=genex&password=genexwifi";';
                        paramsString += `params.ap = "${mac}";`;
                        paramsString += `params.macFieldName = "${standardizeMacAddress(params.mac)}";`;
                        res.send(generateHtml(locationId, paramsString));
                    } else if (type === 'aruba_mobility' && req._parsedUrl.search) {
                        paramsString += 'params.ap_type = "aruba_mobility";';
                        paramsString += 'params.redirect_param = "url";';
                        // paramsString += `params.loginurl = "http://${params.switchip}/swarm.cgi?cmd=authenticate&user=genex&password=genexwifi";`;
                        paramsString += 'params.loginurl = "http://securelogin.arubanetworks.com/cgi-bin/login?cmd=authenticate&user=genex&password=genexwifi";';
                        paramsString += `params.ap = "${mac}";`;
                        paramsString += `params.macFieldName = "${standardizeMacAddress(params.mac)}";`;
                        res.send(generateHtml(locationId, paramsString));
                    } else if (type === 'chillispot') {
                        paramsString += 'params.ap_type = "chillispot";';
                        paramsString += 'params.redirect_param = "url";';
                        paramsString += 'params.loginurl = "https://cloud.kaimedia.org/chillispot-login";';
                        paramsString += `params.ap = "${mac}";`;
                        paramsString += `params.macFieldName = "${standardizeMacAddress(params.mac)}";`;
                        res.send(generateHtml(locationId, paramsString));
                    } else if (type === 'tplink') {
                        paramsString += 'params.ap_type = "tplink";';
                        paramsString += 'params.redirect_param = "redirectUrl";';
                        paramsString += `params.loginurl = "http://${params.target}:${params.targetPort}/portal/radius/auth?username=genex&password=genexwifi&clientMac=${params.clientMac}&clientIp=${params.clientIp}&ap=${params.ap}&ssid=${encodeURIComponent(params.ssid)}&radioId=${params.radioId}";`;
                        paramsString += `params.ap = "${mac}";`;
                        paramsString += `params.macFieldName = "${standardizeMacAddressCNA(params.clientMac)}";`;
                        res.send(generateHtml(locationId, paramsString));
                    } else if (type === 'meraki_cloud') {
                        const paramsMeraki = getJsonFromUrlOne(req._parsedUrl.search);
                        const loginMerakiParams = getJsonFromUrlOne(`?${paramsMeraki.login_url.split('?')[1]}`);
                        paramsString += 'params.ap_type = "meraki_cloud";';
                        paramsString += 'params.redirect_param = "continue_url";';
                        paramsString += `params.loginurl = "${params.login_url}${loginMerakiParams.mauth}&username=genex&password=genexwifi";`;
                        paramsString += `params.ap = "${mac}";`;
                        paramsString += `params.macFieldName = "${standardizeMacAddress(params.client_mac)}";`;
                        res.send(generateHtml(locationId, paramsString));
                    } else if (type === 'ruckus') {
                        paramsString += 'params.ap_type = "ruckus";';
                        paramsString += 'params.redirect_param = "url";';
                        paramsString += `params.loginurl = "http://${params.sip}:9997/SubscriberPortal/hotspotlogin?proxy=${params.proxy || ''}&uip=${params.uip}&client_mac=${params.client_mac}&username=genex&password=genexwifi";`;
                        // paramsString += `params.loginurl = "http://${params.sip}:9997/login?proxy=${params.proxy || ''}&uip=${params.uip}&client_mac=${params.client_mac}&username=genex&password=genexwifi";`;
                        paramsString += `params.ap = "${mac}";`;
                        paramsString += `params.macFieldName = "${standardizeMacAddressCNA(params.client_mac)}";`;
                        res.send(generateHtml(locationId, paramsString));
                    } else if (type === 'ruckus_cloud') {
                        params.integrateKey = group.options.integrateKey;
                        processRuckusCloud(params, req.headers['x-forwarded-proto'], locationId, res);
                    } else if (type === 'ruckus_alone') {
                        paramsString += 'params.ap_type = "ruckus_alone";';
                        paramsString += 'params.redirect_param = "url";';
                        // paramsString += 'params.loginurl = "http://' + params.sip + ':9997/SubscriberPortal/hotspotlogin?proxy=' + (params.proxy || '') + '&uip=' + params.uip + '&client_mac=' + params.client_mac + '&username=genex&password=genexwifi";';
                        paramsString += `params.loginurl = "http://${params.sip}:9997/login?${params.proxy ? `proxy=${params.proxy}&` : ''}uip=${params.uip}&client_mac=${params.client_mac}&username=genex&password=genexwifi";`;
                        paramsString += `params.ap = "${mac}";`;
                        paramsString += `params.macFieldName = "${standardizeMacAddressCNA(params.client_mac)}";`;
                        res.send(generateHtml(locationId, paramsString));
                    } else if (type === 'ruckus_hotzone') {
                        paramsString += 'params.ap_type = "ruckus";';
                        paramsString += 'params.redirect_param = "userurl";';
                        // paramsString += 'params.loginurl = "http://' + params.sip + ':9997/SubscriberPortal/hotspotlogin?proxy=' + (params.proxy || '') + '&uip=' + params.uip + '&client_mac=' + params.client_mac + '&username=genex&password=genexwifi";';
                        paramsString += `params.loginurl = "http://${params.uamip}:${params.uamport}/login?mac=${params.mac}&username=genex&password=genexwifi";`;
                        paramsString += `params.ap = "${mac}";`;
                        paramsString += `params.macFieldName = "${standardizeMacAddressCNA(params.mac)}";`;
                        res.send(generateHtml(locationId, paramsString));
                    } else if (type === 'zyxelNebula') {
                        paramsString += 'params.ap_type = "zyxelNebula";';
                        paramsString += 'params.redirect_param = "redirect";';
                        // paramsString += `params.loginurl = "${params.gw_addr}/cgi-bin/Clicktocontinue.cgi";`;
                        paramsString += `params.loginurl = "${params.apurl}";`;
                        paramsString += `params.ap = "${mac}";`;
                        paramsString += `params.macFieldName = "${standardizeMacAddressCNA(params.usermac)}";`;
                        res.send(generateHtml(locationId, paramsString));
                    } else if (type === 'draytek') {
                        paramsString += 'params.ap_type = "draytek";';
                        paramsString += 'params.redirect_param = "target";';
                        paramsString += `params.loginurl = "${params.loginurl}?username=${id}&password=${id}";`;
                        paramsString += `params.ap = "${mac}";`;
                        paramsString += `params.macFieldName = "${standardizeMacAddressCNA(params.client_mac)}";`;
                        res.send(generateHtml(locationId, paramsString));
                    } else if (['successAerohive', 'aruba_mobility'].indexOf(type) > -1) {
                        const deviceMac = standardizeMacAddressCNA(type === 'aruba_mobility' ? params.mac : params.m);
                        Promise.all([
                            LocationCached.findById(params.li || locationId),
                            deviceMac ? Device.findById(Device.toId(deviceMac)) : null
                        ])
                            .spread((location, device) => {
                                location = location && location.toJSON();
                                device = device && device.toJSON();

                                if (!location || !location.id) {
                                    return Promise.reject({
                                        message: 'Location not exists',
                                        statusCode: 400,
                                    });
                                }
                                const deviceOptions = extractDeviceOptions(req.useragent);
                                device = lodash.merge(
                                    { currentLocationId: locationId },
                                    device,
                                    { audience: deviceOptions },
                                );
                                return Promise.all([pickCampaign(location, device)]);
                            })
                            .then(([campaignPick]) => {
                                res.redirect(campaignPick.landingPageUrl);
                            })
                            .catch((errCampaign) => {
                                console.log(errCampaign, 'Pick campaign failed');
                                res.send('Pick campaign failed');
                                cb();
                            });
                    } else if (type === 'extreme') {
                        console.log('extreme case', params.case);
                        switch (params.case) {
                            case 'login':
                            case 'agree':
                                paramsString += 'params.ap_type = "extreme";';
                                paramsString += 'params.redirect_param = "redirectUrl";';
                                paramsString += `params.loginurl = "http://${params.hs_server}:880/cgi-bin/hslogin.cgi";`;
                                paramsString += `params.ap = "${mac}";`;
                                paramsString += `params.macFieldName = "${standardizeMacAddressCNA(params.client_mac)}";`;
                                res.send(generateHtml(locationId, paramsString));
                                break;
                            case 'welcome':
                                Promise.all([
                                    LocationCached.findById(locationId),
                                    mac ? Device.findById(Device.toId(mac)) : null
                                ])
                                    .spread((location, device) => {
                                    location = location && location.toJSON();
                                    device = device && device.toJSON();

                                    if (!location || !location.id) {
                                        return Promise.reject({ message: 'Location not exists', statusCode: 400, });
                                    }
                                    const deviceOptions = extractDeviceOptions(req.useragent);
                                    device = lodash.merge({ currentLocationId: locationId }, device, { audience: deviceOptions });
                                    return Promise.all([pickCampaign(location, device)]);
                                })
                                .then(([campaignPick]) => {
                                    res.redirect(campaignPick.landingPageUrl);
                                })
                                .catch((errCampaign) => {
                                    console.log(errCampaign, 'Pick campaign Extreme failed');
                                    res.send('Pick campaign Extreme failed');
                                    cb();
                                });
                                break;
                            default: res.send('OK');
                        }
                    } else if (type === 'aerohive' || type === 'mikrotik') {
                        let userRadius = id;
                        if (group.options.locationConfig && lodash.size(group.options.locationConfig)) {
                            if (group.options.locationConfig[locationId] && group.options.locationConfig[locationId].sessionTimeout) {
                                userRadius = locationId;
                            }
                        }
                        if (type === 'mikrotik') {
                            paramsString += 'params.ap_type = "mikrotik";';
                            paramsString += 'params.redirect_param = "dst";';
                            paramsString += `params.loginurl = "${params.login_url}?username=${userRadius}&password=${userRadius}&popup=false";`;
                        } else {
                            paramsString += 'params.ap_type = "aerohive";';
                            paramsString += `params.loginurl = "http://${params['RADIUS-NAS-IP']}/reg.php?username=${userRadius}&password=${userRadius}";`; // NAS-IP-Address
                        }
                        paramsString += `params.ap = "${mac}";`;
                        paramsString += `params.macFieldName = "${standardizeMacAddressCNA(params.mac)}";`;
                        res.send(generateHtml(locationId, paramsString));
                    } else if (['successAerohive', 'aruba_mobility'].indexOf(type) > -1) {
                        const refererParams = getJsonFromUrl(`?${req.headers.referer.split('?')[1]}`);
                        const deviceMac = standardizeMacAddressCNA(refererParams.mac);
                        Promise.all([
                            LocationCached.findById(locationId),
                            deviceMac ? Device.findById(Device.toId(deviceMac)) : null
                        ])
                            .spread((location, device) => {
                                location = location && location.toJSON();
                                device = device && device.toJSON();

                                if (!location || !location.id) {
                                    return Promise.reject({
                                        message: 'Location not exists',
                                        statusCode: 400,
                                    });
                                }
                                const deviceOptions = extractDeviceOptions(req.useragent);
                                device = lodash.merge(
                                    { currentLocationId: locationId },
                                    device,
                                    { audience: deviceOptions },
                                );
                                return Promise.all([pickCampaign(location, device)]);
                            })
                            .then(([campaignPick]) => {
                                res.redirect(campaignPick.landingPageUrl);
                                // res.send('<!doctype html><html>'+
                                // '<head>'+
                                // '<meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>WiFiEX4U</title>'+
                                // '</head>'+
                                // '<body style="text-align: center; padding-top: 30px;">'+
                                // '<script type="text/javascript">'+
                                // '"use strict";'+
                                // 'function goBack(){var backLink = "'+campaignPick.landingPageUrl+'";if(backLink){window.location.href = backLink;} else {window.history.back()}}'+
                                // 'var counter = 3;var intervalCount = setInterval(function(){counter-=1;document.getElementById("counter").innerHTML = counter;if(counter<1){goBack();clearInterval(intervalCount)}}, 1000)'+
                                // '</script>'+
                                // '<h5>Redirect...</h5>'+
                                // '</body></html>');
                            })
                            .catch((errCampaign) => {
                                console.log(errCampaign, 'Pick campaign failed');
                                res.send('Pick campaign failed');
                                cb();
                            });
                    }
                } else {
                    res.send(`${'<!doctype html><html>' +
                        '<head><meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>Genex Wifi</title></head>' +
                        '<body style="text-align: center; padding-top: 30px;">' +
                        '<h4 style="color: red;">Access point on which you’re accessing then temporarily suspend!</h4>' +
                        '<h5>Please contact Administrator to have the support.</h5>' +
                        '<p>MAC Address: '}${mac}</p>` +
                        `</body></html>`);
                }
            });
        });
    };

    SelectOption.remoteMethod('externalType', {
        accepts: [
            { arg: 'id', type: 'string', required: true },
            { arg: 'type', type: 'string', required: true, description: 'aerohive | successAerohive | engenius_extend | aruba | aruba_mobility |  tplink | ruckus | extreme | mikrotik | chillispot' },
            { arg: 'req', type: 'object', http: { source: 'req' } },
            { arg: 'res', type: 'object', http: { source: 'res' } }
        ],
        http: { path: '/:id/externalType/:type', verb: 'get' }
    });

    SelectOption.unifiSplash = (siteId, req, res, cb) => {
        if (req.method === 'POST') {
            console.log('POST unifiSplash', req.body, req._parsedUrl.search);
            return res.send('OK');
        }
        const { APMap, Location } = SelectOption.app.models;
        const app = SelectOption.app;
        const params = getJsonFromUrl(req._parsedUrl.search);
        const deviceOptions = extractDeviceOptions(req.useragent);
        fs.appendFile(`/home/nntien/unifiLog/${siteId}.log`, `${moment().format('MMM DD, HH:mm:ss')} | ${standardizeMacAddress(params.id)} | ${standardizeMacAddress(params.ap)} | ${deviceOptions.device}-${deviceOptions.os} | Splashpage \n`, (err) => {
            if (err) console.log('write file err', err);
        });
        return APMap.find({ where: { or: [{ macLan: standardizeMacAddress(params.ap) }, { mac: standardizeMacAddress(params.ap) }, { mac5: standardizeMacAddress(params.ap) }] } }).then((apMaps) => {
            res.header('Content-Type', 'text/html');
            if (!apMaps.length) {
                res.send(`${'<!doctype html><html>' +
                    '<head><meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>Genex Wifi</title></head>' +
                    '<body style="text-align: center; padding-top: 30px;">' +
                    '<h4 style="color: red;">Access point on which you’re accessing then doesn’t exist on the system!</h4>' +
                    '<h5>Please contact Administrator to have the support.</h5>' +
                    '<p>MAC Address: '}${standardizeMacAddress(params.ap)}</p>` +
                    `</body></html>`);
            } else if (apMaps[0].status) {
                return Location.findById(apMaps[0].locationId).then(location => {
                    const htmlUnifi = `${'<!doctype html><html>' +
                        '<head><meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>Genex Wifi</title></head>' +
                        '<body>' +
                        '<script type="text/javascript">' +
                        '"use strict";function getJsonFromUrl(){var o=location.search.substr(1),e={},c=o;try{c=decodeURIComponent(o)}catch(o){console.log("string decoded",c)}return c.split("&").forEach(function(o){var c=o.split("=");try{e[c[0]]=decodeURIComponent(c[1])}catch(o){console.log("variable decoded",c[0],c[1]),e[c[0]]=c[1]}}),e}' +
                        'function getQueryVariable(r){for(var t=window.location.search.substring(1).split(/[?&]/),n=0;n<t.length;n++){var e=t[n].split("=");if(e[0]==r)return"Qv"==e[0]?t[n].substr(3,t[n].length):e[1]}return""}' +
                        'var params = getJsonFromUrl();params.locationId="'}${apMaps[0].locationId}";params.ap="${standardizeMacAddress(params.ap)}";params.macFieldName="${standardizeMacAddress(params.id)}";` +
                        `params.siteId="${siteId}";params.groupId="${location.categoryId}";params.isUnifi=true;params.ap_type="unifi";` +
                        `!function (e, a, t) {var l = function l() {M.init(params), M.loadAd();};if (!e.getElementById(t)) {var c = e.getElementsByTagName(a)[0],o = e.createElement(a);o.src = "${app.get('appScheme')}//${app.get('appHostName')}/lib/m-sdk@latest.min.js", o.id = t, o.onload = l, c.parentNode.insertBefore(o, c);}}(document, "script", "m-jssdk");` +
                        `</script>` +
                        `</body></html>`;
                    // if(params.siteId){
                    //     group.externalParams.siteId = 'siteId';
                    //     groupId = id;
                    // }
                    res.send(htmlUnifi);
                });
            } else {
                res.send(`${'<!doctype html><html>' +
                    '<head><meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>Genex Wifi</title></head>' +
                    '<body style="text-align: center; padding-top: 30px;">' +
                    '<h4 style="color: red;">Access point on which you’re accessing then temporarily suspend!</h4>' +
                    '<h5>Please contact Administrator to have the support.</h5>' +
                    '<p>MAC Address: '}${standardizeMacAddress(params.ap)}</p>` +
                    `</body></html>`);
            }
        });
    };

    SelectOption.remoteMethod('unifiSplash', {
        accepts: [
            { arg: 'siteId', type: 'string', required: true },
            { arg: 'req', type: 'object', http: { source: 'req' } },
            { arg: 'res', type: 'object', http: { source: 'res' } },
        ],
        http: { path: '/unifiSplash/guest/s/:siteId'},
        // returns: [
        //   {arg: 'body', http: { target: 'body' }, root: true},
        //   {arg: 'Content-Type', type: 'string', http: { target: 'header' }}
        // ]
    });

    SelectOption.getRadiusInfo = (req, res, cb) => {
        pool.getConnection((err, connection) => {
            connection.query('SELECT * from radacct', (error, result) => {
                res.send(result);
                connection.release();
            });
        });
    };

    SelectOption.remoteMethod('getRadiusInfo', {
        accepts: [
            { arg: 'req', type: 'object', http: { source: 'req' } },
            { arg: 'res', type: 'object', http: { source: 'res' } },
        ],
        http: { path: '/getRadiusInfo/', verb: 'get' },
        // returns: [
        //   {arg: 'body', http: { target: 'body' }, root: true},
        //   {arg: 'Content-Type', type: 'string', http: { target: 'header' }}
        // ]
    });

    function getJSON(str) { return (str || document.location.search).replace(/(^\?)/, '').split('&').map(function(n){return n = n.split('='), this[n[0]] = n[1], this}.bind({}))[0]; }

    SelectOption.captiveRuijie = (id, method, req, res, cb) =>
        SelectOption.findById(id).then((group) => {
            let redirectUrl = '', err;
            if (!group) {
                err = new Error('Location Group not found');
                err.statusCode = 400;
                cb(err);
            }
            if (!req._parsedUrl.search) {
                err = new Error('Query Params is required');
                err.statusCode = 400;
                cb(err);
            }
            const params = getJSON(req._parsedUrl.search);// getJsonFromUrl
            if (method === 'ping') {
                return res.send('Pong');
            }
            const { APMap, Device, Campaign, SessionCached } = SelectOption.app.models;
            let mac = params.apmac || params.gw_id;
            mac = standardizeMacAddressCNA(mac);
            // allowCrossOrigin(res);
            if (method === 'login') {
                return APMap.find({ where: { or: [{ macLan: mac }, { mac }, { mac5: mac }] } }).then((apMaps) => {
                    res.setHeader('Content-Type', 'text/html');
                    if (!apMaps.length) {
                        console.log('ap not in system', mac);
                        res.send(`${'<!doctype html><html>' +
                            '<head><meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>Genex Wifi</title></head>' +
                            '<body style="text-align: center; padding-top: 30px;">' +
                            '<h4 style="color: red;">Access point or gateway on which you’re accessing then doesn’t exist on the system!</h4>' +
                            '<h5>Please contact Administrator to have the support.</h5>' +
                            '<p>MAC Address: '}${mac}</p>` +
                            `</body></html>`);
                    } else if (apMaps[0].status) {
                        SessionCached.upsert({
                            id: Device.toId(standardizeMacAddress(params.mac)),
                            ap: mac,
                            loginurl: `http://${params.gw_address}:${params.gw_port}/${params.apmac ? 'auth' : 'wifidog/auth'}?token=genexwifi123` // /wifidog
                        });

                        let paramsString = '';
                        paramsString += 'params.ap_type = "ruijie";';
                        paramsString += 'params.redirect_param = "userurl";';
                        paramsString += `params.loginurl = "http://${params.gw_address}:${params.gw_port}/${params.apmac ? 'auth' : 'wifidog/auth'}?token=genexwifi123";`; // /wifidog
                        paramsString += `params.ap = "${mac}";`;
                        paramsString += `params.macFieldName = "${standardizeMacAddress(params.mac || params.client_mac)}";`;
                        res.send(`${'<!doctype html><html>' +
                            '<head><meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>Genex Wifi</title></head>' +
                            '<body>' +
                            '<script type="text/javascript">' +
                            '"use strict";function getJsonFromUrl(){var o=location.search.substr(1),e={},c=o;try{c=decodeURIComponent(o)}catch(o){console.log("string decoded",c)}return c.split("&").forEach(function(o){var c=o.split("=");try{e[c[0]]=decodeURIComponent(c[1])}catch(o){console.log("variable decoded",c[0],c[1]),e[c[0]]=c[1]}}),e}' +
                            '"use strict";function getJSON(str) { return (str || document.location.search).replace(/(^\\?)/, "").split("&").map(function(n){return n = n.split("="), this[n[0]] = n[1], this}.bind({}))[0]; }' +
                            'var params = getJSON();params.locationId="'}${apMaps[0].locationId}";${paramsString 
                            }!function (e, a, t) {var l = function l() {M.init(params), M.loadAd();};if (!e.getElementById(t)) {var c = e.getElementsByTagName(a)[0],o = e.createElement(a);o.src = "${SelectOption.app.get('appScheme')}//${SelectOption.app.get('appHost')}/lib/m-sdk@latest.min.js", o.id = t, o.onload = l, c.parentNode.insertBefore(o, c);}}(document, "script", "m-jssdk");` +
                            `</script>` +
                            `</body></html>`);
                    } else {
                        res.send('<!doctype html><html>' +
                            '<head><meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>Genex Wifi</title></head>' +
                            '<body style="text-align: center; padding-top: 30px;">' +
                            '<h4 style="color: red;">Access point or gateway on which you’re accessing then temporarily suspend!</h4>' +
                            '<h5>Please contact Administrator to have the support.</h5>' +
                            '</body></html>');
                    }
                });
            } else if (method === 'portal') {
                return SessionCached.findById(Device.toId(standardizeMacAddress(params.mac))).then((sess) => {
                    if (sess) {
                        console.log('--->Ruijie 3.redirect session', JSON.stringify(sess));
                    }
                    res.setHeader('Content-Type', 'text/html');
                    res.send(`${'<!doctype html><html>' +
                        '<head><meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>Genex Wifi</title></head>' +
                        '<body>Waiting to redirect...<script type="text/javascript">window.setTimeout(function () {window.location.href = "'}${standardizeURL(sess.redirect || '') || 'http://genexwifi.vn/'}";}, 500);</script></body></html>`);
                });
            } else if (method === 'auth' && params.stage) {
                if (params.stage === 'logout') {
                    console.log('--->Ruijie 4. logout ', Device.toId(standardizeMacAddress(params.mac)));
                    return SessionCached.findById(Device.toId(standardizeMacAddress(params.mac))).then((sess) => {
                        if (sess && sess.redirect) {
                            sess.destroy();
                            // SessionCached.destroyById(Device.toId(standardizeMacAddress(params.mac)));
                            // .then(() => res.send(JSON.stringify({ auth: 0 })));
                        }
                        res.send(JSON.stringify({ auth: 0 }));
                    });
                    // .destroyById(Device.toId(standardizeMacAddress(params.mac)));
                } else if (params.stage === 'query' && params.mac) {
                    return SessionCached.findById(Device.toId(standardizeMacAddress(params.mac))).then((sess) => {
                        console.log('--->Ruijie 4.query reconnect wifi:', JSON.stringify(sess), sess && sess.redirect ? 'keep' : 'kick');
                        if (sess && sess.redirect) {
                            res.send(JSON.stringify({ auth: 1, timeout: group.options.sessionTimeout || 0 }));
                        } else {
                            res.send(JSON.stringify({ auth: 0 }));
                        }
                    });
                } else if (params.stage === 'login' || params.stage === 'counters') { // || params.stage === 'counters'
                    res.send(JSON.stringify({ auth: 1, timeout: group.options.sessionTimeout || 0 }));
                } else {
                    res.send(JSON.stringify({ auth: 0 }));
                }
            }  else {
                res.send('OK');
            }
        });
    SelectOption.remoteMethod('captiveRuijie', {
        accepts: [
            { arg: 'id', type: 'string', required: true },
            { arg: 'method', type: 'string', required: true },
            { arg: 'req', type: 'object', http: { source: 'req' } },
            { arg: 'res', type: 'object', http: { source: 'res' } }
        ],
        http: { path: '/:id/captiveRuijie/:method', verb: 'get' }
    });

    SelectOption.getCommon = async (req, res) => {
        try {
            const { filter } = req.query;
            if (filter) {
                return await SelectOption.find(JSON.parse(filter));
            }
            return Promise.resolve({ statusCode: 200, code: 'OK' });
        } catch (error) {
            return Promise.reject({ statusCode: 500, code: 'FAILED' });
        }
    };

    SelectOption.remoteMethod('getCommon', {
        description: 'get common',
        accepts: [
            { arg: 'req', type: 'object', http: { source: 'req' } },
            { arg: 'res', type: 'object', http: { source: 'res' } },
        ],
        http: { path: '/getCommon', verb: 'get' },
        returns: { arg: 'data', type: 'object' },
    });

    const verifyRequest = async (userId, clientKey) => {
        const { User } = SelectOption.app.models;
        const usr = await User.findOne({ where: { _id: userId, clientkey: clientKey } });
        if (!usr) {
            return Promise.reject('Unauthenticate');
        }
        return usr;
    };
    SelectOption.getMeta = (type = 'campaign', clientId, clientKey, res, cb) => {
        Promise.resolve().then(() => verifyRequest(clientId, clientKey))
        .then((usr) => {
            if (type === 'campaign') {
                const { Campaign } = SelectOption.app.models;
                return Campaign.find({
                    where: { or: [{ createdBy: usr.id }, { brandId: usr.id }, { brands: { inq: [usr.id] } }] },
                    fields: { id: 1, name: 1 }
                }).then(data => res.send(data));
            } else if (type === 'location') {
                const { Campaign, Location } = SelectOption.app.models;
                if (usr.profileName === 'brand') {
                    return Campaign.find({
                        where: { or: [{ brands: { inq: [usr.id] } }, { brandId: usr.id }] },
                        fields: { id: 1, name: 1, locations: 1 }
                    }).then((camps) => {
                        let result = [];
                        camps.forEach((item) => {
                            result = result.concat(item.locations);
                        });
                        res.send(result.map(item => ({ id: item.locationId, name: item.locationName })));
                    });
                }
                return Location.find({
                    where: { createdBy: usr.id },
                    fields: { id: 1, name: 1 }
                }).then(data => res.send(data));
            } else if (type === 'wifiNetwork') {
                const { Campaign } = SelectOption.app.models;
                if (usr.profileName === 'brand') {
                    return Campaign.find({
                        where: { or: [{ brands: { inq: [usr.id] } }, { brandId: usr.id }] },
                        fields: { id: 1, name: 1, locations: 1 }
                    }).then((camps) => {
                        const result = {};
                        camps.forEach((item) => {
                            item.locations.forEach((itemLoc) => {
                                if (itemLoc.categoryId) {
                                    result[itemLoc.categoryId] = itemLoc.categoryName;
                                }
                            });
                        });
                        res.send(Object.keys(result).map((cat) => ({ id: cat, name: result[cat] })));
                    });
                }
                return SelectOption.find({
                    where: { createdBy: usr.id, type: 'location_category' },
                    fields: { id: 1, text: 1 }
                }).then(data => res.send(data.map(item => ({ id: item.id, name: item.text }))));
            }
            return res.send([]);
        })
        .catch((err) => {
            const errorObj = new Error(err);
            errorObj.statusCode = 400;
            cb(errorObj);
        });
    };
    SelectOption.remoteMethod('getMeta', {
        accepts: [
            { arg: 'type', type: 'string', description: 'campaign | location | wifiNetwork' },
            { arg: 'clientId', type: 'string', required: true, description: 'Client Id' },
            { arg: 'clientKey', type: 'string', required: true, description: 'Client Key' },
            { arg: 'res', type: 'object', http: { source: 'res' } }
        ],
        http: { verb: 'post' },
        returns: { type: 'array', root: true }
    });
};
