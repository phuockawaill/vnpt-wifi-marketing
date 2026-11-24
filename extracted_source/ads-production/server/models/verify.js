const logger = require('../import/logger')().child({ module: 'model:Verify' });
const Promise = require('bluebird');
const path = require('path');
const loopback = require('loopback');
const axios = require('axios');
const lodash = require('lodash');
const moment = require('moment');
const url = require('url');
const querystring = require('querystring');
const CryptoJS = require('crypto-js');
const response = require('../import/response');
const { phoneToCarrier, standardizeMacAddress } = require('../import/utils');

module.exports = (Verify) => {
  const sendSmsUrl = 'https://sms.vietguys.biz/api/';
  const phoneCodeSmsContent = 'Ma truy cap wifi cua ban la: ';
  const phoneFormat = /^(84|0)\d{9}\d?$/;
  const sendSms = (to, content) => {
    const app = Verify.app;
    const smsConf = app.get('sms').vg;
    const sendParams = querystring.stringify({
      u: smsConf.username,
      pwd: smsConf.password,
      from: smsConf.from,
      phone: to,
      sms: content,
    });

    return axios
      .get(`${sendSmsUrl}?${sendParams}`)
      .then(res => ({ code: res.data }))
      .catch(() => ({ code: -1 }));
  };
  Verify.phoneCode = (mac, phone, req) => {
    if (!mac || !phone || !phoneFormat.test(phone)) {
      return response.invalidRequest();
    }
    mac = standardizeMacAddress(mac);
    const phoneCode = Math.random().toString(10).slice(2, 6);
    return sendSms(
      phone,
      `${phoneCodeSmsContent}${phoneCode}`,
    ).then(({ code }) => {
      if (isNaN(code)) {
        const { Tracking, TrackingCached, Device } = Verify.app.models;
        const id = Device.toId(mac);
        const trackingData = lodash.extend(Tracking.extractTrackingData(req), {
          actionType: Tracking.COLLECT,
          subAction: Tracking.SUB_VERIFY,
          mac,
          phone,
          phoneCarrier: phoneToCarrier(phone),
          phoneVerified: false,
        });
        return Promise.all([
          TrackingCached.create(trackingData),
          Verify.upsert({ id, mac, phone, phoneCode }),
        ]);
      }
      return response.error(500, 'SMS_SEND_FAILED');
    });
  };
  Verify.remoteMethod('phoneCode', {
    accepts: [
      {
        arg: 'm',
        type: 'string',
        required: true,
        description: 'Device mac address',
      },
      {
        arg: 'phone',
        type: 'string',
        required: true,
        description: 'Phone number to send SMS',
      },
      { arg: 'req', type: 'object', http: { source: 'req' } },
    ],
    http: { verb: 'get', path: '/get/phone' },
  });

  const verifyMailRenderer = loopback.template(
    path.resolve(__dirname, '../templates/verify.ejs'),
  );
  const emailFormat = new RegExp([
    '^(([^<>()[\\].,;:\\s@"]+(\\.[^<>()[\\].,;:\\s@"]+)*)|(".+"))',
    '@(([^<>()[\\].,;:\\s@"]+\\.)+[^<>()[\\].,;:\\s@"]{2,})$',
  ].join(''), 'i');
  const sendMail = (to, verifyParams) => {
    const app = Verify.app;
    const { Email } = app.models;
    const htmlContent = verifyMailRenderer({
      locals: {
        email: to,
        verifyUrl: `${app.get('restApiScheme')}//${app.get(
          'restApiHost',
        )}${app.get('restApiRoot')}/verify/email?${verifyParams}`,
      },
    });

    return Promise.promisify(Email.send).call(Email, {
      from: app.get('mail').sender,
      to,
      subject: 'Email Verification',
      text: 'Please verify your email',
      html: htmlContent
    });
  };
  Verify.emailCode = (mac, email, redirect, req) => {
    if (!mac || !email || !emailFormat.test(email)) {
      return response.invalidRequest();
    }
    mac = standardizeMacAddress(mac);
    const emailCode = Math.random().toString(36).slice(2);
    const verifyParams = querystring.stringify({
      m: mac,
      code: emailCode,
      redirect,
    });

    return sendMail(email, verifyParams)
      .then(() => {
        const { Tracking, TrackingCached, Device } = Verify.app.models;
        const id = Device.toId(mac);
        const trackingData = lodash.extend(Tracking.extractTrackingData(req), {
          actionType: Tracking.COLLECT,
          subAction: Tracking.SUB_VERIFY,
          mac,
          email,
          emailVerified: false,
        });
        return Promise.all([
          TrackingCached.create(trackingData),
          Verify.upsert({ id, mac, email, emailCode }),
        ]);
      })
      .catch((err) => {
        logger.error({ err }, 'Send verification email failed');
        return response.error(500, 'SMS_SEND_FAILED');
      });
  };
  Verify.remoteMethod('emailCode', {
    accepts: [
      {
        arg: 'm',
        type: 'string',
        required: true,
        description: 'Device mac address',
      },
      {
        arg: 'email',
        type: 'string',
        required: true,
        description: 'Email address to verify',
      },
      { arg: 'redirect', type: 'string', description: 'Redirect Url' },
      { arg: 'req', type: 'object', http: { source: 'req' } },
    ],
    http: { verb: 'get', path: '/get/email' },
  });

  Verify.verify = (mac, type, code, redirect, res, cb) => {
    if (!mac || !code || !type || (type !== 'phone' && type !== 'email')) {
      return response.invalidRequest();
    }

    const { Tracking, TrackingCached, Device } = Verify.app.models;
    Verify.findById(Device.toId(mac))
      .then((verifyData) => {
        if (!verifyData || !verifyData.id) return response.invalidRequest();
        if (verifyData[`${type}Code`] !== code) {
          return response.error(400, 'INVALID_CODE');
        }

        return TrackingCached.create({
          actionType: Tracking.COLLECT,
          subAction: Tracking.SUB_VERIFY,
          mac,
          [type]: verifyData[type],
          [`${type}Verified`]: true,
        });
      })
      .then(() => {
        if (!redirect) return cb(null, [true]);
        const parsedUrl = url.parse(redirect);
        parsedUrl.query = querystring.stringify(
          lodash.extend({
            verifyStatus: true,
          }),
          querystring.parse(parsedUrl.query),
        );

        return res.redirect(url.format(parsedUrl));
      })
      .catch((err) => {
        logger.error({ err }, 'Verify code failed');
        if (!redirect) return cb(null, [false, err.code]);

        const parsedUrl = url.parse(redirect);
        parsedUrl.query = querystring.stringify(
          lodash.extend({
            verifyStatus: false,
            verifyErrorCode: err.code,
          }),
          querystring.parse(parsedUrl.query),
        );

        return res.redirect(url.format(parsedUrl));
      });
    return null;
  };
  Verify.remoteMethod('verify', {
    accepts: [
      {
        arg: 'm',
        type: 'string',
        required: true,
        description: 'Device mac address',
      },
      {
        arg: 'type',
        type: 'string',
        required: true,
        description: 'Verification type. Eg: phone, email',
      },
      {
        arg: 'code',
        type: 'string',
        required: true,
        description: 'Verification code',
      },
      { arg: 'redirect', type: 'string', description: 'Redirect url' },
      { arg: 'res', type: 'object', http: { source: 'res' } },
    ],
    http: { verb: 'get', path: '/:type' },
    returns: [
      { arg: 'status', type: 'boolean' },
      { arg: 'code', type: 'string' },
    ],
  });

  const responseConfirmRenderer = loopback.template(
    path.resolve(__dirname, '../templates/response.ejs'),
  );
  Verify.account = async (code, req, res) => {
    const { User } = Verify.app.models;
    const app = Verify.app;
    const originalText = CryptoJS.AES.decrypt(decodeURIComponent(code), app.get('secretKey')).toString(CryptoJS.enc.Utf8);
    console.log('decode', originalText);
    let deData = '';
    const locals = {};
    res.header('Content-Type', 'text/html');
    try {
      deData = JSON.parse(originalText);
    } catch (err) {
      console.log('json parse err:', err);
      locals.title = 'Error: Confirm link not available';
      locals.content = 'Please try another link or contact administrator!';
      locals.redirect = '';
      return res.send(responseConfirmRenderer({ locals }));
      // return res.send('Confirm link not available!');
    }

    if (!deData.id) {
      locals.title = 'Error: Confirm link not available';
      locals.content = 'Please try another link or contact administrator!';
      locals.redirect = '';
      return res.send(responseConfirmRenderer({ locals }));
      // return res.send('Confirm link not available!');
    }
    const userRequest = await User.findById(deData.id || 'undefined');
    if (!userRequest || userRequest.email !== deData.email) {
      locals.title = 'Error: Confirm link with account not available';
      locals.content = 'Please try another link or contact administrator!';
      locals.redirect = '';
      return res.send(responseConfirmRenderer({ locals }));
      // return res.send('Confirm link account not available!');
    }

    if (userRequest.options.status) {
      locals.title = 'Your account has been activated';
      locals.content = 'Click below link to access Genex Wifi DSP Platform';
      locals.redirect = `${app.get('restApiScheme')}//${app.get('appHostName')}`;
      return res.send(responseConfirmRenderer({ locals }));
      // return res.send('Account Activated! Just login!');
    }

    const cityId = userRequest.options.city.id;
    const districtId = userRequest.options.district.id;
    // delete userRequest.options.city.id;
    // delete userRequest.options.district.id;
    if (userRequest.profileName === 'client') {
      const { Profile, Location, SelectOption, Banner, Campaign, License } = Verify.app.models;
      const brandProfile = await Profile.findOne({ where: { name: 'brand' }, fields: { id: 1, name: 1 } });
      const brandCreated = await User.create({
        name: `${userRequest.username} Brand`,
        username: `${userRequest.username}_brand`,
        email: `brand-${userRequest.email}`,
        password: '12345678',
        profileId: brandProfile.id,
        profileName: 'brand',
        createdBy: userRequest.id,
        createdByUsername: userRequest.username
      });
      const groupCreated = await SelectOption.create({
        type: 'location_category',
        text: 'Wifi Network',
        value: 'Wifi Network'.replace(/[^\w]/g, '').toLowerCase(),
        options: { hotspotType: 'default' },
        createdBy: userRequest.id
      });
      const locationCreated = await Location.create({
        name: 'Demo location',
        cityId, cityName: userRequest.options.city.text,
        districtId, districtName: userRequest.options.district.text,
        categoryId: groupCreated.id,
        categoryName: 'Demo Group',
        address: userRequest.options.address,
        createdBy: userRequest.id,
        createdByUsername: userRequest.username
      });
      const bannerCreated = await Banner.create({
        name: 'Demo Banner', type: 'Banner',
        htmlCode: defaultHTML,
        createdBy: userRequest.id, createdByUsername: userRequest.username,
        options: defaultBannerOption
      });
      await Campaign.create({
        name: 'Demo Campaign',
        brandId: brandCreated.id,
        brandName: brandCreated.name,
        brands: [],
        scheduleFrom: moment().startOf('day').toDate().toISOString(),
        scheduleTo: moment().add(7, 'days').endOf('day').toDate().toISOString(),
        daysOfWeek: [],
        isCatfish: false,
        active: true,
        audience: [],
        customFields: [],
        locations: [{ locationId: locationCreated.id, locationName: 'Demo location', categoryId: groupCreated.id, categoryName: 'Demo Group', createdBy: userRequest.id }],
        landingPageUrl: 'http://genexwifi.com',
        bannerDefaultId: bannerCreated.id,
        bannerDefaultName: 'Demo Banner',
        banners: [],
        createdBy: userRequest.id,
        createdByUsername: userRequest.username
      });
      await License.create({
        key: 'Trial',
        type: 'trial',
        status: 99,
        userId: userRequest.id,
        numberAp: 10,
        createdAt: moment().valueOf(),
        end: moment().add(7, 'days').endOf('day').valueOf()
      });
    }
    userRequest.options.status = true;
    await userRequest.updateAttribute('options', userRequest.options);
    locals.title = 'Your account active success';
    locals.content = 'Click below link to access Genex Wifi DSP Platform';
    locals.redirect = `${app.get('restApiScheme')}//${app.get('appHostName')}`;
    return res.send(responseConfirmRenderer({ locals }));
    // return res.send('Active account success!');
    // email or group alert
  };
  Verify.remoteMethod('account', {
    accepts: [
      {
        arg: 'code',
        type: 'string',
        required: true,
        description: 'Active user code'
      },
      { arg: 'req', type: 'object', http: { source: 'req' } },
      { arg: 'res', type: 'object', http: { source: 'res' } }
    ],
    http: { verb: 'get', path: '/account/:code' }
  });

  const defaultBannerOption = {
    btn: { text: 'Connect Internet' },
    body: { backgroundColor: '#ffffff', fontFamily: 'Montserrat, sans-serif' },
    laptop: {
      bgImage: 'http://210.211.117.184:20081/asset/wifiex4uVP/genexwifi/image-slider-2.png',
      sizeImage: '50%',
      btn: {
        color: '#ffffff',
        backgroundColor: '#3aaee0',
        textAlign: 'center',
        xDirection: '0%',
        yDirection: '100%',
        borderStyle: 'solid',
        borderWidth: '0px',
        borderColor: '#cccccc',
        borderTopStyle: 'solid',
        borderTopWidth: '0px',
        borderTopColor: '#cccccc',
        borderRightStyle: 'solid',
        borderRightWidth: '0px',
        borderRightColor: '#cccccc',
        borderBottomStyle: 'solid',
        borderBottomWidth: '0px',
        borderBottomColor: '#cccccc',
        borderLeftStyle: 'solid',
        borderLeftWidth: '0px',
        borderLeftColor: '#cccccc',
        borderRadius: '4px',
        padding: '10px',
        paddingTop: '10px',
        paddingRight: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px'
      },
      btnBorderOption: 'allsides',
      btnPaddingOption: 'allsides'
    },
    mobile: {
      bgImage: 'http://210.211.117.184:20081/asset/demo/wifiex4u_login.jpg',
      sizeImage: '',
      btn: {
        color: '#ffffff',
        backgroundColor: '#3aaee0',
        textAlign: 'initial',
        xDirection: '60%',
        yDirection: '18%',
        borderStyle: 'solid',
        borderWidth: '0px',
        borderColor: '#cccccc',
        borderTopStyle: 'solid',
        borderTopWidth: '0px',
        borderTopColor: '#cccccc',
        borderRightStyle: 'solid',
        borderRightWidth: '0px',
        borderRightColor: '#cccccc',
        borderBottomStyle: 'solid',
        borderBottomWidth: '0px',
        borderBottomColor: '#cccccc',
        borderLeftStyle: 'solid',
        borderLeftWidth: '0px',
        borderLeftColor: '#cccccc',
        borderRadius: '4px',
        padding: '10px',
        paddingTop: '10px',
        paddingRight: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px'
      },
      btnBorderOption: 'allsides',
      btnPaddingOption: 'allsides'
    },
    staticBannerType: 'default',
    staticBannerId: '5d522e5237d3587f67e102d3',
    templateType: 'static'
  };
  const defaultHTML = "\n                                    <!DOCTYPE html>\n                                        <html lang=\"en\">\n                                            <head>\n    <meta charset=\"utf-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, shrink-to-fit=no\">\n    <link rel=\"stylesheet\" href=\"http://210.211.117.184:20081/asset/wifiex4uVP/templates/fonts.css\">\n    <link rel=\"stylesheet\" href=\"http://210.211.117.184:20081/asset/wifiex4uVP/templates/fonts_2.css\">\n    <title>Template</title>\n    <style>\n        * {\n            font-family: Montserrat, sans-serif;\n\n        }\n\n        body {\n            background-color: #ffffff;\n\n        }\n\n        .img-wrapper {\n            position: relative;\n            width: 100%;\n            text-align: center;\n\n        }\n\n        .img-overlay {\n            position: absolute;\n            top: 0;\n            bottom: 0;\n            left: 0;\n            right: 0;\n            text-align: center;\n\n        }\n\n        .img-overlay:before {\n            content: ' ';\n            display: block;\n            height: 100%;\n            margin: 10px 0 0 0;\n\n        }\n\n        .img-responsive-desktop {\n            width: 50%;\n            height: auto;\n\n        }\n\n        .img-responsive-mobile {\n            display: none;\n\n        }\n\n        .loginButton {\n            color: #ffffff;\n            background-color: #3aaee0;\n            border-style: solid;\n            border-width: 0px;\n            border-color: #cccccc;\n            border-top-style: solid;\n            border-top-width: 0px;\n            border-top-color: #cccccc;\n            border-right-style: solid;\n            border-right-width: 0px;\n            border-right-color: #cccccc;\n            border-bottom-style: solid;\n            border-bottom-width: 0px;\n            border-bottom-color: #cccccc;\n            border-left-style: solid;\n            border-left-width: 0px;\n            border-left-color: #cccccc;\n            border-radius: 4px;\n            padding: 10px;\n            padding-top: 10px;\n            padding-right: 10px;\n            padding-bottom: 10px;\n            padding-left: 10px;\n\n        }\n\n        @media screen and (max-width: 768px) {\n            .img-wrapper {\n                position: relative;\n                width: 100%;\n                text-align: initial;\n\n            }\n\n            .img-overlay {\n                position: absolute;\n                top: 0;\n                bottom: 0;\n                left: 0;\n                right: 0;\n                text-align: center;\n\n            }\n\n            .img-overlay:before {\n                content: ' ';\n                display: block;\n                height: 75%;\n                margin: 0;\n\n            }\n\n            .img-responsive-desktop {\n                display: none;\n\n            }\n\n            .img-responsive-mobile {\n                display: block;\n                width: 100%;\n                height: auto;\n\n            }\n\n            .loginButton {\n                color: #ffffff;\n                background-color: #3aaee0;\n                border-style: solid;\n                border-width: 0px;\n                border-color: #cccccc;\n                border-top-style: solid;\n                border-top-width: 0px;\n                border-top-color: #cccccc;\n                border-right-style: solid;\n                border-right-width: 0px;\n                border-right-color: #cccccc;\n                border-bottom-style: solid;\n                border-bottom-width: 0px;\n                border-bottom-color: #cccccc;\n                border-left-style: solid;\n                border-left-width: 0px;\n                border-left-color: #cccccc;\n                border-radius: 4px;\n                padding: 10px;\n                padding-top: 10px;\n                padding-right: 10px;\n                padding-bottom: 10px;\n                padding-left: 10px;\n\n            }\n        }\n    </style>\n<style id=\"styleId\">\n                                            * {\n                                                font-family: Montserrat, sans-serif;\n                                            }\n            \n                                            body {\n                                                background-color: #ffffff;\n                                            }\n            \n                                            .img-responsive-desktop {\n                                                width: 50%;\n                                            }\n            \n                                            .img-overlay {\n                                                left: 0%;\n                                                text-align: center;\n                                            }\n            \n                                            .img-overlay:before {\n                                                height: 100%;\n                                            }\n            \n                                            .loginButton {\n                                                color: #ffffff;\n                                                background-color: #3aaee0;\n                                                \n                                                        border-style: solid !important;\n                                                        border-width: 0px !important;\n                                                        border-color: #cccccc !important;\n                                                    \n                                                border-top-style: solid;\n                                                border-top-width: 0px;\n                                                border-top-color: #cccccc;\n                                                border-right-style: solid;\n                                                border-right-width: 0px;\n                                                border-right-color: #cccccc;\n                                                border-bottom-style: solid;\n                                                border-bottom-width: 0px;\n                                                border-bottom-color: #cccccc;\n                                                border-left-style: solid;\n                                                border-left-width: 0px;\n                                                border-left-color: #cccccc;\n                                                border-radius: 4px;\n                                                \n                                                    padding: 10px !important;\n                                                \n                                                padding-bottom: 10px;\n                                                padding-left: 10px;\n                                                padding-right: 10px;\n                                                padding-top: 10px;\n                                                \n                                            }\n            \n                                            @media screen and (max-width: 768px) {\n                                                .img-overlay {\n                                                    left: 60%;\n                                                    text-align: initial;\n                                                }\n            \n                                                .img-overlay:before {\n                                                    height: 18%;\n                                                }\n            \n                                                .loginButton {\n                                                    color: #ffffff;\n                                                    background-color: #3aaee0;\n                                                    \n                                                            border-style: solid !important;\n                                                            border-width: 0px !important;\n                                                            border-color: #cccccc !important;\n                                                            border-top-style: solid;\n                                                            border-top-width: 0px;\n                                                            border-top-color: #cccccc;\n                                                            border-right-style: solid;\n                                                            border-right-width: 0px;\n                                                            border-right-color: #cccccc;\n                                                            border-bottom-style: solid;\n                                                            border-bottom-width: 0px;\n                                                            border-bottom-color: #cccccc;\n                                                            border-left-style: solid;\n                                                            border-left-width: 0px;\n                                                            border-left-color: #cccccc;\n                                                            \n                                                    border-radius: 4px;\n                                                    \n                                                            padding: 10px !important;\n                                                            padding-top: 10px;\n                                                            padding-right: 10px;\n                                                            padding-bottom: 10px;\n                                                            padding-left: 10px;\n                                                        \n                                                }\n                                            }\n                                        </style></head>\n\n<body>\n    <div class=\"img-wrapper\"> <img class=\"img-responsive-mobile\" src=\"http://210.211.117.184:20081/asset/demo/wifiex4u_login.jpg\"> <img class=\"img-responsive-desktop\" src=\"http://210.211.117.184:20081/asset/wifiex4uVP/genexwifi/image-slider-2.png\">\n        <div class=\"img-overlay\"> <button id=\"submitLoginButton\" class=\"loginButton\">Connect Internet</button> </div>\n    </div>\n\n\n</body>\n                                        </html>\n                                    "
};
