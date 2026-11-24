const path = require('path');
const Promise = require('bluebird');
const loopback = require('loopback');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const lodash = require('lodash');
const response = require('../import/response');
const {
  standardizeMacAddressCNA
} = require('../import/utils');
const { allowCrossOrigin } = require('../import/access-utils');

const { ObjectId } = require('mongodb').ObjectID;
const debug = require('debug')('app:model:Location');
const error = require('debug')('err:model:Location');

const postDSP = async (url, data, Authorization) => {
  return await axios(
    {
      method: 'POST',
      url,
      data,
      headers: { 'Content-Type': 'application/json', 'Authorization': Authorization },
    }
  )
};

const excuteWithShare = async (PublisherShare, userId, locationId) => {
  let share = await PublisherShare.findOne({ where: { userId } });
  let locationShares = [];
  if (share) {
    share = share.toJSON();
    const { locationDetail } = share;
    if (locationDetail && locationDetail.length) {
      locationShares = locationDetail;
    }
  }
  return lodash.find(locationShares, item => item.location.toString() === locationId.toString());
}

module.exports = (Location) => {
  Location.defineProperty('createdBy', { type: ObjectId, require: true });
  Location.defineProperty('keyId', { type: ObjectId, require: true });
  function validateLocation(err) {
    if (this.location) {
      const values = this.location;
      if (
        'lat' in values &&
        'lng' in values &&
        !isNaN(values.lat) &&
        !isNaN(values.lng) &&
        values.lng >= -180 &&
        values.lng <= 180 &&
        values.lat >= -90 &&
        values.lat <= 90
      ) {
        // convert to Point MongoDB-type
      } else {
        err();
      }
    }
  }
  Location.validate('location', validateLocation, {
    message: 'Invalid Location'
  });

  Location.observe('loaded', async (ctx, next) => {
    const { APMap } = Location.app.models;
    if (ctx.data) {
      return Promise.resolve()
        .then(() => APMap.find({ where: { locationId: ctx.data.id } }))
        .then(apList => { ctx.data.apList = apList; });
    } else {
      next();
    }
  });

  const trackingCodeTemplate = loopback.template(
    path.resolve(__dirname, '../templates/tracking-code.min.js'),
  );
  const trackingCatfishCodeTemplate = loopback.template(
    path.resolve(__dirname, '../templates/tracking-catfish-code.min.js'),
  );
  const parseTrackingCode = (location, macFieldName) => {
    const app = Location.app;
    // genex-jslib || m-sdk
    return trackingCodeTemplate({
      locals: {
        locationId: location.id.toString(),
        macFieldName,
        adScriptUrl: `${app.get('appScheme')}//${app.get(
          'appHostName',
        )}/lib/m-sdk@latest.min.js`
      }
    });
  };
  const parseTrackingCatfishCode = (location, macFieldName, campaignId, hosts, apRoute) => {
    const app = Location.app;
    let hostnames = ' ';
    if (hosts) {
      hostnames = hosts.split(' ').join('|').split(',').join('|').split('||').join('|');
    }
    // genex-jslib || m-sdk
    return trackingCatfishCodeTemplate({
      locals: {
        locationId: location.id.toString(),
        macFieldName,
        campaignId,
        apRoute,
        hosts: '^(?=.*?(' + hostnames + ')).*$',
        adScriptUrl: `${app.get('appScheme')}//${app.get(
          'appHostName',
        )}/lib/m-sdk@latest.min.js`
      }
    });
  };

  Location.getTrackingCode = (locationId, macFieldName, campaignId, hosts, apRoute) =>
    Location.findById(locationId).then((location) => {
      if (!location) {
        return response.invalidRequest();
      }
      if (campaignId) {
        return parseTrackingCatfishCode(location, macFieldName, campaignId, hosts, apRoute);
      }
      return parseTrackingCode(location, macFieldName);
    });
  Location.remoteMethod('getTrackingCode', {
    description: 'Return js tracking code',
    accepts: [
      { arg: 'id', type: 'string', description: 'Location ID' },
      {
        arg: 'macField',
        type: 'string',
        description: 'Cookie name or hidden field name to get mac'
      },
      { arg: 'campaignId', type: 'string', description: 'campaign Id' },
      { arg: 'hosts', type: 'string', description: 'whitelist hostnames' },
      { arg: 'apRoute', type: 'string', description: 'AP Route' }
    ],
    http: { verb: 'get', path: '/:id/tracking-code' },
    returns: [{ arg: 'jsCode', type: 'string' }]
  });

  Location.changeCampaignPriority = (locationId, activeCampaigns) =>
    Location.findById(locationId).then((location) => {
      if (!location) {
        const err = new Error('Location not found');
        err.statusCode = 400;
        cb(err);
      }

      debug('update campaign priority %o', activeCampaigns);
      const { CampaignMapping } = Location.app.models;
      return Promise.each(activeCampaigns, campaign =>
        CampaignMapping.updateAll(
          { locationId, campaignId: campaign.campaignId },
          {
            priority: campaign.priority
          },
        ),
      ).then(() => location.updateAttributes({ activeCampaigns }));
    });
  Location.remoteMethod('changeCampaignPriority', {
    description: 'Update campaign priority',
    accepts: [
      { arg: 'id', type: 'string', description: 'Location ID', required: true },
      {
        arg: 'activeCampaigns',
        type: ['object'],
        description: 'Active campaign list: [{campaignId, priority},...]',
        required: true
      }
    ],
    http: { path: '/:id/change-campaign-priority' },
    returns: { arg: 'location', type: Location.modelName, root: true }
  });
  // Location.observe('before delete', async (ctx, next) => {
  //   // NOTE: quên xóa locationcached
  //   const { CampaignMapping, APMap, PublisherShare, LocationShareCached } = Location.app.models;
  //   const data = ctx.where;
  //   const context = ctx.options && ctx.options.accessToken;

  //   if (!context) {
  //     next();
  //     return;
  //   }

  //   try {
  //     let [, , pubshare] = await Promise.all([
  //       APMap.destroyAll({ locationId: data.id }),
  //       CampaignMapping.destroyAll({ locationId: data.id }),
  //       PublisherShare.findOne({ where: { userId: context.userId } })
  //     ]);
  //     if (pubshare) {
  //       pubshare = pubshare.toJSON();
  //       let locationDetail = pubshare.locationDetail;
  //       locationDetail = locationDetail.filter(item => item.location.toString() !== data.id.toString());

  //       return await Promise.all([
  //         PublisherShare.updateAll({ id: pubshare.id }, { locationDetail, userId: pubshare.userId, isDelete: true }),
  //         LocationShareCached.destroyAll({ id: data.id })
  //       ]).then(() => next());
  //     }
  //   } catch (error) {
  //     console.log('before delete fail', error);
  //     return Promise.reject(error);
  //   }
  // });
  Location.observe('before delete', async (ctx, next) => {
    const { APMap } = Location.app.models;
    const data = ctx.where;
    const context = ctx.options && ctx.options.accessToken;
    const chain = Promise.resolve();

    if (!context) {
      next();
      return;
    }
    try {
      const needDeleteAP = await APMap.find({where: {locationId: data.id}});
      if (needDeleteAP.length) {
        await APMap.destroyAll({_id: {inq: needDeleteAP.map(item=>item.id)}})
      }
      console.log('needDeleteAP', needDeleteAP);
      return;
    } catch (error) {
      console.log('before delete fail', error);
      return Promise.reject(error);
    }
  });
  const checkExists = (apList, hash) => {
    let existList = '';
    apList.forEach((item) => {
      if (item.mac && hash[item.mac]) {
        existList += item.mac + ',';
      }
      if (item.mac5 && hash[item.mac5]) {
        existList += item.mac5 + ',';
      }
      if (item.macLan && hash[item.macLan]) {
        existList += item.macLan + ',';
      }
    });
    return existList;
  };
  Location.APProcess = (id, apList, user, type, res, cb) => {
    const app = Location.app;
    const { APMap, License, User, PublisherShare } = Location.app.models;
    let err;
    if (!id || !apList || !user) {
      console.error(`missing params`);
      cb({ statusCode: 400, message: 'missing params' }, null);
    }
    if (type === 'delete') {
      const destroyFilter = {};
      if (apList[0].macLan) {
        destroyFilter.macLan = apList[0].macLan;
      } else if (apList[0].mac) {
        destroyFilter.mac = apList[0].mac;
      } else {
        destroyFilter.mac5 = apList[0].mac5;
      }
      APMap.destroyAll(destroyFilter)
        .then(() => {
          res.sendStatus(200);
        })
        .catch((err) => {
          console.error(`delete AP failed`);
          cb({ statusCode: 400, message: `delete AP failed` }, null);
        });
    } else if (type === 'update') {
      let queryOr = [];
      if (apList[0].mac) {
        queryOr = queryOr.concat([{ mac: apList[0].mac }, { mac5: apList[0].mac }, { macLan: apList[0].mac }]);
      }
      if (apList[0].mac5) {
        queryOr = queryOr.concat([{ mac: apList[0].mac5 }, { mac5: apList[0].mac5 }, { macLan: apList[0].mac5 }]);
      }
      if (apList[0].macLan) {
        queryOr = queryOr.concat([{ mac: apList[0].macLan }, { mac5: apList[0].macLan }, { macLan: apList[0].macLan }]);
      }

      User.findById(user)
        .then((usr) => {
          if (usr.profileName === 'publisher') {
            excuteWithShare(PublisherShare, user, id)
              .then(findInShare => {
                if (findInShare && findInShare.enable) {
                  return Promise.all([
                    APMap.findOne({ where: { id: { neq: apList[0].id }, or: queryOr } }),
                    Promise.map(apList, ap => postDSP(`${app.get('dspHost')}/api/aps`,
                      {
                        name: ap.name,
                        mac: ap.mac || ap.mac5,
                        venueId: id,
                      },
                      jwt.sign({ type: 'APMap', createdByUsername: usr.username }, app.get('secretKey'), { expiresIn: 60 })), { concurrency: 10 })
                  ]);
                }
                return Promise.all([APMap.findOne({ where: { id: { neq: apList[0].id }, or: queryOr } })]);
              })
              .then(([existAP]) => {
                if (existAP) {
                  console.error(`AP exists: ${existAP.name} (${existAP.mac || ""} | ${existAP.mac5 || ""} | ${existAP.macLan || ""})`);
                  cb({ statusCode: 400, message: `AP exists: ${existAP.name} (${existAP.mac || ""} | ${existAP.mac5 || ""} | ${existAP.macLan || ""})` }, null);
                } else {
                  APMap.findOne({ where: { id: apList[0].id } }).then((apIns) => {
                    apIns.updateAttributes({ name: apList[0].name, mac: apList[0].mac, mac5: apList[0].mac5, macLan: apList[0].macLan });
                    res.sendStatus(200);
                  });
                }
              })
              .catch((err) => cb(err));
          } else {
            APMap.findOne({ where: { id: { neq: apList[0].id }, or: queryOr } }).then((existAP) => {
              if (existAP) {
                console.error(`AP exists: ${existAP.name} (${existAP.mac || ""} | ${existAP.mac5 || ""} | ${existAP.macLan || ""})`);
                cb({ statusCode: 400, message: `AP exists: ${existAP.name} (${existAP.mac || ""} | ${existAP.mac5 || ""} | ${existAP.macLan || ""})` }, null);
              } else {
                APMap.findOne({ where: { id: apList[0].id } }).then((apIns) => {
                  apIns.updateAttributes({ name: apList[0].name, mac: apList[0].mac, mac5: apList[0].mac5, macLan: apList[0].macLan });
                  res.sendStatus(200);
                });
              }
            }).catch(err => cb(err));
          }
        })
    } else if (type === 'move') {
      User.findById(user)
        .then((usr) => {
          if (usr.profileName === 'publisher') {
            excuteWithShare(PublisherShare, user, id)
              .then(findInShare => {
                if (findInShare && findInShare.enable) {
                  return Promise.all([
                    APMap.findOne({ where: { id: apList[0].id } }),
                    Promise.map(apList, ap => postDSP(`${app.get('dspHost')}/api/aps`,
                      {
                        name: ap.name,
                        mac: ap.mac || ap.mac5,
                        venueId: id,
                      },
                      jwt.sign({ type: 'APMap', createdByUsername: usr.username }, app.get('secretKey'), { expiresIn: 60 })), { concurrency: 10 })
                  ]);
                }
                return Promise.all([APMap.findOne({ where: { id: apList[0].id } })]);
              })
              .then(([apIns]) => {
                apIns.updateAttributes({ locationId: id });
                res.sendStatus(200);
              })
              .catch((err) => cb(err));
          } else {
            APMap.findOne({ where: { id: apList[0].id } }).then((apIns) => {
              apIns.updateAttributes({ locationId: id });
              res.sendStatus(200);
            });
          }
        })
    } else {
      let apHash = {}, keyMap = {};
      APMap.find({}).then((aps) => {
        aps.forEach((item) => {
          apHash[item.mac] = item.name;
          apHash[item.mac5] = item.name;
          apHash[item.macLan] = item.name;
          if (!keyMap[item.keyId]) {
            keyMap[item.keyId] = [];
          }
          keyMap[item.keyId].push(item);
        });
        // check exists
        const existsCheck = checkExists(apList, apHash);
        if (existsCheck) {
          console.error(`AP exists: ${existsCheck}`);
          cb({ statusCode: 400, message: `AP exists: ${existsCheck}` }, null);
        } else {
          User.findById(user)
            .then((usr) => {
              if (usr.profileName === 'superadmin' || usr.profileName === 'publisher') {
                if (usr.profileName === 'publisher') {
                  excuteWithShare(PublisherShare, user, id)
                    .then(findInShare => {
                      if (findInShare && findInShare.enable) {
                        return Promise.all([
                          APMap.create(apList.map((item) => Object.assign({}, item, { createdBy: user, locationId: id, status: 1 }))),
                          Promise.map(apList, ap => postDSP(`${app.get('dspHost')}/api/aps`,
                            {
                              name: ap.name,
                              mac: ap.mac || ap.mac5,
                              venueId: id,
                            },
                            jwt.sign({ type: 'APMap', createdByUsername: usr.username }, app.get('secretKey'), { expiresIn: 60 })), { concurrency: 10 })
                        ]);
                      }
                      return APMap.create(apList.map((item) => Object.assign({}, item, { createdBy: user, locationId: id, status: 1 })));
                    })
                    .then(() => res.sendStatus(200))
                    .catch((err) => cb(err));
                } else {
                  APMap.create(apList.map((item) => {
                    return Object.assign({}, item, { createdBy: user, locationId: id, status: 1 });
                  }))
                    .then(() => res.sendStatus(200))
                    .catch(() => cb(err));
                }
              } else {
                License.find({ where: { userId: user, status: 99 } }).then((keys) => {
                  let remainAP = 0, iK, keyId;
                  keys.forEach((ky) => {
                    remainAP += ky.numberAp;
                    if (keyMap[ky.id]) {
                      remainAP -= keyMap[ky.id].length;
                    } else {
                      keyMap[ky.id] = [];
                    }
                  });
                  if (remainAP >= apList.length) {
                    APMap.create(apList.map((item) => {
                      for (iK = 0; iK < keys.length; iK++) {
                        if (keys[iK].numberAp > keyMap[keys[iK].id].length) {
                          keyMap[keys[iK].id].push(item);
                          keyId = keys[iK].id;
                          break;
                        }
                      }
                      return Object.assign({}, item, { createdBy: user, locationId: id, keyId: keyId, status: 1 });
                    }
                    ))
                      .then(() => res.sendStatus(200))
                      .catch(() => cb(err));
                  } else {
                    console.error(`Need to expand`);
                    cb({ statusCode: 400, message: 'Need to expand' }, null);
                  }
                });
              }
            });
        }
      });
    }
  };
  Location.remoteMethod('APProcess', {
    accepts: [
      { arg: 'id', type: 'string', description: 'location ID', required: true },
      { arg: 'ap', type: 'array', description: 'ap List', required: true },
      { arg: 'user', type: 'string', description: 'user ID require', required: true },
      { arg: 'type', type: 'string', description: 'action type' },
      { arg: 'res', type: 'object', http: { source: 'res' } }
    ],
    http: { path: '/:id/APProcess/', verb: 'post' }
    // returns: [
    //   {arg: 'body', http: { target: 'body' }, root: true},
    //   {arg: 'Content-Type', type: 'string', http: { target: 'header' }}
    // ]
  });

  Location.importLocAP = async (locId, ap, user, res, cb) => {
    const app = Location.app;
    const { APMap, License, User } = Location.app.models;
    const apHash = {};
    const keyMap = {};
    const apList = await APMap.find({});
    apList.forEach((item) => {
      apHash[item.mac] = item.name;
      apHash[item.mac5] = item.name;
      apHash[item.macLan] = item.name;
      if (!keyMap[item.keyId]) {
        keyMap[item.keyId] = [];
      }
      keyMap[item.keyId].push(item);
    });
    const apExists = checkExists([ap], apHash);
    // check exists
    if (apExists) {
      console.error('AP exists', apExists);
      return { err: 'AP exists' };
    }
    const usr = await User.findById(user);
    if (usr.profileName === 'superadmin') {
      return APMap.create(Object.assign({}, ap, { createdBy: user, locationId: locId, status: 1 }))
      .then(() => ({ status: 'OK' }))
      .catch(err => ({ err }));
    } else {
      return License.find({ where: { userId: user, status: 99 } }).then((keys) => {
        let remainAP = 0, iK, keyId;
        keys.forEach((ky) => {
          remainAP += ky.numberAp;
          if (keyMap[ky.id]) {
            remainAP -= keyMap[ky.id].length;
          } else {
            keyMap[ky.id] = [];
          }
        });
        if (remainAP) {
          for (iK = 0; iK < keys.length; iK++) {
            if (keys[iK].numberAp > keyMap[keys[iK].id].length) {
              keyMap[keys[iK].id].push(ap);
              keyId = keys[iK].id;
              break;
            }
          }
          return APMap.create(Object.assign({}, ap, { createdBy: user, locationId: locId, keyId, status: 1 }))
            .then(() => ({ status: 'OK' }))
            .catch(err => ({ err }));
        }
        console.error('Need to expand');
        return { err: 'Out of License! Need to expand' };
      });
    }
  };

  Location.remoteMethod('importLocAP', {
    accepts: [
      { arg: 'locId', type: 'string', description: 'location Id', required: true },
      { arg: 'ap', type: 'object', description: 'ap', required: true },
      { arg: 'user', type: 'string', description: 'user ID require', required: true },
      { arg: 'res', type: 'object', http: { source: 'res' } }
    ],
    http: { path: '/importLocAP/', verb: 'post' },
    returns: [{ arg: 'body', type: 'object', root: true }]
    // returns: [
    //   {arg: 'body', http: { target: 'body' }, root: true},
    //   {arg: 'Content-Type', type: 'string', http: { target: 'header' }}
    // ]
  });

  const getJsonFromUrl = (search) => {
    const query = search.substr(1);
    const result = {};
    decodeURIComponent(query).split('&').forEach((part) => {
      const item = part.split('='); result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
  };
  const generateHtml = (id, paramsString) => {
    const app = Location.app;
    return '<!doctype html><html>' +
      '<head><meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>Genex WiFi</title></head>' +
      '<body>' +
      '<script type="text/javascript">' +
      '"use strict";function getJsonFromUrl(){var query = location.search.substr(1);var result = {};decodeURIComponent(query).split("&").forEach(function(part) {var item = part.split("=");result[item[0]] = decodeURIComponent(item[1]);});return result;}' +
      'var params = getJsonFromUrl();params.locationId="' + id + '";' + paramsString +
      '!function (e, a, t) {var l = function l() {M.init(params), M.loadAd();};if (!e.getElementById(t)) {var c = e.getElementsByTagName(a)[0],o = e.createElement(a);o.src = "' + app.get('appScheme') + '//' + app.get('appHostName') + '/lib/m-sdk@latest.min.js", o.id = t, o.onload = l, c.parentNode.insertBefore(o, c);}}(document, "script", "m-jssdk");' +
      '</script>' +
      '</body></html>';
  };

  Location.getExternalUrl = (locationId, type, res) =>
    Location.findById(locationId).then((location) => {
      if (!location) {
        return res.invalidRequest();
      }
      const app = Location.app;
      if (['xirrus'].indexOf(type) > -1) {
        return { jsCode: `${app.get('appScheme')}//${app.get('appHostName')}/api/Locations/${locationId}/externalType/${type}` };
      }
      return { jsCode: '' };
    });

  Location.remoteMethod('getExternalUrl', {
    description: 'Return js tracking code',
    accepts: [
      { arg: 'id', type: 'string', description: 'Location ID' },
      { arg: 'type', type: 'string', description: 'Hotspot Type' },
      { arg: 'res', type: 'object', http: { source: 'res' } }
    ],
    http: { verb: 'get', path: '/:id/tracking-code/:type' },
    returns: [{ arg: 'body', type: 'object', root: true }]
  });

  Location.externalType = (id, type, req, res, cb) => {
    Location.findById(id).then((group) => {
      if (!group) {
        res.send('Location not found');
        cb();
        return;
      }
      let params = {}, mac;
      if (!req._parsedUrl.search) {
        res.send('Query Params is required');
        cb();
        return;
      }
      params = getJsonFromUrl(req._parsedUrl.search);
      allowCrossOrigin(res);
      res.header('Content-Type', 'text/html');
      let paramsString = '';
      if (type === 'xirrus') {
        paramsString += 'params.ap_type = "xirrus";';
        paramsString += 'params.redirect_param = "userurl";';
        paramsString += `params.loginurl = "http://${params.uamip}:${params.uamport}/logon?username=&response=${params.challenge}";`;
        paramsString += `params.macFieldName = "${standardizeMacAddressCNA(params.mac)}";`;
        res.send(generateHtml(id, paramsString));
      } else if (type === 'pfsense') {
        paramsString += 'params.ap_type = "pfsense";';
        paramsString += 'params.redirect_param = "redirurl";';
        paramsString += `params.loginurl = "${params.portalurl}";`;
        paramsString += `params.clientip = "${params.clientip}";`;
        paramsString += `params.portalzone = "${params.portalzone}";`;
        paramsString += `params.macFieldName = "${standardizeMacAddressCNA(params.clientmac)}";`;
        res.send(generateHtml(id, paramsString));
      } else {
        res.send('Not compatibility!');
      }
    });
  };

  Location.remoteMethod('externalType', {
    accepts: [
      { arg: 'id', type: 'string', required: true },
      { arg: 'type', type: 'string', required: true, description: 'xirrus' },
      { arg: 'req', type: 'object', http: { source: 'req' } },
      { arg: 'res', type: 'object', http: { source: 'res' } }
    ],
    http: { path: '/:id/externalType/:type', verb: 'get' }
  });
};
