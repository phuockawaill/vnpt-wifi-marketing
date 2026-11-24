const ObjectId = require('mongodb').ObjectId;
const lodash = require('lodash');
const uuid = require('uuid');
const Promise = require('bluebird');
const moment = require('moment');
const axios = require('axios');

const {
  getMethodArguments,
  standardizeMacAddress,
  standardizeGender,
  standardizeURL,
  extractDeviceOptions,
  standardizePhone,
  phoneToCarrier,
  sendEmail,
  sendMarketingEmail
} = require('../import/utils');
const { allowCrossOrigin } = require('../import/access-utils');
const debug = require('debug')('app:model:tracking');

const trackingReportModels = ['draytek', 'mikrotik'];
// const error = require('debug')('err:model:tracking');

module.exports = (Tracking) => {
  Tracking.IMPRESSION = 'impression';
  Tracking.CLICK = 'click';
  Tracking.COLLECT = 'collect';
  Tracking.VISIT = 'visit';

  Tracking.actions = [Tracking.IMPRESSION, Tracking.CLICK, Tracking.COLLECT, Tracking.VISIT];
  Tracking.realActions = [Tracking.CLICK, Tracking.COLLECT];

  Tracking.defineProperty('advertiserId', { type: ObjectId });
  Tracking.defineProperty('brandId', { type: ObjectId });
  Tracking.defineProperty('publisherId', { type: ObjectId });
  Tracking.defineProperty('campaignId', { type: ObjectId });
  Tracking.defineProperty('locationId', { type: ObjectId });
  Tracking.defineProperty('bannerId', { type: ObjectId });

  Tracking.disableRemoteMethodByName('create');
  Tracking.disableRemoteMethodByName('upsert');
  Tracking.disableRemoteMethodByName('updateAll');
  Tracking.disableRemoteMethodByName('updateAttributes');
  Tracking.disableRemoteMethodByName('find');
  Tracking.disableRemoteMethodByName('findById');
  Tracking.disableRemoteMethodByName('findOne');
  Tracking.disableRemoteMethodByName('deleteById');
  Tracking.disableRemoteMethodByName('count');
  Tracking.disableRemoteMethodByName('exists');
  Tracking.disableRemoteMethodByName('createChangeStream');

  Tracking.nextSessionId = () => uuid.v1().replace(/-/g, '');

  Tracking.fieldMappings = {
    mac: 'm',
    ap: 'ap',
    siteId: 'si',
    isNew: 'in',
    advertiserId: 'ai',
    advertiserName: 'an',
    publisherId: 'pi',
    publisherName: 'pn',
    brandId: 'ri',
    brandName: 'rn',
    bannerId: 'bi',
    bannerName: 'bn',
    campaignId: 'ci',
    campaignName: 'cn',
    campaignCategoryId: 'cci',
    campaignCategoryName: 'ccn',
    locationId: 'li',
    locationName: 'ln',
    locationCategoryId: 'lci',
    locationCategoryName: 'lcn',
    cityId: 'cti',
    cityName: 'ct',
    google: 'google',
    fbCode: 'code', // facebook
    website: 'host', // hostname
    keywords: 'keywords' // keywords
  };

  Tracking.extractTrackingData = ({ query }) => {
    const result = { action: {}, meta: {}, audience: {} };
    lodash.forEach(Tracking.fieldMappings, (value, key) => {
      if (value in query) {
        result[key] = query[value];
      }
    });
    return result;
  };

  const renameFields = (params) => {
    Object.keys(Tracking.fieldMappings).forEach((key) => {
      if (typeof params[Tracking.fieldMappings[key]] !== 'undefined') {
        params[key] = params[Tracking.fieldMappings[key]];
      }
      if (key !== Tracking.fieldMappings[key]) { delete params[Tracking.fieldMappings[key]]; }
    });
    return params;
  };
  const standardizeTrackingData = (data) => {
    if (data.mac) {
      data.mac = standardizeMacAddress(data.mac);
    }
    if (data.gender) {
      data.gender = standardizeGender(data.gender);
    }
    if (data.phone) {
      data.phone = standardizePhone(data.phone);
      data.phoneCarrier = phoneToCarrier(data.phone);
    }
    return lodash.omitBy(
      data,
      value => typeof value === 'undefined' || value === '',
    );
  };
  const shouldTracking = async (opts) => {
    if (!opts.mac) return true;
    if (opts.shouldIgnore) return false;

    const AdSession = Tracking.app.models.AdSession;

    const trackingId = `${opts.mac}.${opts.actionType}`;
    const shouldIgnore = await AdSession.get(trackingId);
    if (shouldIgnore) return false;

    await AdSession.set(trackingId, true, { ttl: 5 * 1000 }); // 5 secs
    return true;
  };

  const trackingHandler = async (params) => {
    let redirectUrl = params.redirect;
    delete params.redirect;

    const { TrackingCached, CampaignCached, SelectOption, Visit } = Tracking.app.models;

    if (params.actionType === Tracking.VISIT) {
      const compareKey = params.keywords ? params.keywords.toLocaleLowerCase().replace(/ /g, '') : '';
      const categories = await SelectOption.find({ where: { type: 'website_category' } });
      let matchCat = '';
      for (let i = 0; i < categories.length; i++) {
          if (new RegExp(`^(?=.*?(${categories[i].options.regexp})).*$`).test(compareKey)) {
              matchCat = categories[i].value;
              break;
          }
      }
      const saveHostName = await axios.get(`http://tldextract.appspot.com/api/extract?url=${params.website}`);
      await Promise.all([
        TrackingCached.create({ mac: params.mac, actionType: params.actionType }),
        Visit.create({
            mac: params.mac,
            site: saveHostName.data ? `${saveHostName.data.domain}.${saveHostName.data.suffix}` : params.website,
subject: matchCat || 'unknown',
            metaKeywords: params.keywords,
            bannerId: params.bannerId,
            campaignId: params.campaignId,
            locationId: params.locationId,
            createdAt: moment().valueOf()
        })
    ]);
      return;
    }

    const [shouldTrack, campaign] = await Promise.all([
      shouldTracking(params),
      params.campaignId ? CampaignCached.findById(params.campaignId) : {}
    ]);

    const location =
      params.locationId &&
      !redirectUrl &&
      (campaign.locations || [])
        .filter(i => i.locationId === params.locationId)[0];

    if (location && location.reportLocationId) {
      params.realLocationId = params.locationId;
      params.locationId = location.reportLocationId;
    }

    if (!redirectUrl) {
      redirectUrl = location && location[`${params.actionType}RedirectUrl`];
      if (Array.isArray(redirectUrl)) {
        redirectUrl = redirectUrl[0];
      }
      redirectUrl = redirectUrl || campaign.landingPageUrl;
    }

    if (location && location.redirectUrl) {
        redirectUrl = location.redirectUrl;
    }
    // debug(params.mac, 'tracking', params.actionType);
    await Promise.resolve().then(
      () => shouldTrack && TrackingCached.create(params)
    );
    if (params.google && params.google.email && campaign.gg && campaign.gg.sendEmail) {
        sendEmail(params.google.email, 'Genex Smart WiFi Marketing Platform – Location & Audience Targeting', campaign.gg.emailTemplate).then(() => {
            console.log('sent Email');
        }).catch((err) => {
            console.log('Email not sent');
            console.log(err);
        });
    }

    if (Tracking.realActions.indexOf(params.actionType) > -1) {
      const groupData = await SelectOption.findById(params.locationCategoryId);
      if (groupData.options.isTrackUsage && trackingReportModels.indexOf(groupData.options.hotspotType) > -1) {
        try {
          console.log('POST tracking', {
            mac: params.mac.toLowerCase(),
            campaign: params.campaignId,
            location: params.locationId,
            ap: params.ap.toLowerCase()
          });
          axios.post(`${Tracking.app.get('reportUsageURL')}/api/v1/tracking`, {
            mac: params.mac.toLowerCase(),
            campaign: params.campaignId,
            location: params.locationId,
            ap: params.ap.toLowerCase()
          });
        } catch (error) {
          console.log('POST tracking error!', error);
        }
      }
    }

    return standardizeURL(redirectUrl);
  };

  const getCurrentSessionId = async (mac, campaignId, bannerId) => {
    if (!mac || !campaignId) return Tracking.nextSessionId();

    const AdSession = Tracking.app.models.AdSession;

    const key = `${mac}.${campaignId}.${bannerId}.sessionId`;
    let sessionId = await AdSession.get(key);
    if (!sessionId) sessionId = Tracking.nextSessionId();

    await AdSession.set(key, sessionId, { ttl: 5 * 60 * 1000 }); // 5 mins
    return sessionId;
  };

  Tracking.tracking = (...args) => {
    const callback = args.pop();

    let params = getMethodArguments(Tracking, 'tracking', true, args);
    const { req, res } = params;
    delete params.req;
    delete params.res;

    params.ip = req.ipAddr;
    if (params.ip && params.ip.split(',').length > 1) {
      params.ip = params.ip.split(',')[1].trim();
    }
    params = renameFields(params);
    params = standardizeTrackingData(params);
    lodash.extend(params, extractDeviceOptions(req.useragent));
    allowCrossOrigin(res);
    // Exception survey params
    if (params.survey && typeof params.survey === 'string') {
        if (params.survey.split('||').length > 1) {
            console.log('before fix survey', params.survey);
            const arrSurvey = params.survey.split('||');
            params.survey = {};
            for (let i = 0; i < arrSurvey.length; i++) {
                if (i % 2) { // value
                    params.survey[arrSurvey[i - 1]] = arrSurvey[i];
                }
            }
            console.log('fix params survey', params.survey);
        } else {
            // debug(params.survey, 'parms survey wrong', params);
            delete params.survey;
        }
    }
    // Exception google params
    if (params.google && typeof params.google === 'string') {
        if (params.google.split('||').length > 1) {
            console.log('before fix google', params.google);
            const arrSurvey = params.google.split('||');
            params.google = {};
            for (let i = 0; i < arrSurvey.length; i++) {
                if (i % 2) { // value
                    params.google[arrSurvey[i - 1]] = arrSurvey[i];
                }
            }
            console.log('fix params google', params.google);
        } else {
            // debug(params.google, 'parms google wrong', params);
            delete params.google;
        }
    }
    // debug(params.mac, 'call tracking', params);
    if (params.model === 'mikrotik') {
      console.log('tracking ---> ', JSON.stringify(params));
    }
    getCurrentSessionId(params.mac, params.campaignId, params.bannerId)
      .then((sessionId) => {
        params.sessionId = sessionId;
        // debug(params.mac, 'sessionId', sessionId);
      })
      .then(() => trackingHandler(params))
      .then((redirectUrl) => {
        if (
          redirectUrl &&
          Tracking.realActions.indexOf(params.actionType) > -1
        ) {
          // debug(params.mac, 'redirect', redirectUrl);
          if (redirectUrl.indexOf('redirect=') > -1) {
              const app = Tracking.app;
              res.redirect(`${redirectUrl}&server=${app.get('appScheme')}//${app.get('appHost')}&mac=${params.mac}`);
              return;
          }
          if (params.loginCode) {
            // return login code page
            let loginCode;
            let resHTML = '<!DOCTYPE html><html><head lang="en"><meta name="viewport" content="width=device-width initial-scale=1.0 maximum-scale=1.0"><meta charset="UTF-8"><title>Redirecting...</title><style>html{height: 100%;background: white;}body{padding: 0;margin: 0;}.center{text-align: center;}@import url(https://fonts.googleapis.com/css?family=Abel);.chart-three{width: 200px;height: 200px;margin: 0;position: relative;}.chart-three.animate svg .circle-foreground{animation: offset 2.9s ease-in-out forwards;animation-delay: 0s;}.chart-three.animate figcaption:after{animation: chart-three-label 2.9s steps(100) forwards;animation-delay: 0s;}.chart-three svg{width: 100%;height: 100%;}.chart-three svg .circle-background,.chart-three svg .circle-foreground{r: 87.5px;cx: 50%;cy: 50%;fill: none;stroke: #305556;stroke-width: 25px;}.chart-three svg .circle-foreground{stroke: url(#test);stroke-dasharray: 549.5px 549.5px;stroke-dashoffset: 549.5px;stroke-linecap: round;transform-origin: 50% 50%;transform: rotate(-90deg);}.chart-three figcaption{display: inline-block;width: 100%;height: 2.5rem;overflow: hidden;text-align: center;color: #c6e8d7;position: absolute;top: calc(50% - 1.25rem);left: 0;font-size: 0;font-weight: bold;}.chart-three figcaption:after{display: inline-block;content: "0%\a 1%\a 2%\a 3%\a 4%\a 5%\a 6%\a 7%\a 8%\a 9%\a 10%\a 11%\a 12%\a 13%\a 14%\a 15%\a 16%\a 17%\a 18%\a 19%\a 20%\a 21%\a 22%\a 23%\a 24%\a 25%\a 26%\a 27%\a 28%\a 29%\a 30%\a 31%\a 32%\a 33%\a 34%\a 35%\a 36%\a 37%\a 38%\a 39%\a 40%\a 41%\a 42%\a 43%\a 44%\a 45%\a 46%\a 47%\a 48%\a 49%\a 50%\a 51%\a 52%\a 53%\a 54%\a 55%\a 56%\a 57%\a 58%\a 59%\a 60%\a 61%\a 62%\a 63%\a 64%\a 65%\a 66%\a 67%\a 68%\a 69%\a 70%\a 71%\a 72%\a 73%\a 74%\a 75%\a 76%\a 77%\a 78%\a 79%\a 80%\a 81%\a 82%\a 83%\a 84%\a 85%\a 86%\a 87%\a 88%\a 89%\a 90%\a 91%\a 92%\a 93%\a 94%\a 95%\a 96%\a 97%\a 98%\a 99%\a 100%\a";white-space: pre;font-size: 2.5rem;line-height: 2.5rem;background: linear-gradient(to right, #00bc9b 0%, #5eaefd 100%);-webkit-background-clip: text;-webkit-text-fill-color: transparent;}@keyframes chart-three-label{100%{transform: translateY(-250rem);}}@keyframes offset{100%{stroke-dashoffset: 0;}}#container{display: flex;align-items: center;justify-content: center;margin-top: 20px;margin-bottom: 20px;}figure{margin: 1rem !important;}figcaption{font-family: "Abel", sans-serif;}@media screen and (max-width: 999px){.landscape img{height: auto;width: 50%;}.landscape p{font-size: 20px;}.landscape #percentage{top: 5px;}.landscape #connecting{font-size: 20px;}.portrait img{height: auto;width: 70%;}.portrait p{font-size: 20px;}}@media screen and (min-width: 1000px){p{font-size: 25px;}img{height: 100%;width: auto;}}</style></head><body class="portrait"><p style="display:none;">Success</p><div style="text-align: center; padding-top: 20px;"><img src="http://genexwifi.com/assets/images/logo/logo-genexwifi-flatform.png"/></div><div id="container" class="center"><figure class="chart-three animate"><svg role="img" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><title>Connecting</title><desc>Connecting</desc><defs><linearGradient id="test"><stop offset="0%" stop-color="#00bc9b"/><stop offset="100%" stop-color="#5eaefd"/></linearGradient></defs><circle class="circle-background"/><circle class="circle-foreground"/></svg><figcaption>100% of all males like donuts.</figcaption></figure></div><div style="text-align: center"><p style="font-weight: bold">Login Successfully</p></div>';
            switch (params.loginCode.type) {
              case 'extreme':
                loginCode = `<form name="frmExtremeLogin" action="${params.loginCode.loginurl}" method="POST"> <input size="20" name="f_agree" id="f_agree" type="hidden"> <input size="64" name="f_hs_server" id="f_hs_server" type="hidden" value="${params.loginCode.f_hs_server}"> <input name="f_curr_time" id="f_curr_time" type="hidden" value="${Math.floor(new Date().getTime() / 1000)}"> <input name="f_Qv" id="f_Qv" type="hidden" value="${decodeURIComponent(params.loginCode.f_Qv)}"> <input name="submit" value="I Agree" type="submit" style="opacity:0;" class="btn primary" id="submitExremeForm"></form><script>window.setTimeout(function (){document.frmExtremeLogin.elements['f_curr_time'].value = Math.floor(new Date().getTime() / 1000); document.getElementById('submitExremeForm').click();}, 3000);</script>`;
                break;
              case 'zyxelNebula':
                loginCode = `<form name="frmZyxelLogin" action="${params.loginCode.loginurl}" method="POST"> </form><script>window.setTimeout(function (){document.frmZyxelLogin.submit();}, 3000);</script>`;
                break;
              default: loginCode = `<script>window.setTimeout(function (){var A=document.createElement("a");A.setAttribute("href", "${redirectUrl}");var Body=document.getElementsByTagName("body");console.log(Body);if (Body.length > 0){Body=Body[0];}else{Body=document.createElement("body");document.getElementsByTagName("html")[0].appendChild(Body);}Body.appendChild(A);A.click();}, 3000);</script>`;
            }
            resHTML += `${loginCode}<script>setInterval(function (){if (window.innerWidth < 1000 && (window.innerWidth > window.innerHeight)){document.body.className="landscape";}else{document.body.className="portrait";}}, 200);</script></body></html>`;
            console.log('run login code for AP', typeof params.loginCode, params.loginCode);
            res.header('Content-Type', 'text/html');
            res.header('Access-Control-Request-Headers', 'text/html');
            res.send(resHTML);
            // res.redirect(redirectUrl);
            return;
          }
          const { Device, SessionCached, Location } = Tracking.app.models;
          // Location.findById(params.locationId).then((location) => {
          //   if (location && location.createdBy.toString() === '5f0c040e0625bf6b8ff9280c') {
          //     console.log('send BBH data ', `https://tool.botup.io/v1/genex?mac=${params.mac}&location_id=${params.locationId}&location_name=${encodeURIComponent(location.name)}&router=${params.ap}`);
          //     axios.get(`https://tool.botup.io/v1/genex?mac=${params.mac}&location_id=${params.locationId}&location_name=${encodeURIComponent(location.name)}&router=${params.ap}`)
          //     .then((response) => {
          //       // handle success
          //       console.log('send to BBH ', response.data);
          //     })
          //     .catch((error) => {
          //       // handle error
          //       console.log('send to BBH ERROR', error);
          //     });
          //   }
          // });
          if (params.model === 'ruijie') {
            SessionCached.findById(Device.toId(standardizeMacAddress(params.mac))).then((sess) => {
                if (sess && sess.id) {
                  console.log('--->Ruijie 2.click upsert session', standardizeMacAddress(params.mac), JSON.stringify(sess));
                  sess.redirect = redirectUrl;
                  SessionCached.upsert(sess).then(() => res.redirect(sess.loginurl || redirectUrl));
                } else {
                  res.redirect(redirectUrl);
                }
            });
          } else {
            res.redirect(redirectUrl);
          }
          if (params.survey && params.survey.award && params.email) {
            // http://cloud.genexwifi.com/lib/game-lucky-genex/index.html
            const name = params.name;
            const award = params.survey.award;
            const code_award = Device.toId(standardizeMacAddress(params.mac));
            const shareLink = `https://www.facebook.com/share.php?u=${encodeURIComponent(`http://cloud.genexwifi.com/lib/game-lucky-genex/index.html?ref=${Device.toId(standardizeMacAddress(params.mac))}`)}`;
            const emailTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" class=" js flexbox flexboxlegacy canvas canvastext webgl no-touch geolocation postmessage websqldatabase indexeddb hashchange history draganddrop websockets rgba hsla multiplebgs backgroundsize borderimage borderradius boxshadow textshadow opacity cssanimations csscolumns cssgradients cssreflections csstransforms csstransforms3d csstransitions fontface generatedcontent video audio localstorage sessionstorage webworkers no-applicationcache svg inlinesvg smil svgclippaths responsejs " style=""> <head> <meta http-equiv="Content-type" content="text/html; charset=utf-8"/> <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/> <meta http-equiv="X-UA-Compatible" content="IE=edge"/> <meta name="format-detection" content="date=no"/> <meta name="format-detection" content="address=no"/> <meta name="format-detection" content="telephone=no"/> <title>Thư chúc mừng</title> <style type="text/css" media="screen"> /* Linked Styles */ body{padding:0 !important; margin:0 !important; display:block !important; background:#1e1e1e; -webkit-text-size-adjust:none}a{color:#a88123; text-decoration:none}a.button{-webkit-appearance: button; -moz-appearance: button; appearance: button; text-decoration: none; color: initial;}p{padding:0 !important; margin:0 !important}/* Mobile styles */ @media only screen and (max-device-width: 480px), only screen and (max-width: 480px){div[class='mobile-br-5']{height: 5px !important;}div[class='mobile-br-10']{height: 10px !important;}div[class='mobile-br-15']{height: 15px !important;}div[class='mobile-br-20']{height: 20px !important;}div[class='mobile-br-25']{height: 25px !important;}div[class='mobile-br-30']{height: 30px !important;}th[class='m-td'], td[class='m-td'], div[class='hide-for-mobile'], span[class='hide-for-mobile']{display: none !important; width: 0 !important; height: 0 !important; font-size: 0 !important; line-height: 0 !important; min-height: 0 !important;}span[class='mobile-block']{display: block !important;}div[class='wgmail'] img{min-width: 320px !important; width: 320px !important;}div[class='img-m-center']{text-align: center !important;}div[class='fluid-img'] img, td[class='fluid-img'] img{width: 100% !important; max-width: 100% !important; height: auto !important;}table[class='mobile-shell']{width: 100% !important; min-width: 100% !important;}td[class='td']{width: 100% !important; min-width: 100% !important;}table[class='center']{margin: 0 auto;}td[class='column-top'], th[class='column-top'], td[class='column'], th[class='column']{float: left !important; width: 100% !important; display: block !important;}td[class='content-spacing']{width: 15px !important;}div[class='h2']{font-size: 44px !important; line-height: 48px !important;}}</style> <style type="text/css" media="only screen and (max-width: 480px)"> /* Mobile styles */ @media only screen and (max-width: 480px){[class="w320"]{width: 320px !important;}[class="mobile-block"]{width: 100% !important; display: block !important;}}</style> </head> <body class="body ui-sortable" style="padding:0 !important; margin:0 !important; display:block !important; background:#1e1e1e; -webkit-text-size-adjust:none"> <div data-section-wrapper="1" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#161616"> <center> <table data-section="1" width="600" border="0" cellspacing="0" cellpadding="0" class="mobile-shell"> <tbody> <tr> <td class="td" style="font-size:0pt; line-height:0pt; padding:0; margin:0; font-weight:normal; width:600px; min-width:600px; Margin:0" width="600"> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr> <td class="content-spacing" style="font-size:0pt; line-height:0pt; text-align:left" width="20"> </td><td> <table width="100%" border="0" cellspacing="0" cellpadding="0" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%"> <tbody> <tr> <td height="10" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%">  </td></tr></tbody> </table> <table width="100%" border="0" cellspacing="0" cellpadding="0" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%"> <tbody> <tr> <td height="10" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%">  </td></tr></tbody> </table> </td><td class="content-spacing" style="font-size:0pt; line-height:0pt; text-align:left" width="20"> </td></tr></tbody> </table> </td></tr></tbody> </table> </center> </div><div data-section-wrapper="1" border="0" cellspacing="0" cellpadding="0" class="mobile-shell"> <center> <table data-section="1" width="600" style="font-size:0pt; line-height:0pt; padding:0; margin:0; font-weight:normal; width:600px; min-width:600px; Margin:0" border="0" cellspacing="0" cellpadding="0" bgcolor="#d2973b"> <tbody> <tr> <td> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr> <td> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr> <td class="img" style="font-size:0pt; line-height:0pt; text-align:left" height="3" bgcolor="#e6ae57">  </td></tr></tbody> </table> </td></tr></tbody> </table> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr> <td class="img" style="font-size:0pt; line-height:0pt; text-align:left" width="3" bgcolor="#e6ae57"> </td><td class="img" style="font-size:0pt; line-height:0pt; text-align:left" width="10"> </td><td> <table width="100%" border="0" cellspacing="0" cellpadding="0" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%"> <tbody> <tr> <td height="15" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%">  </td></tr></tbody> </table> <div class="h2" style="color:#ffffff; font-family:Georgia, serif; min-width:auto !important; font-size:60px; line-height:64px; text-align:center" data-slot="text"> <em>Xin chúc mừng </em> </div><table width="100%" border="0" cellspacing="0" cellpadding="0" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%"> <tbody> <tr> <td height="15" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%">  </td></tr></tbody> </table> </td><td class="img" style="font-size:0pt; line-height:0pt; text-align:left" width="10"> </td><td class="img" style="font-size:0pt; line-height:0pt; text-align:left" width="3" bgcolor="#e6ae57"> </td></tr></tbody> </table> </td></tr></tbody> </table> </center> </div><div data-section-wrapper="1" border="0" cellspacing="0" cellpadding="0" class="mobile-shell"> <center> <table data-section="1" width="600" style="font-size:0pt; line-height:0pt; padding:0; margin:0; font-weight:normal; width:600px; min-width:600px; Margin:0" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff"> <tbody> <tr> <td class="content-spacing" style="font-size:0pt; line-height:0pt; text-align:left" width="20"> </td><td data-slot-container="1" class="ui-sortable"> <table width="100%" border="0" cellspacing="0" cellpadding="0" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%"> <tbody> <tr> <td height="35" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%">  </td></tr></tbody> </table> <div data-slot="text" class="h3-1-center" style="color:#1e1e1e; font-family:Georgia, serif; min-width:auto !important; font-size:20px; line-height:26px; text-align:center"> Xin chào&nbsp;${name},<br/> Bạn vừa quay trúng phần quà <b>${award}</b>,<br/> Đây là mã dự thưởng của bạn <b>${code_award}</b> <br/> </div><table width="100%" border="0" cellspacing="0" cellpadding="0" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%"> <tbody> <tr> <td height="35" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%">  </td></tr></tbody> </table> <div data-slot="text" style="color:#1e1e1e; font-family:Georgia, serif; min-width:auto !important; font-size:20px; line-height:26px; text-align:center"> Bạn vui lòng liên hệ qua email: <a href="mailto:tiennn@genexwifi.com">tiennn@genexwifi.com</a> để nhận thưởng nhé. Trân trọng! </div><table width="100%" border="0" cellspacing="0" cellpadding="0" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%"> <tbody> <tr> <td height="35" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%">  </td></tr></tbody> </table> <div data-slot="text" style="color:#1e1e1e; font-family:Georgia, serif; min-width:auto !important; font-size:20px; line-height:26px; text-align:center"> Hãy share cho bạn bè để nhận được thêm phần thưởng <br/> <a class="button" href="${shareLink}"> <img style='width: 150px;' src="data:image/png;base64,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"/> </a> </div><table width="100%" border="0" cellspacing="0" cellpadding="0" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%"> <tbody> <tr> <td height="35" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%">  </td></tr></tbody> </table> </td><td class="content-spacing" style="font-size:0pt; line-height:0pt; text-align:left" width="20"> </td></tr></tbody> </table> </center> </div></body></html>`;
            sendEmail(params.email, 'Trúng thưởng vòng quay may mắn', emailTemplate);
            console.log('Tracking params.survey', JSON.stringify(params));
          }
        } else {
          callback();
        }
      });
  };

  const audienceFields = [
    { arg: 'name', type: 'string', description: 'User`s full name' },
    { arg: 'email', type: 'string', description: 'User`s email' },
    {
      arg: 'gender',
      type: 'string',
      description: 'User`s gender (male|female)'
    },
    { arg: 'age', type: 'string', description: 'User`s age' },
    { arg: 'income', type: 'string', description: 'User`s income' },
    { arg: 'country', type: 'string', description: 'User`s nationality' },
    { arg: 'phone', type: 'string', description: 'User`s phone number' },
    { arg: 'favorite', type: 'string', description: 'User`s hobbies' },
    {
      arg: 'userType',
      type: 'string',
      description: 'User type (form|facebook|google)'
    },
    { arg: 'survey', type: 'any', description: 'Additional fields' }
  ];

  Tracking.remoteMethod('tracking', {
    description: 'Tracking a click from user',
    accepts: [
      {
        arg: 'actionType',
        type: 'string',
        description: 'Tracking action type: click, impression',
        required: true
      },

      {
        arg: 'm',
        type: 'string',
        description: 'Device MAC address',
        required: true
      },
      { arg: 'ap', type: 'string', description: 'AP MAC address' },
      { arg: 'si', type: 'string', description: 'Site ID' },
      { arg: 'in', type: 'boolean', description: 'Is this a new device?' },
      { arg: 'ai', type: 'string', description: 'Advertiser ID' },
      { arg: 'pi', type: 'string', description: 'Publisher ID' },
      { arg: 'ri', type: 'string', description: 'Brand ID', required: true },
      { arg: 'ci', type: 'string', description: 'Campaign ID', required: true },
      { arg: 'cci', type: 'string', description: 'Campaign Category ID' },
      { arg: 'bi', type: 'string', description: 'Banner ID', required: true },
      { arg: 'li', type: 'string', description: 'Location ID', required: true },
      { arg: 'lci', type: 'string', description: 'Location Category ID' },
      { arg: 'cti', type: 'string', description: 'City Id' },

      // Audience
      ...audienceFields,

      // facebook
      { arg: 'code', type: 'string', description: 'Facebook code' },
      // google
      { arg: 'google', type: 'string', description: 'Google signin string' },
      // ap type
      { arg: 'model', type: 'string', description: 'Ap type flag' },

      // Handle site and keywords
      { arg: 'host', type: 'string', description: 'Location Category ID' },
      { arg: 'keywords', type: 'string', description: 'City Id' },
      // Handle redirect
      { arg: 'redirect', type: 'string', description: 'Redirect URL' },
      { arg: 'loginCode', type: 'any', description: 'Return Login Form for AP' }, // extreme
      { arg: 'req', type: 'object', http: { source: 'req' } },
      { arg: 'res', type: 'object', http: { source: 'res' } }
    ],
    http: { path: '/:actionType' }
  });

  Tracking.collect = (...args) => {
    const cb = args[args.length - 1];
    const opts = getMethodArguments(Tracking, 'collect', true, args);
    const { TrackingCached, Device } = Tracking.app.models;

    standardizeTrackingData(opts);
    opts.actionType = Tracking.COLLECT;

    const deviceOptions = extractDeviceOptions(opts.ua);
    lodash.extend(opts, deviceOptions);
    delete opts.ua;

    const res = opts.res;
    const redirectUrl = opts.redirect;
    delete opts.res;
    delete opts.redirect;

    // if(opts.survey.sendEmail){
    //     Device.findOne({ where: { mac: opts.mac } })
    //       .then((device) => {
    //           console.log('send Email success', device);
    //           if(device.audience.email){
    //             sendMarketingEmail(
    //                 "Prudential Finance <customerservice@prudentialfinance.com.vn>",
    //                 device.audience.email,
    //                 'Điều Khoản Vay Cơ Bản từ Prudential Finance',
    //                 '<p>Cám ơn bạn đã lựa chọn nhận email để đọc "Điều khoản vay cơ bản" từ chúng tôi.<p>' +
    //                 '<p>Mở file đính kèm và đọc để hiểu rõ về quyền và nghĩa vụ khi trở thành khách hàng của Prudential Finance nhé.</p>' +
    //                 '<p>Rất hân hạnh được phục vụ bạn.</p>',
    //             )
    //           }
    //       })
    //       .catch((err) => {
    //         console.log('get user info failed', err);
    //       });
    // }
    shouldTracking(opts)
      .then(shouldTrack => (shouldTrack ? TrackingCached.create(opts) : null))
      .then(() => {
        if (redirectUrl) {
          res.redirect(standardizeURL(redirectUrl));
        } else {
          cb();
        }
      });
  };
  Tracking.remoteMethod('collect', {
    accepts: [
      {
        arg: 'mac',
        type: 'string',
        description: 'Device MAC address',
        required: true
      },

      // Audience
      ...audienceFields,

      { arg: 'ua', type: 'string', description: 'Useragent string' },

      // Handle redirect
      { arg: 'redirect', type: 'string', description: 'Redirect URL' },
      { arg: 'res', type: 'object', http: { source: 'res' } }
    ],
    http: { path: '/collect' }
  });

  Tracking.emailTest = (ap, res) => {
      const { APMap } = Tracking.app.models;
      APMap.find({ where: { or: [{ macLan: standardizeMacAddress(ap) }, { mac: standardizeMacAddress(ap) }, { mac5: standardizeMacAddress(ap) }] } }).then((apMaps) => {
          console.log(apMaps);
      });
      // sendMarketingEmail(
      //     "Prudential Finance Customer Service <customerservice@prudentialfinance.com.vn>",
      //     'thuanphankh@gmail.com',
      //     'Điều Khoản Vay Cơ Bản từ Prudential Finance',
      //     '<h5>Cám ơn bạn đã lựa chọn nhận email để đọc “Điều khoản vay cơ bản” từ chúng tôi.<h5>',
      // );
      res.send('OK');
  };
  Tracking.remoteMethod('emailTest', {
      accepts:[
          { arg: 'ap', type: 'string' },
          { arg: 'res', type: 'object', http: { source: 'res' } }
      ],
      http: { path: '/emailTest' }
  });
};

