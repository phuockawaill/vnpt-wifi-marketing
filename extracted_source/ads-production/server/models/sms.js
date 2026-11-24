// const logger = require('../import/logger')().child({ module: 'model:Fb' });
// const Promise = require('bluebird');
const axios = require('axios');
const lodash = require('lodash');
const querystring = require('querystring');
const response = require('../import/response');
const { phoneToCarrier } = require('../import/utils');

module.exports = (SMS) => {
  const sendUrl = 'https://sms.vietguys.biz/api/';
  const send = (to, content) => {
    const app = SMS.app;
    const smsConf = app.get('sms').vg;
    const sendParams = querystring.stringify({
      u: smsConf.username,
      pwd: smsConf.password,
      from: smsConf.from,
      phone: to,
      sms: content,
    });

    return axios
      .get(`${sendUrl}?${sendParams}`)
      .then(res => ({ code: res.data }))
      .catch(() => ({ code: -1 }));
  };

  const smsCodeContent = 'Ma truy cap wifi cua ban la: ';
  const phoneFormat = /^(84|0)\d{9}\d?$/;

  SMS.code = (mac, phone, req) => {
    if (!mac || !phone || !phoneFormat.test(phone)) {
      return response.invalidRequest();
    }

    const smsCode = Math.random().toString(10).slice(2, 6);
    return send(phone, `${smsCodeContent}${smsCode}`).then(({ code }) => {
      if (isNaN(code)) {
        const { Tracking, TrackingCached, Device } = SMS.app.models;
        const smsRef = Device.toId(mac);
        const trackingData = lodash.extend(Tracking.extractTrackingData(req), {
          actionType: Tracking.COLLECT,
          subAction: Tracking.SUB_SMS_CODE,
          mac,
          phone,
          phoneCarrier: phoneToCarrier(phone),
          phoneVerified: false,
        });
        return Promise.all([
          TrackingCached.create(trackingData),
          SMS.upsert({ id: smsRef, content: smsCode, mac, phone }),
        ]);
      }
      return response.error(500, 'SMS_SEND_FAILED');
    });
  };

  SMS.remoteMethod('code', {
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
    http: { verb: 'get' },
  });

  SMS.verifyCode = (mac, code) => {
    if (!mac || !code) return response.invalidRequest();

    const { Tracking, TrackingCached, Device } = SMS.app.models;

    return SMS.findById(Device.toId(mac)).then((sms) => {
      if (!sms || !sms.id) return response.invalidRequest();
      if (sms.content !== code) return response.error(400, 'SMS_INVALID_CODE');
      return TrackingCached.create({
        actionType: Tracking.COLLECT,
        subAction: Tracking.SUB_SMS_CODE,
        mac,
        phone: sms.phone,
        phoneVerified: true,
      });
    });
  };

  SMS.remoteMethod('verifyCode', {
    accepts: [
      {
        arg: 'm',
        type: 'string',
        required: true,
        description: 'SMS reference code',
      },
      { arg: 'code', type: 'string', required: true, description: 'SMS code' },
    ],
    http: { verb: 'get', path: '/code/verify' },
  });
};
