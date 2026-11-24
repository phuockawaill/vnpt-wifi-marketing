const getMethodArguments = require('../import/utils').getMethodArguments;

const moment = require('moment');
const lodash = require('lodash');
const Promise = require('bluebird');

const logger = require('../import/logger')().child({
  module: 'model:ReportTracking',
});

module.exports = (ReportTracking) => {
  const childFilters = {
    device: 'device',
    os: 'os',
    advertiser: 'advertiserId',
    campaign: 'campaignId',
    brand: 'brandId',
    location: 'locationId',
    banner: 'bannerId',
    campaignCategory: 'campaignCategoryId',
    locationCategory: 'locationCategoryId',
    city: 'cityId',
  };
  const getFilterOptions = (opts) => {
    const options = opts.options || {};
    const context = options.currentContext;
    delete opts.options;

    const { Profile, Location, Campaign, Tracking } = ReportTracking.app.models;

    let currentProfile = false;
    if (context) {
      currentProfile = context.currentProfileName;
    } else {
      currentProfile = Profile.SYSTEM;
    }

    const count = { count: { sum: { field: 'count', missing: 1 } } };
    const child = {
      terms: { field: null },
      aggs: lodash.cloneDeep(count),
    };
    const filterAgg = {
      action: {
        filters: {
          filters: {
            [Tracking.CLICK]: { term: { actionType: Tracking.CLICK } },
            [Tracking.IMPRESSION]: {
              term: { actionType: Tracking.IMPRESSION },
            },
          },
        },
        aggs: lodash.cloneDeep(count),
      },
    };
    const filterAction = {
      action: {
        nested: { path: 'actions' },
        aggs: { action: { terms: { field: 'actions.action' } } },
      }
    };
    const timeAgg = {
      time: {
        date_histogram: {
          field: 'createdAt',
          interval: 'month',
          time_zone: 'Asia/Jakarta',
        },
        aggs: filterAgg,
      },
    };
    const filterOptions = {
      query: {
        bool: {
          filter: [],
          must_not: [{ term: { ua: 'LuaSocket 3.0-rc1' } }],
        },
      },
      size: 0,
    };

    const dateFilter = { range: { createdAt: { format: 'epoch_millis' } } };
    if (opts.reportDateFrom) {
      dateFilter.range.createdAt.gte = moment(opts.reportDateFrom)
        .startOf('day')
        .valueOf();
    } else {
      dateFilter.range.createdAt.gte = moment('2015-01-01').valueOf();
    }
    if (opts.reportDateTo) {
      dateFilter.range.createdAt.lte = moment(opts.reportDateTo)
        .endOf('day')
        .valueOf();
    } else {
      dateFilter.range.createdAt.lte = moment().valueOf();
    }
    delete opts.reportDateFrom;
    delete opts.reportDateTo;
    filterOptions.query.bool.filter.push(dateFilter);

    if (opts.reportInterval && opts.reportInterval !== 'overall') {
      timeAgg.time.date_histogram.interval = opts.reportInterval;
      filterOptions.aggs = timeAgg;
    } else {
      filterOptions.aggs = filterAction;
    }
    delete opts.reportInterval;

    if (opts.childFilter && opts.childFilter in childFilters) {
      child.terms.field = childFilters[opts.childFilter];
      filterAgg.action.aggs.child = child;
    }
    delete opts.childFilter;

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

    Object.keys(opts).forEach((key) => {
      if (!lodash.isNil(opts[key])) {
        filterOptions.query.bool.filter.push({ term: { ['meta.' + key]: opts[key] } });
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
        //       : Campaign.find({ fields: { id: 1 } }, options).then(campaigns =>
        //         campaigns.map(campaign => campaign.id),
        //       ),
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
      row.count = lodash.get(row, 'count.value', row.doc_count);
      delete row.doc_count;
      return row;
    });
  const postProcessActionAgg = ({
    click: reportClick,
    impression: reportImpression,
  }) => {
    const { Tracking } = ReportTracking.app.models;

    const result = {
      [Tracking.CLICK]: reportClick.count.value,
      [Tracking.IMPRESSION]: reportImpression.count.value,
    };

    if (reportClick.child && reportClick.child.buckets) {
      result[`${[Tracking.CLICK]}Detail`] = postProcessChildAgg(
        reportClick.child.buckets,
      );
    }
    if (reportImpression.child && reportImpression.child.buckets) {
      result[`${[Tracking.IMPRESSION]}Detail`] = postProcessChildAgg(
        reportImpression.child.buckets,
      );
    }

    return result;
  };

  ReportTracking.getReportData = (opts) => {
    const { Tracking } = ReportTracking.app.models;

    return getFilterOptions(opts)
      .then((filterOptions) => {
        logger.debug({ data: filterOptions }, 'Filter option');

        const esTrackingConn = Tracking.getDataSource().connector;
        const esTrackingDB = esTrackingConn.db;
        const search = Promise.promisify(esTrackingDB.search, {
          context: esTrackingDB,
        });
        return search({
          index: esTrackingConn.searchIndex,
          type: Tracking.modelName,
          body: filterOptions,
        }).then((res) => {
          logger.debug({ data: res }, 'Get report data success');
          if (
            res.aggregations &&
            res.aggregations.time &&
            res.aggregations.time.buckets
          ) {
            return res.aggregations.time.buckets.map((b) => {
              b = lodash.extend(b, postProcessActionAgg(b.action.buckets));
              delete b.action;
              delete b.doc_count;
              return b;
            });
          } else if (
            res.aggregations &&
            res.aggregations.action &&
            res.aggregations.action.buckets
          ) {
            return [postProcessActionAgg(res.aggregations.action.action.buckets)];
          } else if (
            res.aggregations &&
            res.aggregations.action &&
            res.aggregations.action.action &&
            res.aggregations.action.action.buckets
          ) {
            let result = {};
            res.aggregations.action.action.buckets.forEach((item) => {
              result[item.key] = item.doc_count;
            });
            return [result];
          }
          return [];
        });
      })
      .catch((err) => {
        logger.error({ err }, 'Get report data failed');
        throw err;
      });
  };

  ReportTracking.getReport = (...args) => {
    const opts = getMethodArguments(ReportTracking, 'getReport', true, args);
    logger.debug({ data: opts }, 'Raw filter options');
    return ReportTracking.getReportData(opts).catch(() =>
      Promise.reject({ statusCode: 500 }),
    );
  };

  ReportTracking.remoteMethod('getReport', {
    description: 'Return tracking report',
    accepts: [
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
        description: `Show Click/Impression per child group, eg: ${Object.keys(
          childFilters,
        ).join(', ')}`,
      },
    ],
    http: { verb: 'get', path: '/' },
    returns: { type: 'array', root: true },
  });
};
