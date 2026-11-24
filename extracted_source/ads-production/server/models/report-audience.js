const moment = require('moment');
const Promise = require('bluebird');
const lodash = require('lodash');
// const response = require('../import/response');
const { getMethodArguments } = require('../import/utils');

const logger = require('../import/logger')().child({
  module: 'model:ReportAudience',
});

module.exports = (ReportAudience) => {
  const OS = 'os';
  const DEVICE = 'device';
  const AGE = 'age';
  const GENDER = 'gender';
  const INCOME = 'income';
  const MARITAL = 'marital';
  const PHONE = 'phoneVerified';
  const CARRIER = 'phoneCarrier';
  ReportAudience.OS = OS;
  ReportAudience.DEVICE = DEVICE;
  ReportAudience.AGE = AGE;
  ReportAudience.GENDER = GENDER;
  ReportAudience.INCOME = INCOME;
  ReportAudience.MARITAL = MARITAL;
  ReportAudience.PHONE = PHONE;
  ReportAudience.CARRIER = CARRIER;
  ReportAudience.reportTypes = [
    OS,
    DEVICE,
    AGE,
    GENDER,
    INCOME,
    MARITAL,
    PHONE,
    CARRIER,
  ];

  const childFilters = {
    [OS]: OS,
    [DEVICE]: DEVICE,
    [AGE]: AGE,
    [GENDER]: GENDER,
    [INCOME]: INCOME,
    [MARITAL]: MARITAL,
  };
  const getFilterOptions = (opts) => {
    const { Profile, Location, Campaign } = ReportAudience.app.models;
    const { options = {} } = opts;
    const context = options.currentContext;
    delete opts.options;

    let currentProfile = false;
    if (context) {
      currentProfile = context.currentProfileName;
    } else {
      currentProfile = Profile.SYSTEM;
    }

    const filterOptions = {
      query: {
        bool: {
          filter: [],
          must_not: [],
        },
      },
      size: 0,
    };
    const child = {
      child: {
        terms: { field: null },
      },
    };
    const audienceAgg = {
      audience: {},
    };
    switch (opts.reportType) {
      case PHONE:
        filterOptions.query.bool.filter.push({ exists: { field: 'phone' } });
        filterOptions.query.bool.must_not.push({ term: { phone: 'other' } });
        audienceAgg.audience.filters = {
          filters: {
            Verified: { term: { phoneVerified: 'true' } },
          },
          other_bucket_key: 'Not Verified',
        };
        break;
      default:
        if (ReportAudience.reportTypes.indexOf(opts.reportType) > -1) {
          filterOptions.query.bool.must_not.push({
            term: { [opts.reportType]: 'other' },
          });
          audienceAgg.audience.terms = {
            field: opts.reportType,
            size: 10,
          };
        } else {
          filterOptions.query.bool.must_not.push({
            term: { [`survey.${opts.reportType}`]: 'other' },
          });
          audienceAgg.audience.terms = {
            field: `survey.${opts.reportType}`,
            size: 10,
          };
        }
        break;
    }
    const timeAgg = {
      time: {
        date_histogram: {
          field: 'updatedAt',
          interval: 'month',
          time_zone: 'Asia/Jakarta',
        },
      },
    };

    delete opts.reportType;
    const dateFilter = { range: { updatedAt: { format: 'epoch_millis' } } };
    if (opts.reportDateFrom) {
      dateFilter.range.updatedAt.gte = moment(opts.reportDateFrom).valueOf();
    } else {
      dateFilter.range.updatedAt.gte = moment('2015-01-01').valueOf();
    }
    if (opts.reportDateTo) {
      dateFilter.range.updatedAt.lte = moment(opts.reportDateTo).valueOf();
    } else {
      dateFilter.range.updatedAt.lte = moment().valueOf();
    }
    delete opts.reportDateFrom;
    delete opts.reportDateTo;
    filterOptions.query.bool.filter.push(dateFilter);

    if (opts.reportInterval && opts.reportInterval !== 'overall') {
      timeAgg.time.date_histogram.interval = opts.reportInterval;
      timeAgg.time.aggs = audienceAgg;

      filterOptions.aggs = timeAgg;
    } else {
      filterOptions.aggs = audienceAgg;
    }
    delete opts.reportInterval;
    delete opts.reportBySession;

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

    if (opts.childFilter && opts.childFilter in childFilters) {
      child.child.terms.field = childFilters[opts.childFilter];
      audienceAgg.audience.aggs = child;
    }
    delete opts.childFilter;

    Object.keys(opts).forEach((key) => {
      if (typeof opts[key] !== 'undefined') {
        filterOptions.query.bool.filter.push({ term: { [key]: opts[key] } });
      }
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
        //       : Campaign.find(
        //         { fields: { id: 1 }, where: { id: opts.campaignId } },
        //         options,
        //       ).then(campaigns => campaigns.map(campaign => campaign.id)),
        //   ]).then(([locationIds, campaignIds]) => {
        //     filterOptions.query.bool.filter.push({
        //       terms: { locationId: locationIds },
        //     });
        //     if (filterOptions.campaignId && filterOptions.campaignId.length) {
        //       filterOptions.query.bool.filter.push({
        //         terms: { campaignId: campaignIds },
        //       });
        //     }
        //     return resolve(filterOptions);
        //   });
        default:
          return reject(false);
      }
    });
  };

  const postProcessChildAgg = reports =>
    reports.map((row) => {
      row.y = row.doc_count;
      row.name = row.key;
      delete row.doc_count;
      delete row.key;
      return row;
    });
  const postProcessAudienceAgg = (reportType, reports) => {
    let result = [];
    const valueKeys = ReportAudience.app.get(`op:${reportType}_category`);

    if (valueKeys) {
      valueKeys.forEach((row) => {
        const idx = lodash.findIndex(reports, r => r.key === row.value);
        if (idx > -1) {
          const report = reports[idx];
          const newReport = { y: report.doc_count, name: row.text };
          if (report.child && report.child.buckets) {
            newReport.detail = postProcessChildAgg(report.child.buckets);
          }
          result.push(newReport);
        } else {
          result.push({ y: 0, name: row.text });
        }
      });
    } else {
      result = reports.map((report) => {
        const newReport = { y: report.doc_count, name: report.key };
        if (report.child && report.child.buckets) {
          newReport.detail = postProcessChildAgg(report.child.buckets);
        }
        return newReport;
      });
    }

    return result;
  };

  ReportAudience.getReportData = (reportType, opts) => {
    const { reportBySession } = opts;

    return getFilterOptions(opts)
      .then((filterOptions) => {
        logger.debug({ data: filterOptions }, 'Filter option');

        const { Device, Tracking } = ReportAudience.app.models;
        const esDeviceConn = Device.getDataSource().connector;
        const esDevice = esDeviceConn.db;
        const searchDevice = Promise.promisify(esDevice.search, {
          context: esDevice,
        });

        const esTrackingConn = Tracking.getDataSource().connector;
        const esTracking = esTrackingConn.db;
        const searchTracking = Promise.promisify(esTracking.search, {
          context: esTracking,
        });

        const searchIndex = reportBySession
          ? esTrackingConn.searchIndex
          : esDeviceConn.searchIndex;
        const searchType = reportBySession
          ? Tracking.modelName
          : Device.modelName;
        const searchQuery = reportBySession ? searchTracking : searchDevice;

        logger.debug({ data: filterOptions }, 'Report filter');
        return searchQuery({
          index: searchIndex,
          type: searchType,
          body: filterOptions,
        }).then((res) => {
          logger.debug({ data: res }, 'Get report data success');
          let audienceBuckets = lodash.get(
            res,
            'aggregations.audience.buckets',
          );
          if (audienceBuckets) {
            if (!Array.isArray(audienceBuckets)) {
              audienceBuckets = Object.keys(audienceBuckets).map(key => ({
                key,
                doc_count: audienceBuckets[key].doc_count,
              }));
            }

            return postProcessAudienceAgg(reportType, audienceBuckets);
          }

          const timeBuckets = lodash.get(res, 'aggregations.time.buckets');
          if (timeBuckets) {
            return timeBuckets.map((b) => {
              let timeAudienceBuckets = b.audience.buckets;
              if (!Array.isArray(timeAudienceBuckets)) {
                timeAudienceBuckets = Object.keys(
                  timeAudienceBuckets,
                ).map(key => ({
                  key,
                  doc_count: timeAudienceBuckets[key].doc_count,
                }));
              }

              b.detail = postProcessAudienceAgg(
                reportType,
                timeAudienceBuckets,
              );
              delete b.audience;
              delete b.doc_count;
              return b;
            });
          }

          return [];
        });
      })
      .catch((err) => {
        logger.error({ err }, 'Get report data failed');
        throw err;
      });
  };
  ReportAudience.getReport = (...args) => {
    const reportType = args[0];

    const opts = getMethodArguments(ReportAudience, 'getReport', true, args);
    return ReportAudience.getReportData(reportType, opts);
  };
  ReportAudience.remoteMethod('getReport', {
    description: 'Return audience report',
    accepts: [
      {
        arg: 'reportType',
        type: 'string',
        description: `Report type: ${ReportAudience.reportTypes.join(', ')}`,
      },
      { arg: 'advertiserId', type: 'string', description: 'Advertiser ID' },
      { arg: 'brandId', type: 'string', description: 'Brand ID' },
      { arg: 'campaignId', type: 'string', description: 'Campaign ID' },
      { arg: 'locationId', type: 'string', description: 'Location ID' },
      { arg: 'bannerId', type: 'string', description: 'Banner ID' },
      { arg: 'reportDateFrom', type: 'date', description: 'Get report from' },
      { arg: 'reportDateTo', type: 'date', description: 'Get report to' },
      {
        arg: 'reportInterval',
        type: 'string',
        description:
          'Interval: year, month, day, hour, minute. For summary: overall',
      },
      {
        arg: 'childFilter',
        type: 'string',
        description: `Show audience per child group, including ${Object.keys(
          childFilters,
        ).join(', ')}`,
      },
      {
        arg: 'reportBySession',
        type: 'boolean',
        description: 'Calculate report based on sessions',
      },
    ],
    http: { verb: 'get', path: '/:reportType' },
    returns: { type: 'array', root: true },
  });
};
