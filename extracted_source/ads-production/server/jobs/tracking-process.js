if (!global._babelPolyfill) {
  require('babel-polyfill');
}

const moment = require('moment');
const lodash = require('lodash');
const Promise = require('bluebird');

const debug = require('debug')('app:job:tracking-process');
const error = require('debug')('err:job:tracking-process');
const app = require('../../server/server');
const { sendEmail } = require('../import/utils');

debug('Started at', moment().toISOString());

const { Tracking, TrackingCached, Device, Visit, License, User, APMap } = app.models;
const esTrackingConn = Tracking.getDataSource().connector;
const esTrackingDb = esTrackingConn.db;

const esDeviceConn = Device.getDataSource().connector;
const esDeviceDb = esDeviceConn.db;

const processTrackingData = async (actions) => {
  if (!actions || !actions.length) return;

  const bulkBody = [];
  actions.forEach((action) => {
    if (!action || !action.sessionId) return;
    bulkBody.push(
      { update: { _id: action.sessionId } },
      {
        scripted_upsert: true,
        script: { stored: 'upsert-tracking-v1', params: action.__data },
        upsert: {},
      },
    );
  });

  if (!bulkBody.length) return;
  await Promise.promisify(esTrackingDb.bulk).call(esTrackingDb, {
    index: esTrackingConn.searchIndex,
    type: Tracking.modelName,
    body: bulkBody,
  });

  // clear data
  bulkBody.splice(0, bulkBody.length);
};

const processDeviceData = async (actions) => {
  if (!actions || !actions.length) return;

  const bulkBody = [];
  actions.forEach((action) => {
    if (
      !action ||
      !action.id ||
      !action.mac ||
      !action.actionType ||
      Tracking.realActions.indexOf(action.actionType) < 0
    ) { return; }

    debug('%s upsert device %o', action.mac, action.__data);
    bulkBody.push(
      { update: { _id: Device.toId(action.mac) } },
      {
        scripted_upsert: true,
        script: { stored: 'upsert-device-v1', params: action.__data },
        upsert: {},
      },
    );
  });

  if (!bulkBody.length) return;
  await Promise.promisify(esDeviceDb.bulk).call(esDeviceDb, {
    index: esDeviceConn.searchIndex,
    type: Device.modelName,
    body: bulkBody,
  });

  // clear data
  bulkBody.splice(0, bulkBody.length);
};

const processVisitData = async (actions) => {
  if (!actions || !actions.length) return;

  let macHash = {};
  actions.forEach((action, idx) => {
    if (
      !action ||
      !action.mac ||
      action.actionType !== Tracking.VISIT
    ) { return; }
    // debug('%s upsert device %o', action.mac, action.__data);
    macHash[action.mac] = 1;
  });

  if (!lodash.size(macHash)) return;
  const macData = await Promise.promisify(esDeviceDb.search).call(esDeviceDb, {
    index: esDeviceConn.searchIndex,
    type: Visit.modelName,
    body: {
        query: {
            bool: {
                should: lodash.map(macHash, (_, key)=>{ return { term: { mac: key }}})
            }
        },
        size: 0,
        aggs: {
            aggMac: {
                terms: { field: "mac"},
                aggs: {
                    category: {
                        terms: { field: "subject", "size" : 5 }
                    }
                }
            }
        }
    },
  });

  const bulkBody = [];
  let mainCat = '', total;
  macData.aggregations.aggMac.buckets.forEach((action)=>{
      action.category.buckets.forEach((cat)=>{
          if ((cat.doc_count/action.doc_count) > 0.5){
              mainCat = cat.key;
          }
      });
      bulkBody.push(
        { update: { _id: Device.toId(action.key) } },
        {
          doc: { category: action.category.buckets.map((cat)=>{return cat.key}), mainCategory: mainCat }
        },
      );
  });
  if (!bulkBody.length) return;
  await Promise.promisify(esDeviceDb.bulk).call(esDeviceDb, {
    index: esDeviceConn.searchIndex,
    type: Device.modelName,
    body: bulkBody,
  });

  // clear data
  macHash = null;
  bulkBody.splice(0, bulkBody.length);
};

const processFrequency = async (actions) => {//frequencyData
  if (!actions || !actions.length) return;

  let macData = {};
  actions.forEach((action, idx) => {
    if ( !action || !action.mac || action.actionType !== Tracking.CLICK ) { return; }
    macData[action.mac] = {[action.campaignId]:{[action.locationId]: 1, total: 1}};
  });

  if (!lodash.size(macData)) return;

  const esTrackingConn = Tracking.getDataSource().connector;
  const esTrackingDb = esTrackingConn.db;
  const frequencyMac = await Promise.promisify(esTrackingDb.search).call(esTrackingDb, {
    index: esTrackingConn.searchIndex,
    type: Tracking.modelName,
    body: {
        query: {
            bool: {
                should: lodash.map(macData, (_, key)=>{ return { term: { mac: key }}})
            }
        },
        size: 0,
        aggs: {
            "mac": {
              "terms": { "field": "mac"},
              "aggs": {
                  "campaign": {
                    "terms": { "field": "meta.campaignId"},
                    "aggs": {
                        "location": {
                            "terms": { "field": "meta.locationId", size: 100 },
                            "aggs": {
                              "clickAggs": {
                                "nested": { "path": "actions" },
                                "aggs": { "action": { "terms": { "field": "actions.action", "size": 2  } } }
                              }
                            }
                        }
                    }
                  }
              }
            }
        }
    },
  });
  frequencyMac.aggregations.mac.buckets.forEach((mac)=>{
      if(!macData[mac.key]){
          macData[mac.key] = {};
      }
      mac.campaign.buckets.forEach((camp)=>{
          if(!macData[mac.key][camp.key]){
              macData[mac.key][camp.key] = {total: 0};
          }
          camp.location.buckets.forEach((loc)=>{
              if(!macData[mac.key][camp.key][loc.key]){
                  macData[mac.key][camp.key][loc.key] = 0;
              }
              loc.clickAggs.action.buckets.forEach((act)=>{
                  if(act.key==='click'){
                      macData[mac.key][camp.key][loc.key] += act.doc_count;
                      macData[mac.key][camp.key].total += act.doc_count;
                  }
              });
          });
      });
  });

  const bulkBody = [];
  lodash.forEach(macData, (val, key)=>{
      bulkBody.push(
        { update: { _id: Device.toId(key) } },
        {
          doc: { frequencyData: val }
        },
      );
  });
  if (!bulkBody.length) return;
  await Promise.promisify(esDeviceDb.bulk).call(esDeviceDb, {
    index: esDeviceConn.searchIndex,
    type: Device.modelName,
    body: bulkBody,
  });

  // clear data
  macData = null;
  bulkBody.splice(0, bulkBody.length);
};

let loop;
let process;
let loopLicense;
let processLicense;
const processNext = () => {
  clearTimeout(loop);
  loop = setTimeout(process, 5 * 1000);
};

process = async () => {
  const actions = await TrackingCached.find({ limit: 500 });
  if (!actions.length) return processNext();
  await Promise.all([
    processTrackingData(actions).catch(error),
    processDeviceData(actions).catch(error),
    processVisitData(actions).catch(error),
  ]);

  await processFrequency(actions).catch(error);

  const actionIds = actions.reduce(
    (all, action) => (action.id ? all.concat(action.id) : all),
    [],
  );
  TrackingCached.destroyAll({ id: { inq: actionIds } });

  debug('Processed %s actions', actionIds.length, actionIds);
  actionIds.splice(0, actionIds.length);

  return processNext();
};

process();

const licenseNext = () => {
  clearTimeout(loopLicense);
  loopLicense = setTimeout(processLicense, 60 * 60 * 1000);
};
processLicense = async () => {
  if (moment().hour() < 1) {
    return licenseNext();
  }
  const lins = await License.find({ where: { end: { lte: moment().valueOf() } } });
  if (!lins.length) return licenseNext();
  const aps = await APMap.find({ where: { keyId: { inq: lins.map(item => item.id.toString()) } } });
  console.log('processLicense', lins);
  lins.forEach((lin) => {
    lin.updateAttribute('status', 100);
  });
  aps.forEach((ap) => {
    ap.updateAttribute('status', 0);
  });

  const goExpiredLins = await License.find({ where: { status: 99, end: { lte: moment().startOf('day').add(30, 'days').valueOf() } } });
  if (!lins.length) return licenseNext();
  goExpiredLins.forEach((lin) => {
    if (lin.notifyExpire) { return; }
    User.findById(lin.userId)
    .then(usr => sendEmail(usr.email, 'License will expired soon', `<html><label> Your License will expire at <b>${moment(lin.end).format('MMM DD, YYYY')}</b> </label><br> Please contact administrator to extend your license soon!</html>`)
      .then(() => lin.updateAttribute('notifyExpire', 1))
      .catch(err => console.log('send Expired Notify error', err)))
    .catch((err) => console.log('not found user in license', err));
  });
  return licenseNext();
};


processLicense();
