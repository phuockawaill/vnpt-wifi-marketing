const Promise = require('bluebird');
const lodash = require('lodash');
const moment = require('moment');
const excel = require('excel-export');
const csv = require('csv');
const path = require('path');

const logger = require('../import/logger')().child({
  module: 'model:ReportCampaign',
});

module.exports = (ReportCampaign) => {
  ReportCampaign.getStatusReport = (options) => {
    const { Campaign } = ReportCampaign.app.models;

    return Campaign.find({ fields: { id: 1 } }, options)
      .then(campaigns => campaigns.map(c => c.id))
      .then((campaignIds) => {
        const collection = Campaign.getDataSource().connector.collection(
          Campaign.modelName,
        );
        const aggregate = Promise.promisify(collection.aggregate, {
          context: collection,
        });

        const idField = '_id';

        return aggregate([
          { $match: { [idField]: { $in: campaignIds } } },
          { $group: { [idField]: '$status', count: { $sum: 1 } } },
        ])
          .then((data) => {
            const result = {};
            Campaign.statuses.forEach((status) => {
              result[status] = 0;
            });
            data = data.forEach((row) => {
              result[row[idField]] = row.count;
            });
            logger.debug({ data }, 'Get status report finished');

            return Object.keys(result).map(key => ({
              name: key,
              y: result[key],
            }));
          })
          .catch((err) => {
            logger.error({ err }, 'Get status report failed');
          });
      });
  };
  ReportCampaign.remoteMethod('getStatusReport', {
    description: 'Return status report',
    http: { verb: 'get', path: '/status' },
    returns: { type: 'array', root: true },
  });

  const processSummaryTracking = (campaign, actionData) => {
    const result = {};
    const app = ReportCampaign.app;
    const categories = app.get('op:h:location_category') || {};
    const cities = app.get('op:h:city') || {};
    result.count = lodash.get(actionData, 'count.value', 0);
    result.real = lodash.get(actionData, 'real.value', 0);

    result.locations = lodash
      .get(actionData, 'locations.buckets', [])
      .map(item => ({
        y: lodash.get(item, 'count.value', 0),
        real: lodash.get(item, 'real.value', 0),
        locationId: item.key,
      }));

    const deviceBuckets = lodash.get(actionData, 'devices.buckets', {});
    Object.keys(deviceBuckets).forEach((devType) => {
      const dev = deviceBuckets[devType];
      deviceBuckets[devType] = lodash.get(dev, 'count.value', 0);
    });
    result.devices = deviceBuckets;

    let locations = lodash.get(campaign, 'locations', []);
    locations = lodash.zipObject(locations.map(i => i.locationId), locations);

    result.locations.forEach((loc) => {
      loc.categoryId = lodash.get(locations, `${loc.locationId}.categoryId`);
      loc.category = categories[loc.categoryId];
      loc.city = cities[lodash.get(locations, `${loc.locationId}.cityId`)];
      loc.name = lodash.get(
        locations,
        `${loc.locationId}.locationName`,
        loc.locationId,
      );
    });

    const categoryGroups = lodash.groupBy(result.locations, l => l.categoryId);
    let catData = lodash.get(actionData, 'categories.buckets', []);
    catData = lodash.zipObject(catData.map(i => i.key), catData);
    result.categories = Object.keys(categoryGroups).map(categoryId => ({
      name: categories[categoryId],
      y: lodash.sumBy(categoryGroups[categoryId], 'y'),
      real: lodash.get(catData, `${categoryId}.real.value`, 0),
    }));

    const cityGroups = lodash.groupBy(result.locations, l => l.city);
    result.cities = Object.keys(cityGroups).map(cityName => ({
      name: cityName,
      y: lodash.sumBy(cityGroups[cityName], 'y'),
    }));

    return result;
  };
  const getSummaryTracking = (campaign, options) => {
    const { Tracking, Location, Profile } = ReportCampaign.app.models;
    const esTrackingConn = Tracking.getDataSource().connector;
    const esTrackingDB = esTrackingConn.db;
    const search = Promise.promisify(esTrackingDB.search, {
      context: esTrackingDB,
    });

    const countAgg = { count: { sum: { field: 'count', missing: 1 } } };
    const realAgg = {
      real: { cardinality: { field: 'mac', precision_threshold: 10000 } },
    };
    const searchBody = {
      query: {
        bool: {
          filter: [{ term: { campaignId: campaign.id.toString() } }],
        },
      },
      aggs: {
        actions: {
          filters: {
            filters: {
              [Tracking.CLICK]: { term: { actionType: Tracking.CLICK } },
              [Tracking.IMPRESSION]: {
                term: { actionType: Tracking.IMPRESSION },
              },
            },
          },
          aggs: {
            real: lodash.cloneDeep(realAgg.real),
            count: lodash.cloneDeep(countAgg.count),
            locations: {
              terms: { field: 'locationId', size: 1000 },
              aggs: {
                real: lodash.cloneDeep(realAgg.real),
                count: lodash.cloneDeep(countAgg.count),
              },
            },
            categories: {
              terms: { field: 'locationCategoryId', size: 100 },
              aggs: lodash.cloneDeep(realAgg),
            },
            devices: {
              filters: {
                filters: {
                  desktop: { term: { device: 'pc' } },
                },
                other_bucket_key: 'mobile',
              },
              aggs: lodash.cloneDeep(countAgg),
            },
          },
        },
      },
      size: 0,
    };

    const context = lodash.get(options, 'currentContext', {});
    return new Promise((resolve, reject) => {
      // if (context.currentProfileName === Profile.PUBLISHER) {
      //   return Location.find({ fields: { id: 1 } }, options)
      //     .then(resolve)
      //     .catch(reject);
      // }
      return resolve([]);
    })
      .then(locations => locations.map(i => i.id.toString()))
      .then((locationIds) => {
        if (locationIds.length) {
          searchBody.query.bool.filter.push({
            terms: { locationId: locationIds },
          });
        }

        logger.debug({ data: searchBody }, 'Tracking search query');
        return search({
          index: esTrackingConn.searchIndex,
          type: Tracking.modelName,
          body: searchBody,
        });
      })
      .then(({ aggregations: aggs }) =>
        Promise.all([
          processSummaryTracking(
            campaign,
            lodash.get(aggs, 'actions.buckets.click', {}),
          ),
          processSummaryTracking(
            campaign,
            lodash.get(aggs, 'actions.buckets.impression', {}),
          ),
        ]),
      )
      .then(([click, impression]) => ({ click, impression }));
  };
  const processSummaryDevice = (campaign, deviceData) => {
    const result = {};
    const app = ReportCampaign.app;
    const genders = app.get('op:h:gender_category');
    const ages = app.get('op:h:age_category');
    const categories = app.get('op:h:location_category');

    result.count = lodash.get(deviceData, 'doc_count', 0);

    const genderData = lodash.get(deviceData, 'genders.buckets', {});
    result.genders = Object.keys(genderData).map((genderKey) => {
      const item = genderData[genderKey];
      return { y: item.doc_count, name: genders[genderKey] || genderKey };
    });

    const ageData = lodash.get(deviceData, 'ages.buckets', {});
    result.ages = Object.keys(ageData).map((ageKey) => {
      const item = ageData[ageKey];
      return { y: item.doc_count, name: ages[ageKey] || ageKey };
    });

    result.locations = lodash
      .get(deviceData, 'locations.buckets', [])
      .map(loc => ({ y: loc.doc_count, name: loc.key }));

    let locations = lodash.get(campaign, 'locations', []);
    locations = lodash.zipObject(locations.map(i => i.locationId), locations);

    result.locations.forEach((loc) => {
      loc.category =
        categories[lodash.get(locations, `${loc.name}.categoryId`)];
      loc.name = lodash.get(locations, `${loc.name}.locationName`, loc.name);
    });

    const categoryGroups = lodash.groupBy(result.locations, l => l.category);
    result.categories = Object.keys(categoryGroups).map(catName => ({
      name: catName,
      y: lodash.sumBy(categoryGroups[catName], 'y'),
    }));

    return result;
  };
  const getSummaryDevice = (campaign, options) => {
    const app = ReportCampaign.app;
    const { Device, Location, Profile } = app.models;
    const esDeviceConn = Device.getDataSource().connector;
    const esDeviceDB = esDeviceConn.db;
    const search = Promise.promisify(esDeviceDB.search, {
      context: esDeviceDB,
    });

    const genders = Object.keys(app.get('op:h:gender_category') || {})
      .filter(i => i !== 'other')
      .map(gender => ({ [gender]: { term: { gender } } }));

    const ages = Object.keys(app.get('op:h:age_category') || {})
      .filter(i => i !== 'other')
      .map(age => ({ [age]: { term: { age } } }));

    const searchBody = {
      query: {
        bool: {
          filter: [{ term: { campaignId: campaign.id.toString() } }],
        },
      },
      aggs: {
        genders: {
          filters: {
            filters: Object.assign.apply(null, [{}].concat(genders)),
            other_bucket_key: 'other',
          },
        },
        ages: {
          filters: {
            filters: Object.assign.apply(null, [{}].concat(ages)),
            other_bucket_key: 'other',
          },
        },
        locations: {
          terms: { field: 'locationId', size: 1000 },
        },
      },
      size: 0,
    };

    const context = lodash.get(options, 'currentContext', {});
    return new Promise((resolve, reject) => {
      // if (context.currentProfileName === Profile.PUBLISHER) {
      //   return Location.find({ fields: { id: 1 } }, options)
      //     .then(resolve)
      //     .catch(reject);
      // }
      return resolve([]);
    })
      .then(locations => locations.map(i => i.id.toString()))
      .then((locationIds) => {
        if (locationIds.length) {
          searchBody.query.bool.filter.push({
            terms: { locationId: locationIds },
          });
        }

        logger.debug({ data: searchBody }, 'Device search query');
        return search({
          index: esDeviceConn.searchIndex,
          type: Device.modelName,
          body: searchBody,
        });
      })
      .then((res) => {
        res.aggregations.doc_count = lodash.get(res, 'hits.total', 0);
        return processSummaryDevice(campaign, res.aggregations);
      });
  };

  ReportCampaign.getSummaryReport = (
    campaignId,
    reportDateFrom,
    reportDateTo,
    options,
  ) => {
    const { Campaign, ReportTracking } = ReportCampaign.app.models;

    return Campaign.findById(campaignId, options)
      .then((campaign) => {
        if (!campaign) {
          return Promise.reject(
            new Error('Campaign not found', { statusCode: 404 }),
          );
        }

        return Promise.all([
          ReportTracking.getReport(
            undefined,
            undefined,
            campaignId,
            undefined,
            undefined,
            reportDateFrom,
            reportDateTo,
            'day',
            undefined,
            options,
          ),
          getSummaryTracking(campaign, options),
          getSummaryDevice(campaign, options),
        ]);
      })
      .catch((err) => {
        logger.error({ err }, 'Get Campaign report failed');
        throw err;
      });
  };
  ReportCampaign.remoteMethod('getSummaryReport', {
    description: 'Return campaign reports',
    accepts: [
      {
        arg: 'campaignId',
        type: 'string',
        description: 'Campaign ID',
        required: true,
      },
      { arg: 'reportDateFrom', type: 'date', description: 'Get report from' },
      { arg: 'reportDateTo', type: 'date', description: 'Get report to' },
    ],
    http: { verb: 'get', path: '/:campaignId/summary' },
    returns: [
      { arg: 'trackingByTime', type: 'array' },
      { arg: 'tracking', type: 'object' },
      { arg: 'device', type: 'object' },
    ],
  });

  const exportExcelConfig = {
    stylesXmlFile: path.resolve('server/import/export', 'excel-style.xml'),
    cols: [
      {
        caption: 'Date',
        type: 'date',
      },
      {
        caption: 'CampaignId',
        type: 'string',
      },
      {
        caption: 'CampaignName',
        type: 'string',
      },
      {
        caption: 'Location',
        type: 'string',
      },
      {
        caption: 'Click',
        type: 'number',
      },
      {
        caption: 'Reach',
        type: 'number',
      },
      {
        caption: 'CTR',
        type: 'number',
      },
    ],
  };

  const exportExcel = (reports, stream) => {
    const excelConfig = lodash.cloneDeep(exportExcelConfig);
    excelConfig.rows = reports;

    excel.executeAsync(excelConfig, (result) => {
      stream.write(result, 'binary');
      stream.end();
    });
  };

  const exportCsv = (reports, stream) => {
    const stringifier = csv.stringify({
      header: true,
      columns: {
        0: 'Date',
        1: 'Campaign Id',
        2: 'Campaign Name',
        3: 'Location',
        4: 'Click',
        5: 'Impression',
        6: 'CTR',
      },
      quotedString: true,
    });
    stringifier.on('readable', () => {
      let data = stringifier.read();
      while (data) {
        stream.write(data);
        data = stringifier.read();
      }
    });

    stream.write(new Buffer('EFBBBF', 'hex'));
    reports.forEach(stringifier.write.bind(stringifier));
    stream.end();
  };
  const exporters = {
    csv: exportCsv,
    xlsx: exportExcel,
    default: exportExcel,
  };

  ReportCampaign.export = (
    campaignId,
    locationId,
    bannerId,
    dateFrom,
    dateTo,
    format = 'xlsx',
    stream,
    cb,
  ) => {
    const { Campaign, ReportTracking } = ReportCampaign.app.models;

    Campaign.findById(campaignId)
      .then((campaign) => {
        if (!campaign) {
          return cb(new Error('Campaign not found', { statusCode: 404 }));
        }

        const locations = lodash.zipObject(
          campaign.locations.map(l => l.locationId),
          campaign.locations.map(l => l.locationName),
        );

        return ReportTracking.getReport(
          undefined,
          undefined,
          campaignId,
          locationId,
          bannerId,
          dateFrom,
          dateTo,
          'day',
          'location',
        ).then((reports) => {
          const computedReport = reports.reduce((result, row) => {
            const detail = {};
            row.clickDetail.forEach((location) => {
              lodash.set(detail, `${location.key}.click`, location.count);
            });
            row.impressionDetail.forEach((location) => {
              lodash.set(detail, `${location.key}.impression`, location.count);
            });

            Object.keys(detail).forEach((location) => {
              const ctr = `${((detail[location].click || 0) /
                ((detail[location].impression || 1) * 0.01)).toFixed(2)}%`;
              result.push([
                moment(row.key).format('DD/MM/YYYY'),
                campaign.id.toString(),
                campaign.name,
                locations[location] || location,
                detail[location].click,
                detail[location].impression,
                ctr,
              ]);
            });

            return result;
          }, []);

          const filename = `[${campaign.name}]${new Date().getTime()}`;
          const exporter = format in exporters ? format : 'default';

          if (typeof stream.header === 'function') {
            stream.header(
              'Content-Type',
              format === 'xlsx'
                ? 'application/vnd.openxmlformats'
                : 'text/csv; charset=utf-8',
            );
            stream.header(
              'Content-Disposition',
              `attachment; filename=${filename}.${format}`,
            );
          }
          exporters[exporter](computedReport, stream);
        });
      })
      .catch((err) => {
        logger.error({ err }, 'Campaign export failed');
        cb(err);
      });
  };
  ReportCampaign.remoteMethod('export', {
    description: 'Export campaign reports',
    accepts: [
      {
        arg: 'campaignId',
        type: 'string',
        description: 'Campaign ID',
        required: true,
      },
      { arg: 'locationId', type: 'string', description: 'Location ID' },
      { arg: 'bannerId', type: 'string', description: 'Banner ID' },
      { arg: 'reportDateFrom', type: 'date', description: 'Export from' },
      { arg: 'reportDateTo', type: 'date', description: 'Export to' },
      {
        arg: 'format',
        type: 'string',
        description: 'Export format: csv or excel',
      },
      { arg: 'res', type: 'object', http: { source: 'res' } },
    ],
    http: { verb: 'get', path: '/:campaignId/export' },
  });
};
