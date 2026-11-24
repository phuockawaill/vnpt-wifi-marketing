const lodash = require('lodash');
const moment = require('moment');
const debug = require('debug')('app:model:ad');
const axios = require('axios');

const { allowCrossOrigin } = require('../import/access-utils');
const {
  standardizeMacAddress,
  extractDeviceOptions,
  sendEmail
} = require('../import/utils');
const { render, isRulesMatch } = require('../import/banner-util');

module.exports = (Ad) => {
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
      device.visitTime = [String(device.visitTime)];
      const startDay = moment().startOf('day').valueOf();
      device.visitTime.push(moment(device.updatedAt) < startDay ? '0d' : '1d');
      if (
        campaign.audience &&
        Array.isArray(campaign.audience) &&
        !isRulesMatch(campaign.audience, device)
      ) {
        return false;
      }

      return true;
    });

  const getMatchedBanner = async (campaign, locationId, device) => {
    const BannerCached = Ad.app.models.BannerCached;
    let matched = [];
    let bannerId;
    // Find first matched banner
    for (let i = 0; campaign.banners && i < campaign.banners.length; i += 1) {
      const banner = campaign.banners[i];
      if (
        banner.filters &&
        Array.isArray(banner.filters) &&
        device.frequencyData &&
        device.frequencyData[campaign.id]
      ) {
        device.frequency = convertFrequency(device.frequencyData, campaign.id, locationId);
      }
      device.visitTime = device.frequencyData && device.frequencyData[campaign.id] ? device.frequencyData[campaign.id].total : 0;
      device.visitTime = [String(device.visitTime)];
      const startDay = moment().startOf('day').valueOf();
      device.visitTime.push(moment(device.updatedAt) < startDay ? '0d' : '1d');
      if (isRulesMatch(banner.filters, device)) {
        if (campaign.randomBanner) {
          matched.push(banner.bannerId);
        } else {
          bannerId = banner.bannerId;
          break;
        }
      }
    }

    // if(matched.length === 2 && matched.indexOf(campaign.bannerDefaultId>-1)){
    //     matched = [matched[0]];
    // }
    // If none matched, get default banner
    if (campaign.randomBanner) {
      bannerId = matched[Math.floor(Math.random() * matched.length)];
    }
    if (!bannerId) {
      bannerId = campaign.bannerDefaultId;
    }
    // So bad, there is no default
    if (!bannerId) {
      debug('There is no available banner', campaign, device);
      return Promise.resolve({});
    }

    const banner = await BannerCached.findById(bannerId.toString());
    if (!banner || !banner.id) {
      debug('There is no available banner', campaign, device);
    }

    return banner || {};
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
  const getFrequency = async (mac, filteredCampaigns) => {
    const Tracking = Ad.app.models.Tracking;
    const esTrackingConn = Tracking.getDataSource().connector;
    const esTrackingDb = esTrackingConn.db;
    const frequencyMac = await Promise.promisify(esTrackingDb.search).call(esTrackingDb, {
      index: esTrackingConn.searchIndex,
      type: Tracking.modelName,
      body: {
        query: {
          bool: {
            must: { term: { mac: mac ? mac : "null" } },
            should: lodash.map(filteredCampaigns, (item) => { return { term: { 'meta.campaignId': item.campaignId } } })
          }
        },
        size: 0,
        aggs: {
          "campaign": {
            "terms": { "field": "meta.campaignId" },
            "aggs": {
              "location": {
                "terms": { "field": "meta.locationId", size: 100 },
                "aggs": {
                  "clickAggs": {
                    "nested": { "path": "actions" },
                    "aggs": { "action": { "terms": { "field": "actions.action", "size": 2 } } }
                  }
                }
              }
            }
          }
        }
      },
    });
    let frequencyObj = {};
    frequencyMac.aggregations.campaign.buckets.forEach((camp) => {
      frequencyObj[camp.key] = { total: 0 };
      camp.location.buckets.forEach((loc) => {
        frequencyObj[camp.key][loc.key] = 0;
        loc.clickAggs.action.buckets.forEach((act) => {
          if (act.key === 'click') {
            frequencyObj[camp.key][loc.key] = act.doc_count;
            frequencyObj[camp.key].total += act.doc_count;
          }
        });
      });
    });
    return frequencyObj;
  };

  const pick = async (location, device, campaignId) => {
    const campaigns = location.activeCampaigns || [];
    if (!campaigns.length) {
      return Promise.reject({ message: 'No active campaign', statusCode: 400 });
    }

    let ignoreFilterAudience = false;
    let filteredCampaigns = campaigns;

    // Find requested campaign
    if (campaignId && campaignId !== 'undefined' && campaignId !== 'null') {
      filteredCampaigns = campaigns.filter(i => i.campaignId === campaignId);
      if (filteredCampaigns.length) {
        ignoreFilterAudience = true;
      } else {
        // No requested campaign
        filteredCampaigns = campaigns;
      }
    }

    // Find campaign after campaign
    // let afterCampaignIdx = 0;
    // if (aCampaignId && aCampaignId !== 'undefined' && aCampaignId !== 'null') {
    //   const index = lodash.findIndex(
    //     campaigns,
    //     i => i.campaignId === aCampaignId,
    //   );
    //   afterCampaignIdx = (index + 1) % campaigns.length;
    //   filteredCampaigns = campaigns.slice(afterCampaignIdx);
    // }

    // Filter campaigns by audience
    if (!ignoreFilterAudience) {
      // device.frequencyData = await getFrequency(device.mac, filteredCampaigns);
      filteredCampaigns = getMatchedCampaign(filteredCampaigns, location.id, device);
    }

    // No matched, get first available campaign
    if (!filteredCampaigns.length) {
      debug('No campaign match audience, run first active');
      // filteredCampaigns = campaigns.slice(afterCampaignIdx);
      filteredCampaigns = campaigns;
    }

    const app = Ad.app;
    const CampaignCached = app.models.CampaignCached;
    const campaign = await CampaignCached.findById(
      filteredCampaigns[0].campaignId,
    );
    // if(!device.frequencyData){
    //     device.frequencyData = await getFrequency(device.mac, filteredCampaigns);
    // }
    const banner = await getMatchedBanner(campaign, location.id, device);

    return { campaign, banner };
  };

  const pickShare = async ({ share, ap, device, location, campaignId }) => {
    let { currentCount, value } = share;
    currentCount = currentCount ? parseInt(currentCount) : 1;
    const defaultCurrentCount = lodash.cloneDeep(currentCount);
    const shareValue = parseInt(value ? value : 0);
    const calShareDsp = Math.round(10 * shareValue / 100);
    const calSelf = 10 - calShareDsp;

    if (1 <= currentCount <= 10) {
      currentCount = currentCount + 1;
    }

    if (currentCount === 11) {
      currentCount = 1;
    }

    if (defaultCurrentCount <= calSelf) {
      return Promise.all([device, pick(location, device, campaignId), currentCount]);
    }
    return Promise.all([device, {}, currentCount, { isDSP: true }]);
  };

  Ad.pick = (
    mac,
    ap,
    locationId,
    campaignId,
    // aCampaignId,
    selector,
    format,
    origin,
    req,
    res,
    cb,
  ) => {
    mac = standardizeMacAddress(mac);
    ap = standardizeMacAddress(ap);// doing report
    allowCrossOrigin(res, origin);

    const { LocationCached, LocationShareCached, Device } = Ad.app.models;

    Promise.all([
      LocationCached.findById(locationId),
      LocationShareCached.findById(locationId),
      mac ? Device.findById(Device.toId(mac)) : null
    ])
      .spread((location, share, device) => {
        location = location && location.toJSON();
        share = share && share.toJSON();
        device = device && device.toJSON();

        if (!location || !location.id) {
          return Promise.reject({
            message: 'Location not exists',
            statusCode: 400,
          });
        }

        const deviceOptions = extractDeviceOptions(req.useragent);
        device = lodash.merge(
          { currentLocationId: locationId, selector },
          device,
          { audience: deviceOptions }
        );

        if (share && share.id) {
          return pickShare({ share, ap, device, location, campaignId });
        }

        return Promise.all([device, pick(location, device, campaignId)]);
      })
      .then(async ([device, { campaign, banner }, currentCount, isDSP]) => {
        if (isDSP) {
          // banner: {id: 'dspTag', htmlCode}
          axios.post(`${Ad.app.get('dspHost')}/api/adunit/tag`, { venue: locationId, mac, ap, model: req.body.model || req.query.model })
          .then((jstag) => {
            const htmlCode = jstag.data;
            if (format === 'html') {
              res.header('Content-Type', 'text/html');
              res.send(htmlCode);
            } else if (format === 'json') {
              res.header('Content-Type', 'application/json');
              res.json(render('json', locationId, 'dsp', { id: 'dspTag', htmlCode }, device));
            } else {
              res.header('Content-Type', 'text/javascript');
              res.send(render('js', locationId, 'dsp', { id: 'dspTag', htmlCode }, device));
            }
          });
        } else {
          if (format === 'html') {
            res.header('Content-Type', 'text/html');
            res.send(banner.htmlCode);
          } else if (format === 'json') {
            res.header('Content-Type', 'application/json');
            res.json(render('json', locationId, campaign, banner, device));
          } else {
            res.header('Content-Type', 'text/javascript');
            res.send(render('js', locationId, campaign, banner, device));
          }
        }

        if (currentCount) {
          try {
            await LocationShareCached.upsert({ id: locationId, currentCount });
          } catch (error) {
            debug(error, 'set current count failed');
          }
        }
      })
      .catch((err) => {
        debug(err, 'Pick banner failed');
        if (!format) {
          res.header('Content-Type', 'text/javascript');
          res.send(render('js', locationId, { id: '', brandId: '', locations: [{ locationId }] }, { id: '', htmlCode: err.message }, {}));
        } else {
          cb(err);
        }
      });
  };
  Ad.remoteMethod('pick', {
    description: 'Pick banner',
    accepts: [
      { arg: 'm', type: 'string', description: 'Device MAC address' },
      { arg: 'ap', type: 'string', description: 'AP MAC address' },
      { arg: 'li', type: 'string', description: 'Location ID', required: true },
      { arg: 'ci', type: 'string', description: 'Campaign ID' },
      // { arg: 'aci', type: 'string', description: 'After Campaign ID' },
      { arg: 'selector', type: 'string', description: 'Optional selector' },
      {
        arg: 'f',
        type: 'string',
        description: 'Response format: js (default), json or html',
      },
      {
        arg: 'o',
        type: 'string',
        description: 'Origin (to allow cross origin)',
      },
      { arg: 'req', type: 'object', http: { source: 'req' } },
      { arg: 'res', type: 'object', http: { source: 'res' } },
    ],
    http: { path: '/pick' },
  });

  const generateHtml = () => {
    return '<!doctype html><html>' +
      '<head><meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="keywords" /><title>WiFiEX4U</title></head>' +
      '<body>' +
      '<script type="text/javascript">' +
      'alert("Please check your email to get Access Link!");window.location.replace("https://mail.google.com")' +
      '</script>' +
      '</body></html>';
  }
  Ad.sendEmail = (mac, id_token, name, email, click, loginUrl, res) => { //Send Tracking click here
    res.header('Content-Type', 'text/html');
    let params = getJsonFromStringQuery(click);
    let formInput = '';
    lodash.forEach(params, (val, key) => {
      formInput += '<input type="hidden" name="' + key + '" value="' + val + '"/>'
    });
    let emailHtml = '<html><label>Xin chào ' + name + ', cám ơn bạn đã đăng nhập vào hệ thống</label></br>' +
      '<p>Đây là <form action="' + loginUrl + '"><input type="hidden" name="redirect" value="' + click + '"></input><input type="hidden" name="email" value="' + email + '"></input><input type="submit" value="MÃ TRUY CẬP WIFI" /></form> của bạn</p></html>';
    sendEmail(email, "MÃ TRUY CẬP WIFI ✔", emailHtml).then(() => {
      res.header('Content-Type', 'text/html');
      res.send(generateHtml());
    }).catch((err) => {
      console.log(err);
    })
  };
  Ad.remoteMethod('sendEmail', {
    accepts: [
      { arg: 'mac', type: 'string', description: 'MAC Address', require: true },
      { arg: 'id_token', type: 'string', description: 'The ID token' },
      { arg: 'name', type: 'string', description: 'Full Name' },
      { arg: 'email', type: 'string', description: 'Email' },
      { arg: 'click', type: 'string', description: 'Action Click' },
      { arg: 'loginUrl', type: 'string', description: 'Login Url' },
      { arg: 'res', type: 'object', 'http': { source: 'res' } }
    ],
    http: { path: '/sendEmail', verb: 'post' },
    // returns: [
    //   {arg: 'body', http: { target: 'body' }, root: true},
    //   {arg: 'Content-Type', type: 'string', http: { target: 'header' }}
    // ]
  });
};
function getJsonFromStringQuery(string) {
  let query = string.split("?")[1];
  let result = {};
  decodeURIComponent(query).split("&").forEach((part) => {
    let item = part.split("=");
    result[item[0]] = decodeURIComponent(item[1]);
  });
  return result;
}
function onSignIn(googleUser) {
  // Useful data for your client-side scripts:
  var profile = googleUser.getBasicProfile();
  var loginUrl = 'http://10.200.0.1:81/login';
  var click = encodeURIComponent(M.urlFor('click', { m: params.macFieldName, name: profile.getName(), email: profile.getEmail() }));
  console.log("mac=" + params.macFieldName + "&id_token=" + googleUser.getAuthResponse().id_token + "&name=" + profile.getName() + "&email=" + profile.getEmail() + "&=loginUrl" + loginUrl + "&click=" + click);
  Util.ajax({
    method: 'POST',
    url: location.origin + '/api/a_d/sendEmail/',
    json: true,
    data: "mac=" + params.macFieldName + "&id_token=" + googleUser.getAuthResponse().id_token + "&name=" + profile.getName() + "&email=" + profile.getEmail() + "&loginUrl=" + loginUrl + "&click=" + click
  });
};
