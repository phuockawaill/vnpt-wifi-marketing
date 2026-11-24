const Promise = require('bluebird');
const moment = require('moment');
const lodash = require('lodash');
const csv = require('csv');

const logger = require('../import/logger')().child({ module: 'Model:Device' });
const debug = require('debug')('app:model:device');
const error = require('debug')('err:model:device');

module.exports = (Device) => {
  Device.disableRemoteMethodByName('exists');
  Device.disableRemoteMethodByName('create');
  Device.disableRemoteMethodByName('upsert');
  Device.disableRemoteMethodByName('updateAll');
  Device.disableRemoteMethodByName('prototype.patchAttributes');
  Device.disableRemoteMethodByName('prototype.updateAttributes');
  Device.disableRemoteMethodByName('replaceOrCreate');
  Device.disableRemoteMethodByName('replaceById');
  Device.disableRemoteMethodByName('upsertWithWhere');
  Device.disableRemoteMethodByName('deleteById');
  Device.disableRemoteMethodByName('createChangeStream');

  Device.audienceFields = [
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
  Device.historyFields = [
    'advertiserId',
    'brandId',
    'campaignId',
    'campaignCategoryId',
    'locationId',
    'locationCategoryId',
    'cityId',
    'bannerId',
  ];
  Device.countFields = {
    campaignCount: 'campaignId',
    locationCount: 'locationId',
    cityCount: 'cityName',
  };

  Device.toId = mac => mac.toLowerCase().replace(/[^\da-z]/g, '');
  Device.observe('before save', (ctx, next) => {
    if (ctx.instance && ctx.isNewInstance) {
      ctx.instance.id = Device.toId(ctx.instance.mac);
    }
    next();
  });

  const getCurrentProfile = async (req) => {
    const { accessToken: AccessToken, user: User } = req.app.models;
    let token = await Promise.resolve(Promise.promisify(AccessToken.findForRequest).call(AccessToken, req))
    if (!token) return null;
    return User.findById(token.userId);
  };

  const getFilterOptions = async (opts, options) => {
    const context = options.currentContext;
    delete opts.options;

    const { Profile, Campaign, User, Location } = Device.app.models;
    let currentProfile = false;
    if (context) {
      currentProfile = context.currentProfileName;
    } else {
      const usr = await getCurrentProfile(options);
      let campaigns;
      // check via profileName
      switch (usr.profileName) {
        case 'admin': {
          let childUsrs = await User.find({ where: { createdBy: usr.id } });
          campaigns = await Campaign.find({ where: { "or": [{ "createdBy": usr.id }].concat(childUsrs.map(chil => ({ "createdBy": chil.id }))) } });
          break;
        }
        case 'client':
          campaigns = await Campaign.find({ where: { createdBy: usr.id } });
          break;
        case 'publisher': {
          const locations = await Location.find({ where: { createdBy: usr.id } });
          opts["meta.locationId"] = { inq: locations.map(loc => loc.id) };
          break;
        }
        case 'brand':
          campaigns = await Campaign.find({ where: { or: [{ brandId: usr.id }, { brands: usr.id }] } });
          break;
        default:
      }
      if (campaigns) opts["meta.campaignId"] = { inq: campaigns.map(cmp => cmp.id) };
      currentProfile = Profile.SYSTEM;
    }
    if (currentProfile === Profile.ADVERTISER) {
      opts.advertiserId = context.currentUserId;
    } else if (currentProfile === Profile.CLIENT || currentProfile === Profile.PUBLISHER) {
      opts.brandId = context.currentUserId;
      delete opts.advertiserId;
    }
    // else if (currentProfile === Profile.PUBLISHER) {
    //   opts.brandId = context.currentUserId;
    //   delete opts.advertiserId;
    // }

    const filterOptions = {};
    Object.keys(opts).forEach((key) => {
      filterOptions[key] = opts[key];
    });

    return new Promise((resolve, reject) => {
      switch (currentProfile) {
        case Profile.SYSTEM:
        case Profile.SUPERADMIN:
        case Profile.ADMIN:
        case Profile.ADVERTISER:
        case Profile.CLIENT:
        case Profile.PUBLISHER:
          return resolve(filterOptions);
        // case Profile.PUBLISHER:
        //   return Promise.all([
        //     Location.find(
        //       {
        //         fields: { id: 1 },
        //         where: opts.locationId ? { id: opts.locationId } : {},
        //       },
        //       options,
        //     ).then(locations => locations.map(location => location.id)),
        //     !opts.campaignId
        //       ? []
        //       : Campaign.find({ fields: { id: 1 } }, options).then(campaigns =>
        //         campaigns.map(campaign => campaign.id),
        //       ),
        //   ]).then(([locationIds, campaignIds]) => {
        //     filterOptions.locationId = { inq: locationIds };
        //     if (filterOptions.campaignId && filterOptions.campaignId.length) {
        //       filterOptions.campaignId = { inq: campaignIds };
        //     }
        //     return resolve(filterOptions);
        //   });
        default:
          return reject(false);
      }
    });
  };
  const beforeFind = (ctx, _, next) => {
    const filter = lodash.get(ctx, 'args.filter', {});
    if (!filter.where) {
      filter.where = {};
    }
    getFilterOptions(filter.where, ctx.req)
      .then((filterOptions) => {
        logger.debug({ data: filterOptions }, 'Find filter option');
        filter.where = filterOptions;
        ctx.args.filter = filter;
        next();
      })
      .catch(next);
    // getFilterOptions(filter.where, { currentContext: ctx.req.currentContext })
    //   .then((filterOptions) => {
    //     logger.debug({ data: filterOptions }, 'Find filter option');
    //     filter.where = filterOptions;
    //     ctx.args.filter = filter;
    //     const User = Device.app.models.User,
    //     Profile = Device.app.models.Profile;
    //     User.findById(ctx.req.accessToken.userId).then((user)=>{
    //         switch (user.profileName){
    //             case Profile.ADMIN: next();break;
    //             case Profile.CLIENT:
    //                 User.find({where: {createdBy: user.id}}).then((brands)=>{
    //                     if(brands.length){
    //                         ctx.args.filter.where.and.push({
    //                            or: lodash.map(brands,(br)=>{
    //                                return {"meta.brandId": br.id}
    //                            })
    //                         });
    //                     } else {
    //                         ctx.args.filter.where.and.push({"meta.brandId": ""});
    //                     }
    //                     next();
    //                 }).catch(next);
    //                 break;
    //             case Profile.BRAND:
    //               ctx.args.filter.where.and.push({"meta.brandId": user.id});
    //                 next();break;
    //             default: ;
    //         }
    //     }).catch(next);
    //   })
    //   .catch(next);
  };

  Device.findWithTotal = (filter) => {
    console.log('findWithTOtal filter', JSON.stringify(filter));
    const esDeviceConn = Device.getDataSource().connector;
    const esDeviceDB = esDeviceConn.db;
    const searchDevice = Promise.promisify(esDeviceDB.search, {
      context: esDeviceDB,
    });

    filter.limit = 100;
    if (!isNaN(filter.offset)) {
      const offset = parseInt(filter.offset, 10);
      filter.offset = Math.min(1000, offset);
    } else {
      delete filter.offset;
    }
    let testFilter = { "where": { "and": [{ "or": [{ "exists": "fb" }] }] }, "offset": 0, "limit": 100, "order": ["updatedAt DESC"] };
    let testFilter1 = { "where": { "and": [{ "exists": "fb" }] }, "offset": 0, "limit": 100, "order": ["updatedAt DESC"] };
    let esQuery = esDeviceConn.buildFilter(Device.modelName, '_doc', filter);
    console.log('findWithTOtal after buildFilter', JSON.stringify(esQuery));
    logger.debug({ data: esQuery }, 'ES Find filter');
    convertAdvanceFilter(esQuery);
    console.log('findWithTOtal query', JSON.stringify(esQuery));
    return searchDevice(esQuery).then((response) => {
      const data = response.hits.hits.map(row =>
        esDeviceConn.dataSourceToModel(Device.modelName, row, 'id'),
      );
      const total = response.hits.total;
      data.map((item) => {
        if (item.survey) {
          Object.keys(item.survey).forEach((i) => {
            item[`survey${i}`] = item.survey[i];
          });
        }
        return item;
      });
      return [data, total];
    });
  };
  Device.remoteMethod('findWithTotal', {
    accepts: [{ arg: 'filter', type: 'object', description: 'Filter object' }],
    http: { verb: 'get' },
    returns: [
      {
        arg: 'data',
        type: [Device.modelName],
        description: 'Array of devices',
      },
      { arg: 'total', type: 'number', description: 'Total matched rows' },
    ],
  });

  const verifyRequest = async (userId, clientKey) => {
    const { User } = Device.app.models;
    const usr = await User.findOne({ where: { _id: userId, clientkey: clientKey } });
    if (!usr) {
      return Promise.reject('Unauthenticate');
    }
    return usr;
  };
  const getFilterOpts = async (opts, usr) => {
    const { Profile, Campaign, User, Location } = Device.app.models;
    let currentProfile = false;
    let campaigns;
    // check via profileName
    switch (usr.profileName) {
      case 'admin': {
        const childUsrs = await User.find({ where: { createdBy: usr.id } });
        campaigns = await Campaign.find({ where: { "or": [{ "createdBy": usr.id }].concat(childUsrs.map(chil => ({ "createdBy": chil.id }))) } });
        break;
      }
      case 'client':
        campaigns = await Campaign.find({ where: { createdBy: usr.id } });
        break;
      case 'publisher': {
        const locations = await Location.find({ where: { createdBy: usr.id } });
        opts["meta.locationId"] = { inq: locations.map(loc => loc.id) };
        break;
      }
      case 'brand':
        campaigns = await Campaign.find({ where: { or: [{ brandId: usr.id }, { brands: usr.id }] } });
        break;
      default:
    }
    if (campaigns) opts["meta.campaignId"] = { inq: campaigns.map(cmp => cmp.id) };
    currentProfile = Profile.SYSTEM;

    const filterOptions = {};
    Object.keys(opts).forEach((key) => {
      filterOptions[key] = opts[key];
    });

    return new Promise((resolve, reject) => {
      switch (currentProfile) {
        case Profile.SYSTEM:
        case Profile.SUPERADMIN:
        case Profile.ADMIN:
        case Profile.ADVERTISER:
        case Profile.CLIENT:
        case Profile.PUBLISHER:
          return resolve(filterOptions);
        default:
          return reject(false);
      }
    });
  };

  Device.getData = (filter = {}, skip = 0, limit = 100, clientId, clientKey, res, cb) => {
    console.log('--->Device.getData request', filter, skip, limit, clientId, clientKey);
    // filter: from-to, campaignId, wifinetworkId, locationId
    Promise.resolve().then(() => verifyRequest(clientId, clientKey))
    .then((usr) =>  getFilterOpts({}, usr))
    .then((filterOptions) => {
      console.log('--->Device.getData filterOptions', filterOptions);

      const esDeviceConn = Device.getDataSource().connector;
      const esDeviceDB = esDeviceConn.db;
      const searchDevice = Promise.promisify(esDeviceDB.search, { context: esDeviceDB });

      filterOptions.and = [];
      if (filter.campaignId) {
        filterOptions.and.push({ 'meta.campaignId': filter.campaignId });
      }
      if (filter.locationId) {
        filterOptions.and.push({ 'meta.locationId': filter.locationId });
      }
      if (filter.wifiNetWorkId) {
        filterOptions.and.push({ 'meta.locationCategoryId': filter.wifiNetWorkId });
      }
      if (filter.from) {
        filterOptions.and.push({ updatedAt: { gte: moment(filter.from).format() } });
      }
      if (filter.to) {
        filterOptions.and.push({ updatedAt: { lte: moment(filter.to).format() } });
      }
      const filterData = { where: filterOptions, offset: Math.round(skip), limit: Math.min(1000, Math.round(limit)), order:['updatedAt DESC'] };
      const esQuery = esDeviceConn.buildFilter(Device.modelName, '_doc', filterData);
      console.log('--->Device.getData esQuery', JSON.stringify(esQuery));
      return searchDevice(esQuery).then((response) => {
        const data = response.hits.hits.map(row =>
          esDeviceConn.dataSourceToModel(Device.modelName, row, 'id'),
        );
        const total = response.hits.total;
        data.map((item) => {
          if (item.survey) {
            Object.keys(item.survey).forEach((i) => {
              item[`survey${i}`] = item.survey[i];
            });
          }
          return item;
        });
        res.send({ data, total });
      });
    })
    .catch((err) => {
      const errorObj = new Error(err);
      errorObj.statusCode = 400;
      cb(errorObj);
    });
  };
  Device.remoteMethod('getData', {
    accepts: [
      { arg: 'filter', type: 'object', description: 'Filter object' },
      { arg: 'skip', type: 'number', description: 'Skip records' },
      { arg: 'limit', type: 'number', description: 'Amount limit max 1000' },
      { arg: 'clientId', type: 'string', required: true, description: 'Client Id' },
      { arg: 'clientKey', type: 'string', required: true, description: 'Client Key' },
      { arg: 'res', type: 'object', 'http': { source: 'res' } }
    ],
    http: { verb: 'post' },
    returns: [
      {
        arg: 'data',
        type: [Device.modelName],
        description: 'Array of devices',
      },
      { arg: 'total', type: 'number', description: 'Total matched rows' }
    ]
  });

  Device.detail = (id, filter, options) => {
    if (!filter) {
      filter = {};
    }
    if (!filter.where) {
      filter.where = {};
    }

    return Promise.all([
      Device.findById(id),
      getFilterOptions(filter.where, options),
    ]).spread((device, filterOptions) => {
      if (!device) {
        throw new Error('Not found!');
      }
      filter.where = filterOptions;
      filter.fields = {};
      Device.historyFields.forEach((part) => {
        filter.fields[part] = 0;
      });

      const Tracking = Device.app.models.Tracking;
      return Tracking.find(filter);
    });
  };
  Device.remoteMethod('detail', {
    accepts: [
      { arg: 'id', type: 'string', required: true },
      { arg: 'filter', type: 'object' },
    ],
    http: { path: '/:id/detail', verb: 'get' },
    returns: [{ arg: 'detail', type: 'array', root: true }],
  });

  Device.infoMac = id => Device.findById(Device.toId(id));
  Device.remoteMethod('infoMac', {
    accepts: [
      { arg: 'id', type: 'string', required: true },
    ],
    http: { path: '/:id/infoMac', verb: 'get' },
    returns: { arg: 'data', root: true, type: 'object' },
  });

  Device.beforeRemote('find', beforeFind);
  Device.beforeRemote('findWithTotal', beforeFind);
  Device.beforeRemote('findById', beforeFind);
  Device.beforeRemote('findOne', beforeFind);

  const convertAdvanceFilter = (esQueryRaw) => {
    esQueryRaw.body.sort = esQueryRaw.body.sort.map((item) => {
      if (item === 'fb.fbId') {
        return { ['fb.fbId']: { nested_path: 'fb' } }
      } else if (item['fb.fbId']) {
        item['fb.fbId'] = { nested_path: 'fb', order: 'desc' };
      }
      return item;
    });
    if (esQueryRaw.body.query.bool && esQueryRaw.body.query.bool.must) {
      let reItem;
      esQueryRaw.body.query.bool.must = esQueryRaw.body.query.bool.must.map((item) => {
        if (item['match']) {
          reItem = { ["wildcard"]: item['match'] };
          Object.keys(item['match']).forEach((key) => {
            if (typeof item['match'][key] !== 'object') {
              if (item['match'][key].indexOf('$$hasValue') > -1) {
                if (key === 'fb') {
                  reItem = { "nested": { "path": "fb", "query": { "match_all": {} } } };
                } else {
                  reItem = { "exists": { "field": key } };
                }
              } else if (item['match'][key].indexOf('$$noValue') > -1) {
                reItem = {};
                if (!esQueryRaw.body.query.bool.must_not) {
                  esQueryRaw.body.query.bool.must_not = [];
                }
                if (key === 'fb') {
                  esQueryRaw.body.query.bool.must_not.push({ "nested": { "path": "fb", "query": { "match_all": {} } } });
                } else {
                  esQueryRaw.body.query.bool.must_not.push({ "exists": { "field": key } });
                }
              } else if (item['match'][key].indexOf('$$fromFb') > -1) {
                if (key === 'audience.name') {
                  reItem = { "nested": { "path": "fb", "query": { "exists": { "field": "fb.fbName" } } } };
                } else {
                  reItem = { "nested": { "path": "fb", "query": { "exists": { "field": key.replace('audience', 'fb') } } } };
                }
              } else if (item['match'][key].indexOf('$$fromGg') > -1) {
                reItem = { "nested": { "path": "google", "query": { "exists": { "field": key.replace('audience', 'google') } } } };
              } else if (item['match'][key].indexOf('$$fromSur') > -1) {
                if (!esQueryRaw.body.query.bool.must_not) {
                  esQueryRaw.body.query.bool.must_not = [];
                }
                esQueryRaw.body.query.bool.must_not.push({ "nested": { "path": "fb", "query": { "match_all": {} } } });
                esQueryRaw.body.query.bool.must_not.push({ "nested": { "path": "google", "query": { "match_all": {} } } });
                reItem = { "exists": { "field": key } };
              }
            }
          });
          return reItem;
        }
        if (item['bool'] && item['bool']['should']) {
          item['bool']['should'] = item['bool']['should'].map((item) => {
            if (item['match']) {
              reItem = { ["wildcard"]: item['match'] };
              Object.keys(item['match']).forEach((key) => {
                if (typeof item['match'][key] !== 'object') {
                  if (item['match'][key].indexOf('$$hasValue') > -1) {
                    if (key === 'fb') {
                      reItem = { "nested": { "path": "fb", "query": { "match_all": {} } } };
                    } else {
                      reItem = { "exists": { "field": key } };
                    }
                  } else if (item['match'][key].indexOf('$$noValue') > -1) {
                    reItem = {};
                    if (!esQueryRaw.body.query.bool.must_not) {
                      esQueryRaw.body.query.bool.must_not = [];
                    }
                    if (key === 'fb') {
                      esQueryRaw.body.query.bool.must_not.push({ "nested": { "path": "fb", "query": { "match_all": {} } } });
                    } else {
                      esQueryRaw.body.query.bool.must_not.push({ "exists": { "field": key } });
                    }
                  } else if (item['match'][key].indexOf('$$fromFb') > -1) {
                    if (key === 'audience.name') {
                      reItem = { "nested": { "path": "fb", "query": { "exists": { "field": "fb.fbName" } } } };
                    } else {
                      reItem = { "nested": { "path": "fb", "query": { "exists": { "field": key.replace('audience', 'fb') } } } };
                    }
                  } else if (item['match'][key].indexOf('$$fromGg') > -1) {
                    reItem = { "nested": { "path": "google", "query": { "exists": { "field": key.replace('audience', 'google') } } } };
                  } else if (item['match'][key].indexOf('$$fromSur') > -1) {
                    if (!esQueryRaw.body.query.bool.must_not) {
                      esQueryRaw.body.query.bool.must_not = [];
                    }
                    esQueryRaw.body.query.bool.must_not.push({ "nested": { "path": "fb", "query": { "match_all": {} } } });
                    esQueryRaw.body.query.bool.must_not.push({ "nested": { "path": "google", "query": { "match_all": {} } } });
                    reItem = { "exists": { "field": key } };
                  }
                }
              });
              return reItem;
            }
            return item;
          });
        }
        return item;
      });
    }
  };
  const getExportInitChunk = (filter) => {
    const esDeviceConn = Device.getDataSource().connector;
    const esDeviceDB = esDeviceConn.db;
    const searchDevice = Promise.promisify(esDeviceDB.search, {
      context: esDeviceDB,
    });

    const esQuery = esDeviceConn.buildFilter(
      Device.modelName,
      '_doc',
      filter,
      1000,
    );
    console.log('getExportInitChunk query', JSON.stringify(esQuery));
    esQuery.scroll = '30s';
    convertAdvanceFilter(esQuery);
    logger.debug({ data: esQuery }, 'Export filter');
    return searchDevice(esQuery);
  };
  const getExportNextChunk = (scrollId) => {
    const esDeviceConn = Device.getDataSource().connector;
    const esDeviceDB = esDeviceConn.db;
    const scrollDevice = Promise.promisify(esDeviceDB.scroll, {
      context: esDeviceDB,
    });

    return scrollDevice({ scroll: '30s', scroll_id: scrollId });
  };
  Device.export = (filter, stream, req) => {
    debug('export %o', filter);
    const { accessToken: AccessToken, user: User, Location, Campaign } = Device.app.models;
    let stringifier;
    const csvHeaders = {
      mac: 'MAC',
      'fb.fbId': 'Facebook ID',
      'fb.fbName': 'Facebook Name',
      'audience.name': 'Name',
      'audience.phone': 'Phone',
      'audience.email': 'Email',
      'audience.gender': 'Gender',
      'audience.age': 'Age',
      'audience.income': 'Income',
      'audience.device': 'Device',
      'audience.os': 'OS',
      locations: 'Locations',
      updatedAt: 'Last seen',
    };

    let firstChunk = true;
    let totalHandled = 0;
    let writeFinish = false;
    const locationList = {};
    const surveyFields = [];
    const sourceField = '_source';
    const scrollField = '_scroll_id';

    return Promise.resolve(Promise.promisify(AccessToken.findForRequest).call(AccessToken, req))
      .then(async (token) => {
        if (!token) return null;
        let user = await User.findById(token.userId);
        let locationData = await Location.find({ fields: { id: 1, name: 1 } });
        locationData.forEach((loc) => {
          locationList[loc.id] = loc.name;
        });
        let queryCampaign = { fields: { customFields: 1, locations: 1 } };
        if (user.profileName !== 'superadmin') {
          if (user.profileName === 'admin') {
            let childUsrs = await User.find({ where: { createdBy: user.id } });
            queryCampaign = Object.assign({}, queryCampaign, { where: { "or": [{ "createdBy": user.id }].concat(childUsrs.map(chil => ({ "createdBy": chil.id }))) } });
          } else {
            queryCampaign = Object.assign({}, queryCampaign, { where: { createdBy: user.id } });
          }
        }
        return Campaign.find(queryCampaign);
      }).then((campaigns) => {
        if (campaigns.length) {
          let customFields = [];
          campaigns.forEach((campaign) => {
            customFields = customFields.concat(lodash.get(campaign, 'customFields', []));
          });
          lodash.uniqBy(customFields, 'fieldName').forEach((field) => {
            csvHeaders[
              `survey.${field.fieldName}`
            ] = `${field.displayName} (${field.fieldName})`;
            surveyFields.push(field.fieldName);
          });
        }
        const whereClauses = lodash.get(filter, 'where.and', []);
        const [campaignClause] = whereClauses.filter(
          item => item['meta.campaignId'],
        );
        debug('all where', whereClauses);
        debug('campaign where', campaignClause);

        return (
          campaignClause && Campaign.findById(campaignClause['meta.campaignId'])
        );
      })
      .then((campaign) => {
        const customFields = lodash.get(campaign, 'customFields', []);
        customFields.forEach((field) => {
          csvHeaders[
            `survey.${field.fieldName}`
          ] = `${field.displayName} (${field.fieldName})`;
          surveyFields.push(field.fieldName);
        });
        stringifier = csv.stringify({
          header: true,
          columns: csvHeaders,
          quotedString: true
        });
        stringifier.on('readable', () => {
          let data = stringifier.read();
          while (data) {
            stream.write(data);
            data = stringifier.read();
          }
        });
        return getExportInitChunk(filter);
      })
      .then(async function handleResponse(response) {
        if (response.hits.total > Device.app.get('export').maxRows) {
          return Promise.reject({
            statusCode: 500,
            message: `Too many records (${response.hits.total})`,
          });
        }
        logger.debug(
          'Chunk data, offset %d/%d',
          totalHandled,
          response.hits.total,
        );
        if (firstChunk) {
          if (typeof stream.header === 'function') {
            stream.header('Content-Type', 'text/csv; charset=utf-8');
            stream.header(
              'Content-Disposition',
              `attachment; filename=crm-${new Date().getTime()}.csv`,
            );
          }
          // stream.write(new Buffer('EFBBBF', 'hex'));
          stream.write(Buffer.from('EFBBBF', 'hex'));
          firstChunk = false;
        }

        response.hits.hits.forEach((device) => {
          device = device[sourceField];
          device.locations = device.meta.locationId.map(id => locationList[id] || 'Unknown').join(',').replace(/,Unknown/g, '').replace(/Unknown,/g, '');
          device.updatedAt = moment(device.updatedAt).format('MMM DD, YYYY HH:mm');
          device.audience.device = device.audience.device === 'other' ? 'unknown' : device.audience.device;
          device.audience.os = device.audience.os === 'other' ? 'unknown' : device.audience.os;
          if (device.survey) {
            surveyFields.forEach((field) => {
              device[`survey.${field}`] = device.survey[field];
            });
          }
          if (device.fb && device.fb.fbId) {
            device.fb.fbId = `https://facebook.com/${device.fb.fbId}`;
          }
          stringifier.write(device);
        });
        totalHandled += response.hits.hits.length;
        if (totalHandled < response.hits.total) {
          return getExportNextChunk(response[scrollField])
            .then(handleResponse)
            .catch((err) => {
              logger.error({ err }, 'Error when get next scroll');
              console.log('Error when get next scroll', err);
              stream.end();
            });
        }
        await sleep(1000);
        return stream.end();
        // return stream.end();
      });
  };
  const sleep = m => new Promise(r => setTimeout(r, m));

  // Device.export = (filter, stream) => {
  //   logger.debug({ data: filter }, 'Export query');

  //   const stringifier = csv.stringify({
  //     header: true,
  //     columns: {
  //       mac: 'MAC',
  //       'audience.name': 'Name',
  //       'audience.phone': 'Phone',
  //       'audience.email': 'Email',
  //       'audience.gender': 'Gender',
  //       'audience.age': 'Age',
  //       'audience.income': 'Income',
  //       'audience.device': 'Device',
  //       'audience.os': 'OS',
  //       updatedAt: 'Last seen',
  //     },
  //     quotedString: true,
  //   });
  //   stringifier.on('readable', () => {
  //     let data = stringifier.read();
  //     while (data) {
  //       stream.write(data);
  //       data = stringifier.read();
  //     }
  //   });

  //   let firstChunk = true;
  //   let totalHandled = 0;
  //   return getExportInitChunk(filter)
  //     .then(function handleResponse(response) {
  //       if (response.hits.total > Device.app.get('export').maxRows) {
  //         return Promise.reject({ statusCode: 500, message: `Too many records (${response.hits.total})` });
  //       }
  //       logger.debug('Chunk data, offset %d/%d', totalHandled, response.hits.total);
  //       if (firstChunk) {
  //         if (typeof stream.header === 'function') {
  //           stream.header('Content-Type', 'text/csv; charset=utf-8');
  //           stream.header('Content-Disposition', `attachment; filename=crm-${moment().format('YYYYMMDD')}.csv`);
  //         }
  //         stream.write(new Buffer('EFBBBF', 'hex'));
  //         firstChunk = false;
  //       }
  //       response.hits.hits.forEach(device => stringifier.write(device._source));
  //       totalHandled += response.hits.hits.length;
  //       if (totalHandled < response.hits.total) {
  //         return getExportNextChunk(response._scroll_id)
  //           .then(handleResponse)
  //           .catch((err) => {
  //             logger.error({ err }, 'Error when get next scroll');
  //             stream.end();
  //           });
  //       }
  //       stream.end();
  //     });
  // };
  Device.remoteMethod('export', {
    description: 'Export CRM',
    accepts: [
      { arg: 'filter', type: 'object' },
      { arg: 'res', type: 'object', http: { source: 'res' } },
      { arg: 'req', type: 'object', http: { source: 'req' } }
    ],
    http: { verb: 'get', path: '/export' }
  });
  Device.beforeRemote('export', beforeFind);

  Device.macData = (mac) => {
    const { Visit } = Device.app.models;
    return Promise.all([
      Visit.getMacAgg(mac)
    ])
      .spread((data) => {
        return data;
      })
      .catch(error);
  };
  Device.remoteMethod('macData', {
    accepts: [
      {
        arg: 'mac',
        type: 'string',
        description: 'Mac device',
        require: true
      }
    ],
    http: { path: '/macData' },
    returns: { arg: 'data', root: true, type: 'object' },
  });

  Device.locationMoving = (mac) => {
    const { Report } = Device.app.models;
    return Promise.all([
      Report.getLocationMoving(mac)
    ])
      .spread((data) => {
        let result = {};
        data.aggregations.location.buckets.forEach((loc) => {
          const [clickAct] = loc.actionMap.action.buckets.filter(i => i.key === 'click');
          result[loc.key] = clickAct || {};
        });
        return { location: result };
      })
      .catch(error);
  };
  Device.remoteMethod('locationMoving', {
    accepts: [
      {
        arg: 'mac',
        type: 'string',
        description: 'Mac device',
        require: true
      }
    ],
    http: { path: '/locationMoving' },
    returns: { arg: 'data', root: true, type: 'object' },
  });
};
