const Promise = require('bluebird');
const axios = require('axios');
const lodash = require('lodash');
const querystring = require('querystring');
const response = require('../import/response');
const { standardizeMacAddress, sendEmail } = require('../import/utils');

const debug = require('debug')('app:model:fb');
const error = require('debug')('err:model:fb');

module.exports = (Fb) => {
  const graphURI = 'https://graph.facebook.com';
  const graphVer = 'v2.9';

  const getFbData = (options) => {
    const getAccessTokenParams = querystring.stringify(options);

    return axios
      .get(
        `${graphURI}/${graphVer}/oauth/access_token?${getAccessTokenParams}`,
      )
      .then(res =>
        Promise.all([
          res.data.access_token,
          axios.get(
            `${graphURI}/me?fields=email,name,gender&access_token=${res
              .data.access_token}`,
          ),
        ]),
      )
      .then(([accessToken, res]) => {
        res.data.accessToken = accessToken;
        return res.data;
      })
      .catch(err=>error('getFbData failed', err));
  };

  const feed = (feedType, fbId, feedBody = {}) => {
    if (feedType === 'implicit') {
      return axios.post(
        `${graphURI}/${graphVer}/${fbId}/feed`,
        feedBody,
      );
    }

    feedBody.caption = 'Share to Facebook';
    const feedParams = querystring.stringify(feedBody);
    return Promise.resolve(
      `https://www.facebook.com/dialog/feed?${feedParams}`,
    );
  };

  Fb.getUserInfo = async (fbCode, fbRedirectUrl, fbAppId, fbAppSecret) => {
    const savedFbData = await Fb.findOne({ where: { id: fbCode } });
    if (savedFbData && savedFbData.id) {
      return savedFbData.toJSON();
    }

    const fbData = await getFbData({
      client_id: fbAppId,
      client_secret: fbAppSecret,
      redirect_uri: fbRedirectUrl,
      code: fbCode,
    });
    console.log('fbData', fbData);
    const fbObj = {
      id: fbCode,
      fbId: fbData.id,
      fbName: fbData.name,
      fbEmail: fbData.email,
      fbGender: fbData.gender,
      fbLink: fbData.link,
      accessToken: fbData.accessToken,
    };

    await Fb.upsert(fbObj);
    return fbObj;
  };

  Fb.login = (state, fbCode, errorFb, req, res, cb) => {
    if (!errorFb && (!state || !fbCode)) {
      return cb();
    }
    state = JSON.parse(state);
    let mac = standardizeMacAddress(state.m);
    let campaignId = state.ci;
    let redirectUrl = decodeURIComponent(state.redirect);
    let rejectUrl = decodeURIComponent(state.failRoute);
    if(errorFb){
        console.log(errorFb);
        return res.redirect(rejectUrl);
        return cb();
    }

    const { CampaignCached, Tracking, TrackingCached } = Fb.app.models;
    let campaign;
    let fbData;
    CampaignCached.findOne({ where: { id: campaignId } })
      .then((_campaign) => {
        campaign = _campaign;
        if (
          !campaign ||
          !campaign.id ||
          !campaign.fb ||
          !campaign.fb.appId ||
          !campaign.fb.appSecret
        ) {
          return response.invalidRequest();
        }
        const fbRedirectUrl = `${req.protocol}://${req.headers
          .host}${req.originalUrl.replace(/&code=[^?#&]+/, '')}`;
        return Fb.getUserInfo(
          fbCode,
          fbRedirectUrl.split('?')[0],
          campaign.fb.appId,
          campaign.fb.appSecret,
        ).catch((fbRes) => {
          error('%s get fb info failed', mac);
          error(fbRes.response.data.error);
          return response.invalidRequest();
        });
      })
      .then((_fbData) => {
        debug('%s fb data %o', mac, _fbData);
        fbData = _fbData;
        const updateData = lodash.extend(Tracking.extractTrackingData(req), {
          mac,
          actionType: Tracking.COLLECT,
          subAction: Tracking.SUB_LOGIN_FB,
          fb: { fbId: fbData.fbId, fbName: fbData.fbName, gender: fbData.fbGender, email: fbData.fbEmail, link: fbData.fbLink },
        });
        if (fbData.fbGender) updateData.gender = fbData.fbGender;
        if (fbData.fbName) updateData.name = fbData.fbName;
        if (fbData.fbEmail){
            updateData.email = fbData.fbEmail;
            if(campaign.fb.sendEmail){
                sendEmail(fbData.fbEmail, "Genex Smart WiFi Marketing Platform – Location & Audience Targeting", campaign.gg.emailTemplate).then(()=>{
                    console.log('sent Email');
                }).catch((err)=>{
                    console.log('Email not sent');
                    console.log(err);
                })
            }
        }

        return TrackingCached.create(updateData);
      })
      .then(() => {
        if (!campaign.fb.feed || !campaign.fb.feedBody) return null;
        if (campaign.fb.feed === 'implicit') {
          Object.assign(campaign.fb.feedBody, {
            access_token: fbData.accessToken,
          });
        } else {
          const app = Fb.app;
          let feedHandlerUrl = `${app.get('restApiScheme')}//${app.get(
            'restApiHost',
          )}${app.get('restApiRoot')}/fb/feed`;
          if (campaign.fb.appDomain) {
            const restApiPort = null; //app.get('restApiHost').split(':')[1]
            const fbAppHost = `${campaign.fb.appDomain}${restApiPort
              ? `:${restApiPort}`
              : ''}`;
            feedHandlerUrl = feedHandlerUrl.replace(
              app.get('restApiHost'),
              fbAppHost,
            );
          }

          const feedHandlerParams = querystring.stringify({
            onAccept: redirectUrl,
            onReject: redirectUrl,
          });

          Object.assign(campaign.fb.feedBody, {
            app_id: campaign.fb.appId,
            redirect_uri: `${feedHandlerUrl}?${feedHandlerParams}`,
            display: 'page'
          });
        }

        return feed(campaign.fb.feed, fbData.fbId, campaign.fb.feedBody)
          .then((feedResult) => {
            if (typeof feedResult === 'string') {
              debug('%s feed %s', mac, feedResult);
              redirectUrl = feedResult;
            }
          })
          .catch((feedRes) => {
            error('%s feed fb failed', mac);
            error(feedRes.response.data.error);
          });
      })
      .then(() => {
        if (redirectUrl) return res.redirect(redirectUrl);
        return cb();
      })
      .catch(cb);

    return null;
  };
  Fb.remoteMethod('login', {
    accepts: [
      {
        arg: 'state',
        type: 'string',
        required: true,
        description: 'State facebook login route',
      },
      // {
      //   arg: 'm',
      //   type: 'string',
      //   // required: true,
      //   description: 'Device mac address',
      // },
      // { arg: 'ci', type: 'string', required: true, description: 'Campaign Id' },
      {
        arg: 'code',
        type: 'string',
        description: 'Facebook code',
      },
      {
        arg: 'error',
        type: 'string',
        description: 'Facebook error',
      },
      // { arg: 'redirect', type: 'string', description: 'Redirect Url' },

      { arg: 'req', type: 'object', http: { source: 'req' } },
      { arg: 'res', type: 'object', http: { source: 'res' } },
    ],
    http: { verb: 'get' },
  });

  Fb.feed = (onAcceptUrl, onRejectUrl, errorCode, errorMessage, res) => {
    let redirectUrl =
      (errorCode ? onRejectUrl : onAcceptUrl) || onAcceptUrl || onRejectUrl;

    if (redirectUrl) {
        if(redirectUrl.indexOf('://')<0){
            redirectUrl = decodeURIComponent(redirectUrl);
        }
      return res.redirect(redirectUrl);
    }
    return errorCode
      ? response.error(400, errorCode, errorMessage)
      : Promise.resolve();
  };
  Fb.remoteMethod('feed', {
    accepts: [
      {
        arg: 'onAccept',
        type: 'string',
        required: true,
        description: 'Redirect URL when feed successfully',
      },
      {
        arg: 'onReject',
        type: 'string',
        required: true,
        description: 'Redirect URL when feed failed',
      },
      {
        arg: 'error_code',
        type: 'string',
        description: 'Feed error code (From facebook)',
      },
      {
        arg: 'error_massage',
        type: 'string',
        description: 'Feed error message (From facebook)',
      },

      { arg: 'res', type: 'object', http: { source: 'res' } },
    ],
    http: { verb: 'get' },
  });
};
