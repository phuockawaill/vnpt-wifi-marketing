const path = require('path');
const loopback = require('loopback');
const lodash = require('lodash');
const moment = require('moment');

const debug = require('debug')('app:util');
// const error = require('debug')('err:util');

const jsonMeta = (location, campaign, banner) => ({
  ai: (campaign.ownedBy || '').toString(),
  ri: campaign.brandId.toString(),
  ci: campaign.id.toString(),
  cci: campaign.categoryId,
  bi: banner.id.toString(),
  li: location.locationId,
  lci: location.categoryId,
  cti: location.cityId
});
const embedCodeHtml = (banner) => {
  if (banner.type === 'Template') {
      const returnBanner = '<!DOCTYPE html>' +
      '<html lang="en">' +
      '<head>' +
      '<meta charset="UTF-8" />' +
      '<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=0">' +
      '<style type="text/css">' + banner.css + '</style>' +
      '<script type="text/javascript">' + banner.js + '</script>' +
      '<script type="text/javascript">"use strict";function getJsonFromUrl(){var query = location.search.substr(1);var result = {};decodeURIComponent(query).split("&").forEach(function(part) {var item = part.split("=");result[item[0]] = decodeURIComponent(item[1]);});return result;}</script>' +
      '</head>' +
      '<body style="margin: 0px">' + banner.htmlCode + '</body>' +
      '</html>';
      return returnBanner;
  }
    return banner.htmlCode.replace('</head>', '<script type="text/javascript">"use strict";function getJsonFromUrl(){var query = location.search.substr(1);var result = {};decodeURIComponent(query).split("&").forEach(function(part) {var item = part.split("=");result[item[0]] = decodeURIComponent(item[1]);});return result;}</script></head>');
};

const jsonV1000 = (location, campaign, banner, device) => {
  const result = {
    html: embedCodeHtml(banner),
    adMeta: jsonMeta(location, campaign, banner),
    device,
    campaignMeta: {
      ggAppClientId: lodash.get(campaign, 'gg.clientId'),
      ggEmailLogin: lodash.get(campaign, 'gg.emailLogin'),
      fbAppId: lodash.get(campaign, 'fb.appId'),
      fbAppDomain: lodash.get(campaign, 'fb.appDomain'),
      fbFeed: lodash.get(campaign, 'fb.feed'),
      impressionUrls: []
    }
  };

  let impressionUrls = [];
  if (typeof location.impressionRedirectUrl === 'string') {
    impressionUrls = [location.impressionRedirectUrl];
  } else if (Array.isArray(location.impressionRedirectUrl)) {
    impressionUrls = location.impressionRedirectUrl;
  }
  result.campaignMeta.impressionUrls = impressionUrls;
  result.campaignMeta.ggEmailLogin = result.campaignMeta.ggEmailLogin ? 'true' : '';
  return result;
};

const jsonV1000DSP = (locationId, banner, device) => {
  const result = {
    html: embedCodeHtml(banner),
    adMeta: {
      bi: banner.id.toString(),
      li: locationId
    },
    device,
    campaignMeta: {}
  };
  return result;
};

const jsTemplate = loopback.template(
  path.resolve(__dirname, '../templates/pick.min.js'),
);
function render(format, locationId, campaign, banner, device) {
  let result;
  if (campaign === 'dsp') {
    result = jsonV1000DSP(locationId, banner, lodash.pick(device, ['audience', 'fb', 'google']));
  } else {
    const [location] = campaign.locations.filter(
      i => i.locationId === locationId,
    );
    result = jsonV1000(location, campaign, banner, lodash.pick(device, ['audience', 'fb', 'google']));
  }

  if (!device || !device.createdAt) {
    lodash.set(result, 'adMeta.in', true);
  }

  if (format === 'json') return result;
  return jsTemplate({ locals: result });
}

const audienceFields = [
  'name',
  'phone',
  'email',
  'gender',
  'age',
  'income',
  'device',
  'os',
  'phoneVerified',
  'phoneCarrier',
  'emailVefiried',
];
const metaFields = ['campaignId', 'locationId', 'bannerId'];
const getFieldValue = (device, field) => {
  let value;
  if (audienceFields.indexOf(field) > -1) {
    value = lodash.get(device, `audience.${field}`, []);
  } else if (metaFields.indexOf(field) > -1) {
    value = lodash.get(device, `meta.${field}`, []);
  } else {
    value = lodash.get(device, field, []);// survey
  }

  if (!Array.isArray(value)) {
    value = [value];
  }

  return value.map(item => item && item.toString());
};
const isRuleMatch = (rule, device) => {
  if (Array.isArray(rule.and) && rule.and.length) {
    let match = true;
    let i = 0;
    while (match && i < rule.and.length) {
      match = match && isRuleMatch(rule.and[i], device);
      i += 1;
    }
    return match;
  }

  if (Array.isArray(rule.or) && rule.or.length) {
    let match = false;
    let i = 0;
    while (!match && i < rule.or.length) {
      match = match || isRuleMatch(rule.or[i], device);
      i += 1;
    }
    return match;
  }

  if (!rule.field) {
    return true;
  }

  let match = false;
  let ruleValue = rule.value;
  if (rule.field === 'range') {
      let startTime, endTime, currentTime = moment().valueOf();
      if (ruleValue.type === 'datetime') {
          startTime = moment(ruleValue.scheduleFrom).valueOf();
          endTime = ruleValue.endTime > ruleValue.startTime ? moment(ruleValue.scheduleTo).endOf('day').valueOf() : moment(ruleValue.scheduleTo).add(25, 'hours').endOf('day').valueOf();
          if (currentTime < startTime || currentTime > endTime) {
            return false;
          }
      }
      startTime = moment().startOf('day').hour(ruleValue.startTime).valueOf();
      if (ruleValue.endTime > ruleValue.startTime) {
          endTime = moment().startOf('day').hour(ruleValue.endTime).valueOf();
      } else if (ruleValue.endTime === ruleValue.startTime) {
          endTime = moment().startOf('day').hour(ruleValue.endTime + 1).valueOf();
      } else {
          endTime = moment().startOf('day').hour(ruleValue.endTime + 24).valueOf();
      }
    return (currentTime > startTime && currentTime < endTime);
  } else {
      const currentValue = getFieldValue(device, rule.field);
      if (!Array.isArray(ruleValue)) {
        ruleValue = [rule.value];
      }
      debug('matching %s %o with %o', rule.field, ruleValue, currentValue);

      ruleValue.forEach((value) => {
        if (match || typeof value === 'undefined') return;
        if (
          value === '$$hasValue' &&
          currentValue.length &&
          currentValue.indexOf('other') < 0
        ) {
          match = true;
          return;
        }
        if (
          value === '$$noValue' &&
          (!currentValue.length || currentValue.indexOf('other') > -1)
        ) {
          match = true;
          return;
        }
        match = currentValue.indexOf(value) > -1;
      });
  }
  return match;
};
const isRulesMatch = (rules, device) => {
  debug('matching device %o', device);

  if (!rules || !rules.length) {
    return true;
  }
  return isRuleMatch(rules[0], device);
};

module.exports = {
  render,
  isRulesMatch,
  embedCodeHtml
};
