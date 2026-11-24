const lodash = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const util = require('util');
const debug = require('debug')('app:model:report');
const error = require('debug')('err:model:report');
const jwt = require('jsonwebtoken');
const axios = require('axios');

module.exports = (Report) => {
  const audienceReports = [
    'os',
    'device',
    'gender',
    'age',
    'income',
    'phoneCarrier',
    'phoneVerified',
    'emailVerified'
  ];
  const metaReports = ['campaignId', 'locationId', 'bannerId', 'brandId', 'ap'];

  const preFilter = (filter, user) => {
    const Role = Report.app.models.role;

    // Keep filter if request from system or admin
    if (!user || user.roles.indexOf(Role.ADMIN) > -1) return filter;
    return filter;
  };

  const baseReportQuery = {
    query: {
      bool: { filter: [], must_not: [] },
    },
    size: 0,
    aggs: {},
  };
  const timeAgg = {
    time: {
      date_histogram: {
        field: 'updatedAt',
        time_zone: 'Asia/Jakarta',
        interval: 'day',
      },
      aggs: {},
    },
  };
  const requireClick = {
    nested: {
      path: 'actions',
      query: {
        "bool": {
          "must": [
            { "match": { "actions.action": "click" } }
          ]
        }
      }
    }
  };
  const visitorAgg = {
    totalVisitor: {
      filter: requireClick,
      aggs: {
        count: {
          cardinality: { field: 'mac.hash' },
        },
      },
    },
  };
  const actionReportAgg = {
    action: {
      nested: { path: 'actions' },
      aggs: { action: { terms: { field: 'actions.action', size: 10 } } },
    },
  };
  const uniqueDeviceAgg = {
    uniqueDevice: {
      cardinality: { field: 'mac.hash' },
    },
  };
  const uniqueDeviceAggReal = {
    uniqueDeviceReal: {
      filter: requireClick,
      aggs: {
        count: {
          cardinality: { field: 'mac.hash' },
        },
      },
    },
  };
  const newReturnReportAgg = Object.assign({
    newDevice: {
      filter: {
        bool: {
          must: [
            { match: { isNew: true } },
            requireClick
          ]
        }
      },
      aggs: {
        count: {
          cardinality: { field: 'mac.hash' },
        },
      },
    },
  }, uniqueDeviceAgg, uniqueDeviceAggReal);

  const audienceReportAgg = (field) => {
    switch (field) {
      case 'phoneVerified':
      case 'emailVerified':
        return {
          [field]: {
            filters: {
              filters: {
                Verified: { term: { [field]: true } },
              },
              other_bucket_key: 'Not Verified',
            },
          },
        };
      default: {
        const app = Report.app;
        const fieldKeys = app.get(`op:h:${field}_category`);

        if (fieldKeys) {
          const filters = {};
          Object.keys(fieldKeys).forEach((key) => {
            if (key !== 'other') {
              filters[key] = { term: { [`audience.${field}`]: key } };
            }
          });

          return {
            [field]: {
              filters: { filters, other_bucket_key: 'other' },
            },
          };
        }

        return {
          [field]: { terms: { field: `audience.${field}`, size: 10 } },
        };
      }
    }
  };
  const surveyReportAgg = field => ({
    [field]: { terms: { field, size: 5 } },
  });

  const buildFilter = (field, value) => {
    if (value === '$$hasValue') {
      return { exists: { field } };
    }
    return { term: { [field]: value } };
  };
  const parseFilter = (filter) => {
    const query = {
      bool: { filter: [], must_not: [], must: { bool: { should: [] } } },
    };

    if (filter.from) {
      const dFrom = moment(filter.from);
      if (dFrom.isValid()) {
        query.bool.filter.push({
          range: { updatedAt: { gte: dFrom.startOf('day').valueOf() } },
        });
      }
    }
    if (filter.to) {
      const dTo = moment(filter.to);
      if (dTo.isValid()) {
        query.bool.filter.push({
          range: { updatedAt: { lte: dTo.endOf('day').valueOf() } },
        });
      }
    }

    audienceReports.forEach((field) => {
      if (!lodash.isNil(filter[field]) && !lodash.isEmpty(filter[field])) {
        query.bool.filter.push(buildFilter(`audience.${field}`, filter[field]));
      }
    });

    metaReports.forEach((field) => {
      if (!lodash.isNil(filter[field]) && !lodash.isEmpty(filter[field])) {
        if (lodash.isArray(filter[field])) {
          for (let iMeta = 0; iMeta < filter[field].length; iMeta++) {
            // if(iMeta){
            //     query.bool.should.push(buildFilter('meta.' + field, filter[field][iMeta]));
            // } else {
            //     query.bool.filter.push(buildFilter('meta.' + field, filter[field][iMeta]));
            // }
            query.bool.must.bool.should.push(buildFilter('meta.' + field, filter[field][iMeta]));
          }
        } else {
          query.bool.filter.push(buildFilter('meta.' + field, filter[field]));
        }
      }
    });

    Object.keys(filter).forEach((field) => {
      if (field.indexOf('survey.') === 0) {
        query.bool.filter.push(buildFilter(field, filter[field]));
      }
    });

    return query;
  };

  const parseValue = data =>
    data.countClick ?
      lodash.get(data, 'countClick.countMac.value')
      : lodash.get(data, 'value', lodash.get(data, 'count.value', data.doc_count));

  const parseData = (data, aggPath) => {
    if (data.time) {
      return lodash.get(data, 'time.buckets', []).map(timeBucket => ({
        name: timeBucket.key,
        detail: parseData(timeBucket, aggPath),
      }));
    }

    let parsed = lodash.get(data, aggPath, {});
    if (!parsed.buckets) return parseValue(parsed);

    parsed = parsed.buckets || [];
    if (!Array.isArray(parsed)) {
      parsed = Object.keys(parsed).map((key) => {
        parsed[key].key = key;
        return parsed[key];
      });
    }

    return parsed.map(bucket => ({
      name: bucket.key,
      y: parseValue(bucket),
    }));
  };

  const trackingReportAggs = {
    action: actionReportAgg,
    newReturn: newReturnReportAgg,
    unique: uniqueDeviceAgg,
    uniqueReal: uniqueDeviceAggReal
  };
  const getTrackingReport = async (filter, reports) => {
    if (!reports || Object.keys(reports).length === 0) return {};

    const body = lodash.cloneDeep(baseReportQuery);

    audienceReports.forEach((field) => {
      if (field !== 'os' && field !== 'device') {
        delete filter[field];
      }
    });
    lodash.extend(body.query, parseFilter(filter));

    let topAgg = body.aggs;
    if (filter.interval && filter.interval !== 'overall') {
      body.aggs = Object.assign({}, body.aggs, timeAgg, {
        newDevice: {
          filter: { bool: { must: [{ match: { isNew: true } }, requireClick] } },
          aggs: { count: { cardinality: { field: 'mac.hash' } } }
        },
        uniqueDevice: { cardinality: { field: 'mac.hash' } },
        macFrequency: {
          filter: requireClick,
          aggs: {
            totalDevice: {
              cardinality: { field: 'mac.hash' }
            },
            macList: { terms: { field: 'mac', size: 1000 } }
          }
        },
        actions: {
          nested: { path: 'actions' },
          aggs: { action: { terms: { field: 'actions.action', size: 10 } } },
        }
      });
      lodash.set(body.aggs, 'time.date_histogram.interval', filter.interval);
      topAgg = body.aggs.time.aggs;
    }
    Object.keys(trackingReportAggs).forEach((report) => {
      if (report in reports) {
        lodash.extend(topAgg, trackingReportAggs[report]);
      }
    });
    const { Tracking } = Report.app.models;
    body.aggs.topVisitor = {
      terms: { field: 'meta.locationId', size: 10 },
      aggs: {
        countClick: {
          filter: requireClick,
          aggs: {
            count: {
              cardinality: { field: 'mac.hash' },
            }
          }
        }
      }
    };
    body.aggs.apTotal = {
      terms: { field: 'meta.ap', size: 10000 },
      aggs: {
        countClick: {
          filter: requireClick,
          aggs: { count: { cardinality: { field: 'mac.hash' } } }
        }
      }
    };
    if (typeof filter.campaignId === 'string') {
      body.aggs.banners = {
        terms: { field: 'meta.bannerId', size: 10 },
        aggs: {
          countClick: {
            filter: requireClick,
            aggs: {
              count: {
                cardinality: { field: 'mac.hash' }
              }
            }
          },
        }
      };
      // body.aggs.actions.aggs.field = "meta.ap";
    }
    if (filter.locationId) {
      body.aggs.topVisitor.terms.field = 'meta.ap';
    }
    const esCon = Tracking.getDataSource().connector;
    const esDb = esCon.db;
    debug('raw tracking query', util.inspect(body, { depth: null }));
    const data = await Promise.promisify(esDb.search).call(esDb, {
      index: esCon.searchIndex,
      type: Tracking.modelName,
      body,
    });
    debug(
      'raw tracking result',
      util.inspect(data.aggregations, { depth: null }),
    );
    // Parse result
    // console.log('query Tracking body', JSON.stringify(body));
    // console.log('query Tracking data', JSON.stringify(data.aggregations));
    const result = {
      macList: lodash.get(data.aggregations, 'macFrequency.macList.buckets'),
      actions: lodash.get(data.aggregations, 'actions.action.buckets'),
      topVisitor: lodash.get(data.aggregations, 'topVisitor.buckets'),
      apTotal: lodash.get(data.aggregations, 'apTotal.buckets'),
      bannerClick: lodash.get(data.aggregations, 'banners.buckets'),
      totalDevice: lodash.get(data.aggregations, 'macFrequency.totalDevice.value'),
      newDevice: lodash.get(data.aggregations, 'newDevice.count.value'),
      allDevice: lodash.get(data.aggregations, 'uniqueDevice.value')
    };
    if (reports.newReturn) {
      const allDevice = parseData(data.aggregations, 'uniqueDevice');
      const allDeviceClick = parseData(data.aggregations, 'uniqueDeviceReal');
      const newDevice = parseData(data.aggregations, 'newDevice');

      result.newReturn = allDevice.map((cat, index) => ({
        name: cat.name,
        detail: [
          { name: 'All', y: cat.detail },
          { name: 'New', y: newDevice[index].detail },
          { name: 'Return', y: allDeviceClick[index].detail - newDevice[index].detail },
          { name: 'Walkthrough', y: cat.detail - allDeviceClick[index].detail },
        ]
      }));
      result['newReturn-sum'] = [{
        name: '',
        detail: [
          { name: 'All', y: result.allDevice },
          { name: 'New', y: result.newDevice },
          { name: 'Return', y: result.totalDevice - result.newDevice },
          { name: 'Walkthrough', y: result.allDevice - result.totalDevice }
        ]
      }];
    }
    if (reports.unique) {
      result.unique = [
        { name: 'Unique', y: parseData(data.aggregations, 'uniqueDevice') },
      ];
    }
    if (reports.action) {
      result.action = parseData(data.aggregations, 'action.action');
    }

    return result;
  };

  const getTrackingVisitorReport = async (filter, reports) => {
    if (Object.keys(reports).length === 0) return {};

    const body = lodash.cloneDeep(baseReportQuery);
    const extendFilter = lodash.extend(lodash.cloneDeep(filter), { from: moment().startOf('day').valueOf(), to: moment().endOf('day').valueOf() });
    lodash.extend(body.query, parseFilter(extendFilter));
    lodash.extend(body.aggs, {
      totalDay: {
        filter: requireClick,
        aggs: { count: { cardinality: { field: 'mac.hash' } } },
      },
      totalHour: {
        filter: {
          bool: {
            must: [
              { range: { updatedAt: { gte: moment().startOf('hour').valueOf() } } }, { range: { updatedAt: { lte: moment().endOf('hour').valueOf() } } },
              requireClick
            ]
          }
        },
        aggs: {
          count: { cardinality: { field: 'mac.hash' }, }
        }
      }
    });
    const { Tracking } = Report.app.models;
    const esCon = Tracking.getDataSource().connector;
    const esDb = esCon.db;
    debug('raw tracking query', util.inspect(body, { depth: null }));
    const data = await Promise.promisify(esDb.search).call(esDb, {
      index: esCon.searchIndex,
      type: Tracking.modelName,
      body,
    });
    debug(
      'raw tracking result',
      util.inspect(data.aggregations, { depth: null }),
    );
    // Parse result
    return { hour: lodash.get(data.aggregations, 'totalHour.count.value'), day: lodash.get(data.aggregations, 'totalDay.count.value') };
  };

  const getTrackingVisitorDetailReport = async (filter, reports) => {
    if (Object.keys(reports).length === 0) return {};

    const body = lodash.cloneDeep(baseReportQuery);
    const extendFilter = lodash.extend(lodash.cloneDeep(filter), { from: moment().startOf('day').valueOf(), to: moment().endOf('day').valueOf() });
    lodash.extend(body.query, parseFilter(extendFilter));
    lodash.extend(body.aggs, {
      totalDay: {
        terms: { field: 'meta.ap', size: 10000 },
        aggs: {
          countClick: {
            filter: requireClick,
            aggs: {
              count: {
                cardinality: { field: 'mac.hash' },
              }
            }
          },
        }
      },
      totalHour: {
        filter: {
          bool: {
            must: [
              { range: { updatedAt: { gte: moment().startOf('hour').valueOf() } } }, { range: { updatedAt: { lte: moment().endOf('hour').valueOf() } } },
              requireClick
            ]
          }
        },
        aggs: {
          apHour: {
            terms: { field: "meta.ap", size: 10000 },
            aggs: {
              countClick: {
                filter: requireClick,
                aggs: {
                  count: {
                    cardinality: { field: 'mac.hash' },
                  }
                }
              },
            }
          }
        },
      }
    });
    const { Tracking } = Report.app.models;
    const esCon = Tracking.getDataSource().connector;
    const esDb = esCon.db;
    debug('raw tracking query', util.inspect(body, { depth: null }));
    const data = await Promise.promisify(esDb.search).call(esDb, {
      index: esCon.searchIndex,
      type: Tracking.modelName,
      body,
    });
    debug(
      'raw tracking result',
      util.inspect(data.aggregations, { depth: null }),
    );
    // Parse result
    return {
      hourAp: data.aggregations.totalHour.apHour.buckets.map((item) => ({ key: item.key, value: item.countClick.count.value })),
      dayAp: data.aggregations.totalDay.buckets.map((item) => ({ key: item.key, value: item.countClick.count.value }))
    };
  };

  const getDeviceReport = async (filter, reports, limitUser) => {
    if (Object.keys(reports).length === 0 || !limitUser.limit) return {};
    const body = lodash.cloneDeep(baseReportQuery);
    const { Device } = Report.app.models;
    if (limitUser.limit < 1000) {
      body.query = { ids: { values: limitUser.macList.map(item => Device.toId(item.key)) } };
    } else {
      lodash.extend(body.query, parseFilter(filter));
    }

    let topAgg = body.aggs;
    if (filter.interval && filter.interval !== 'overall') {
      lodash.extend(body.aggs, timeAgg);
      // Object.assign({}, body.aggs, {
      //     action: actionReportAgg,
      //     unique: uniqueDeviceAgg,
      // });
      body.aggs = Object.assign({}, body.aggs, {
        source: {
          filter: {
            bool: {
              must_not: [
                { "nested": { "path": "fb", "query": { "match_all": {} } } },
                { "nested": { "path": "google", "query": { "match_all": {} } } },
                { "nested": { "path": "zalo", "query": { "match_all": {} } } },
                { "nested": { "path": "twitter", "query": { "match_all": {} } } },
              ]
            }
          }
        },
        Facebook: { nested: { path: 'fb' } },
        Google: { nested: { path: 'google' } },
        Zalo: { nested: { path: 'zalo' } },
        Twitter: { nested: { path: 'twitter' } },
        APList: { terms: { field: "meta.ap", size: 10000 } }
      });
      lodash.set(body.aggs, 'time.date_histogram.interval', filter.interval);
      topAgg = body.aggs.time.aggs;
    }
    audienceReports.forEach((field) => {
      if (field in reports) {
        lodash.extend(topAgg, audienceReportAgg(field));
      }
    });
    Object.keys(reports).forEach((field) => {
      if (field.indexOf('survey.') === 0) {
        lodash.extend(topAgg, surveyReportAgg(field));
      }
    });

    const esCon = Device.getDataSource().connector;
    const esDb = esCon.db;

    debug('raw device query', util.inspect(body, { depth: null }));
    const data = await Promise.promisify(esDb.search).call(esDb, {
      index: esCon.searchIndex,
      type: Device.modelName,
      body,
    });
    debug(
      'raw device result',
      util.inspect(data.aggregations, { depth: null }),
    );
    // console.log('getDeviceReport query', JSON.stringify(body));
    // console.log('getDeviceReport data', JSON.stringify(data.aggregations));
    let formSrc = lodash.get(data.aggregations, 'source.doc_count'),
      fb = lodash.get(data.aggregations, 'Facebook.doc_count'),
      gg = lodash.get(data.aggregations, 'Google.doc_count'),
      zl = lodash.get(data.aggregations, 'Zalo.doc_count'),
      twt = lodash.get(data.aggregations, 'Twitter.doc_count');
    const result = {};
    result.apTotal = lodash.get(data.aggregations, 'APList.buckets');
    result.totalVisitor = lodash.get(data, 'hits.total');
    if (!formSrc && !fb && !gg && !zl && !twt) {
      result.source = [];
    } else {
      result.source = [{
        name: '', detail: [
          { name: 'Form', y: formSrc },
          { name: 'Facebook', y: fb },
          { name: 'Google', y: gg },
          { name: 'Zalo', y: zl },
          { name: 'Twitter', y: twt },
        ]
      }];
    }
    audienceReports.forEach((field) => {
      if (field in reports) {
        result[field] = parseData(data.aggregations, field);
      }
    });
    Object.keys(reports).forEach((field) => {
      if (field.indexOf('survey.') === 0) {
        result[field] = parseData(data.aggregations, field);
      }
    });
    return result;
  };

  const getDSPReport = async (filter, user) => {
    const Profile = Report.app.models.Profile;
    const app = Report.app;
    if (user.profileName !== Profile.PUBLISHER) {
      return {};
    }
    try {
      const dspData = await axios({ method: 'POST',
          url: `${app.get('dspHost')}/api/report/publisher`,
          data: { filter: { from: moment(filter.from).valueOf(), to: moment(filter.to).valueOf(), locationId: filter.locationId } },
          headers: { 'Content-Type': 'application/json', Authorization: jwt.sign({ type: 'Report', createdByUsername: user.username }, app.get('secretKey'), { expiresIn: 60 }) }
      });
      console.log('query dsp data', JSON.stringify(dspData.data));
      return dspData.data;
    } catch (err) {
      console.log('query dsp report err', err);
    }
  };

  const beforeGet = (ctx, _, next) => {
    const User = Report.app.models.User;
    const Campaign = Report.app.models.Campaign;
    const Location = Report.app.models.Location;
    const Profile = Report.app.models.Profile;
    User.findById(ctx.req.accessToken.userId).then((user) => {
      ctx.args.user = user;
      if (ctx.args.filter.campaignId) {
        switch (user.profileName) {
          case Profile.PUBLISHER:
            if (ctx.args.filter.locationId) {
              next();
            } else {
              Location.find({ where: { createdBy: user.id } }).then((locs) => {
                if (locs.length) {
                  ctx.args.filter.locationId = lodash.map(locs, loc => loc.id);
                } else {
                  ctx.args.filter.locationId = 'null';
                }
                next();
              }).catch(next);
            }
            break;
          default: next();
        }
      } else {
        switch (user.profileName) {
          case Profile.SUPERADMIN:
            Campaign.find({}).then((camps) => {
              if (camps.length) {
                ctx.args.filter.campaignId = lodash.map(camps, (cmp) => cmp.id);
              }
              next();
            }).catch(next);
            break;
          case Profile.ADMIN:
            User.find({ where: { createdBy: user.id } }).then((childUsrs) => {
              Campaign.find({ where: { "or": [{ "createdBy": user.id }].concat(childUsrs.map(chil => ({ "createdBy": chil.id }))) } }).then((camps) => {
                if (camps.length) {
                  ctx.args.filter.campaignId = lodash.map(camps, (cmp) => cmp.id);
                } else {
                  ctx.args.filter.campaignId = "null";
                }
                next();
              }).catch(next);
            });
            break;
          case Profile.CLIENT:
            Campaign.find({ where: { createdBy: user.id } }).then((camps) => {
              if (camps.length) {
                ctx.args.filter.campaignId = lodash.map(camps, (cmp) => cmp.id);
              } else {
                ctx.args.filter.campaignId = 'null';
              }
              next();
            }).catch(next);
            break;
          case Profile.PUBLISHER:
            if (ctx.args.filter.locationId) {
              next();
            } else {
              Location.find({ where: { createdBy: user.id } }).then((locs) => {
                if (locs.length) {
                  ctx.args.filter.locationId = lodash.map(locs, loc => loc.id);
                } else {
                  ctx.args.filter.locationId = 'null';
                }
                next();
              }).catch(next);
            }
            break;
          case Profile.BRAND:
            Campaign.find({ where: { or: [{ brandId: user.id }, { brands: user.id }] } }).then((camps) => {
              if (camps.length) {
                // ctx.args.filter.where.and.push({
                //    or: lodash.map(brands,(br)=>{
                //        return {"meta.brandId": br.id}
                //    })
                // });
                ctx.args.filter.campaignId = lodash.map(camps, (cmp) => cmp.id);
              } else {
                ctx.args.filter.campaignId = "null";
              }
              next();
            }).catch(next);
            // ctx.args.filter.brandId = user.id;
            break;
          default: ;
        }
      }
    }).catch(next);
  };

  Report.get = (filter = {}, reports = {}, user) => {
    // filter = preFilter(filter, user);
    const result = {};
    const { Visit } = Report.app.models;
    return getTrackingReport(filter, reports.tracking)
    .then(trackingData => Promise.all([
        reports.device && getDeviceReport(filter, reports.device, { macList: trackingData.macList, limit: trackingData.totalDevice || 0 }),
        reports.share && getDSPReport(filter, user),
        getTrackingVisitorReport(filter, reports.tracking),
        getTrackingVisitorDetailReport(filter, reports.tracking),
        Visit.exportReport(filter)
      ])
      .spread((deviceData, dspData, visitorData, visitorDataDetail, visitSiteData) => {
        if (trackingData) {
          result.tracking = trackingData;
          result.tracking.macFrequency = lodash.filter(trackingData.macList, item => item.doc_count > 1);
          delete result.tracking.macList;
          result.tracking.totalVisitor = moment().endOf('day').valueOf() === moment(filter.to).valueOf() && moment().startOf('day').valueOf() === moment(filter.from).valueOf() ? visitorData.day : trackingData.totalDevice;
        }
        if (visitorData) {
          result.visitorData = Object.assign({}, visitorData, { totalVisitor: result.tracking.totalVisitor });
        }
        if (visitorDataDetail) {
          result.ApStatics = Object.assign({}, visitorDataDetail, { totalVisitor: trackingData.apTotal });
          delete trackingData.apTotal;
        }
        if (deviceData) {
          result.device = deviceData;
        }
        if (visitSiteData) {
          result.visitSiteData = visitSiteData;
        }
        if (dspData) {
          result.share = {
            daily: [],
            venue: [],
            sum: dspData.sum
          };
          lodash.forEach(dspData.daily, (obj, day) => {
            result.share.daily.push(Object.assign(obj, { day: Number(day) }));
          });
          lodash.forEach(dspData.venue, (obj, locationId) => {
            result.share.venue.push(Object.assign(obj, { locationId }));
          });
        }
        return result;
      })
      .catch(error))
    .catch(error);
  };

  Report.remoteMethod('get', {
    accepts: [
      {
        arg: 'filter',
        type: 'object',
        description: [
          'Filter object. Supported filters:',
          ' + Date/Time: from (Date), to (Date),',
          ' interval (String: overall, day, week, month, year...)',
          ' + Audience: os (window, mac, android...),',
          ' device (pc, mobile...), gender, age, income...',
        ],
      },
      {
        arg: 'reports',
        type: 'object',
        description: [
          'Reports to gets. Supported reports:',
          ' + tracking: { action, newReturn }',
          ' + device: { os, device, gender, age, income, emailVerified, phoneVerified }',
        ],
      },
      { arg: 'user', type: 'object' }
    ],
    http: { path: '/get' },
    returns: { arg: 'data', root: true, type: 'object' },
  });
  Report.beforeRemote('get', beforeGet);

  Report.getLocationMoving = async (mac) => {
    const { Tracking } = Report.app.models;
    const esCon = Tracking.getDataSource().connector;
    const esDb = esCon.db;
    const data = await Promise.promisify(esDb.search).call(esDb, {
      index: esCon.searchIndex,
      type: Tracking.modelName,
      body: {
        "query": {
          "match": { mac }
        },
        "size": 0,
        "aggs": {
          "location": {
            "terms": { "field": "meta.locationId" },
            "aggs": {
              "actionMap": {
                "nested": { "path": "actions" },
                "aggs": {
                  "action": {
                    "terms": { "field": "actions.action", "size": 2 },
                    "aggs": {
                      "firstSeen": { "min": { "field": "actions.time" } },
                      "lastSeen": { "max": { "field": "actions.time" } }
                    }
                  }
                }
              }
            }
          }
        }
      },
    });
    return data;
  };
};
