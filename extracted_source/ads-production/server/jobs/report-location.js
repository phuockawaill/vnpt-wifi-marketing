const moment = require('moment');
const lodash = require('lodash');
const Promise = require('bluebird');

const logger = require('../import/logger')().child({
  module: 'job:report-location',
});

const run = (app) => {
  const models = app.models;

  const calculateReport = (campaign, result) => {
    if (campaign.locations && Array.isArray(campaign.locations)) {
      campaign.locations.forEach((location) => {
        const kpi = location.kpiPerDay || 1;

        if (!(location.locationId in result.locations)) {
          result.locations[location.locationId] = {
            locationName: location.locationName,
            clickBooked: 0,
            cityId: location.cityId,
            cityName: location.cityName,
            categoryId: location.categoryId,
            categoryName: location.categoryName,
          };
        }
        result.locations[location.locationId].clickBooked += kpi;

        if (campaign.ownedBy) {
          const advertiserId = campaign.ownedBy.toString();
          if (!(advertiserId in result.advertisers)) {
            result.advertisers[advertiserId] = {
              locations: {},
              clickBooked: 0,
            };
          }
          result.advertisers[advertiserId].clickBooked += kpi;

          const adReport = result.advertisers[advertiserId];
          if (!(location.locationId in adReport.locations)) {
            adReport.locations[location.locationId] = {
              advertiserName: campaign.ownedByUsername,
              locationName: location.locationName,
              clickBooked: 0,
              cityId: location.cityId,
              cityName: location.cityName,
              categoryId: location.categoryId,
              categoryName: location.categoryName,
            };
          }
          adReport.locations[location.locationId].clickBooked += kpi;
        }

        if (campaign.brandId) {
          const brandId = campaign.brandId.toString();
          if (!(brandId in result.brands)) {
            result.brands[brandId] = { locations: {}, clickBooked: 0 };
          }
          result.brands[brandId].clickBooked += kpi;

          const adReport = result.brands[brandId];
          if (!(location.locationId in adReport.locations)) {
            adReport.locations[location.locationId] = {
              brandName: campaign.brandName,
              locationName: location.locationName,
              clickBooked: 0,
              cityId: location.cityId,
              cityName: location.cityName,
              categoryId: location.categoryId,
              categoryName: location.categoryName,
            };
          }
          adReport.locations[location.locationId].clickBooked += kpi;
        }
      });
    }
    return true;
  };

  const processTopBefore = (beforeDate, offset = 0, result) => {
    if (!beforeDate) {
      beforeDate = moment();
    }
    return models.Campaign
      .find(
      {
        where: { createdAt: { lte: beforeDate } },
        order: 'createdAt ASC',
        limit: 50,
        offset,
      },
        { skipCheckResource: true },
      )
      .then((campaigns) => {
        campaigns.forEach(campaign => calculateReport(campaign, result));
        return campaigns.length;
      })
      .then((length) => {
        if (length) {
          return processTopBefore(beforeDate, offset + 50, result);
        }
        return result;
      });
  };

  const saveDetailReport = (Model, filterOption, reportData) =>
    Promise.each(Object.keys(reportData), (dataId) => {
      const data = reportData[dataId];
      const key = lodash.cloneDeep(filterOption);
      key.locationId = dataId;
      key.cityId = data.cityId;
      key.categoryId = data.categoryId;
      return Model.destroyAll(key).then(() =>
        Model.create(lodash.extend(key, data)),
      );
    });

  const saveReport = (report) => {
    const {
      ReportTopLocation10,
      ReportTopLocation20,
      ReportTopLocation30,
    } = app.models;
    const toDay = moment().startOf('day');
    const lv1Key = { reportDate: toDay };

    return Promise.reduce(
      [
        saveDetailReport(ReportTopLocation10, lv1Key, report.locations),

        Promise.map(Object.keys(report.advertisers), (advertiserId) => {
          const data = report.advertisers[advertiserId];
          const lv2Key = { reportDate: toDay, advertiserId };

          return Promise.reduce(
            [saveDetailReport(ReportTopLocation20, lv2Key, data.locations)],
            (result, detailReport) => {
              result.push(detailReport);
              return result;
            },
            [],
          );
        }),

        Promise.map(Object.keys(report.brands), (brandId) => {
          const data = report.brands[brandId];
          const lv2Key = { reportDate: toDay, brandId };

          return Promise.reduce(
            [saveDetailReport(ReportTopLocation30, lv2Key, data.locations)],
            (result, detailReport) => {
              result.push(detailReport);
              return result;
            },
            [],
          );
        }),
      ],
      (_, finalReport) => finalReport,
      0,
    );
  };

  return (job, cb) => {
    logger.info('Run report location job');

    const result = { locations: {}, advertisers: {}, brands: {} };
    return processTopBefore(moment(), 0, result)
      .then(() => {
        logger.debug({ data: result }, 'Report data');
        return saveReport(result);
      })
      .then(() => {
        logger.info('Run report location job finished');
        cb();
      })
      .catch((err) => {
        logger.error({ err }, 'Run report location job failed');
        cb(err);
      });
  };
};

module.exports = run;

if (
  require.main === module ||
  require.main.filename.indexOf('boot.babel') > 0
) {
  const app = require('../server'); // eslint-disable-line global-require
  run(app)(null, () => process.exit(0));
}
