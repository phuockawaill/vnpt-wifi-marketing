const Promise = require('bluebird');
const moment = require('moment');
const mongo = require('mongodb');
const lodash = require('lodash');

const logger = require('../import/logger')().child({
  module: 'model:ReportLocation',
});

module.exports = (ReportLocation) => {
  ReportLocation.reportTypes = ['city', 'location', 'category'];
  ReportLocation.CITY = 'city';
  ReportLocation.LOCATION = 'location';
  ReportLocation.CATEGORY = 'category';

  const getFilterOptions = (opts) => {
    const { options = {} } = opts;
    const context = options.currentContext;
    delete opts.options;

    const {
      Profile,
      Location,
      ReportTopLocation10,
      ReportTopLocation20,
      ReportTopLocation30,
    } = ReportLocation.app.models;

    let currentProfile = false;
    if (context) {
      currentProfile = context.currentProfileName;
    }

    const filterOptions = { reportDate: moment().startOf('day').toDate() };
    const groupOptions = { _id: null, clickBooked: { $sum: '$clickBooked' } };

    let ReportModel = ReportTopLocation10;

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

    if (opts.brandId) {
      ReportModel = ReportTopLocation30;
    } else if (opts.advertiserId) {
      ReportModel = ReportTopLocation20;
    }

    if (opts.advertiserId) {
      filterOptions.advertiserId = opts.advertiserId;
    }
    if (opts.brandId) {
      filterOptions.brandId = opts.brandId;
    }

    if (opts.reportType === ReportLocation.CITY) {
      Object.assign(groupOptions, {
        _id: { cityId: '$cityId' },
        name: { $first: '$cityName' },
      });
    } else if (opts.reportType === ReportLocation.CATEGORY) {
      Object.assign(groupOptions, {
        _id: { categoryId: '$categoryId' },
        name: { $first: '$categoryName' },
      });
    } else if (opts.reportType === ReportLocation.LOCATION) {
      Object.assign(groupOptions, {
        _id: { locationId: '$locationId' },
        name: { $first: '$locationName' },
      });
    }

    return new Promise((resolve, reject) => {
      switch (currentProfile) {
        case Profile.SUPERADMIN:
        case Profile.ADMIN:
        case Profile.ADVERTISER:
        case Profile.CLIENT:
        case Profile.PUBLISHER:
          return resolve(filterOptions);
        // case Profile.PUBLISHER:
        //   return Location.find({ fields: { id: 1 } }, options)
        //     .then(locations => locations.map(location => location.id))
        //     .then((locationIds) => {
        //       filterOptions.locationId = { $in: locationIds };
        //       return resolve(filterOptions);
        //     });
        default:
          return reject(false);
      }
    }).then(filters => ({
      filterOptions: filters,
      groupOptions,
      model: ReportModel,
    }));
  };

  const getReportData = opts =>
    getFilterOptions(
      opts,
    ).then(({ filterOptions, groupOptions, model: ReportModel }) => {
      const collection = ReportModel.getDataSource().connector.collection(
        ReportModel.modelName,
      );

      return new Promise((resolve, reject) => {
        collection.aggregate(
          [
            { $match: filterOptions },
            { $group: groupOptions },
            { $sort: { clickBooked: -1 } },
            { $limit: 10 },
          ],
          (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          },
        );
      });
    });

  ReportLocation.getReport = (reportType, advertiserId, brandId, options) => {
    if (ReportLocation.reportTypes.indexOf(reportType) === -1) {
      return Promise.reject({ status: 404 });
    }

    const opts = { reportType, options };
    if (advertiserId) {
      opts.advertiserId = mongo.ObjectId(advertiserId);
    }
    if (brandId) {
      opts.brandId = mongo.ObjectId(brandId);
    }

    return getReportData(opts)
      .then(report =>
        lodash.map(report, row => ({ name: row.name, y: row.clickBooked })),
      )
      .catch((err) => {
        logger.error({ err }, 'Get report data failed');
      });
  };
  ReportLocation.remoteMethod('getReport', {
    description: 'Return top location report',
    accepts: [
      {
        arg: 'reportType',
        type: 'string',
        description: `Report type: ${ReportLocation.reportTypes.join(', ')}`,
      },
      { arg: 'advertiserId', type: 'string', description: 'Advertiser ID' },
      { arg: 'brandId', type: 'string', description: 'Brand ID' },
    ],
    http: { verb: 'get', path: '/:reportType' },
    returns: { type: 'array', root: true },
  });

  ReportLocation.getVendorReport = (options) => {
    const { Location } = ReportLocation.app.models;

    return Location.find({ fields: { id: 1 } }, options)
      .then(locations => locations.map(l => l.id))
      .then((locationIds) => {
        const collection = Location.getDataSource().connector.collection(
          Location.modelName,
        );
        const aggregate = Promise.promisify(collection.aggregate, {
          context: collection,
        });

        return aggregate([
          { $match: { _id: { $in: locationIds } } },
          {
            $group: {
              _id: '$ownedBy',
              count: { $sum: 1 },
              name: { $last: '$ownedByUsername' },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ])
          .then((data) => {
            logger.debug({ data }, 'Get vendor report finished');
            return data.map(row => ({ name: row.name, y: row.count }));
          })
          .catch((err) => {
            logger.error({ err }, 'Get vendor report failed');
          });
      });
  };
  ReportLocation.remoteMethod('getVendorReport', {
    description: 'Return vendor report',
    http: { verb: 'get', path: '/vendor' },
    returns: { type: 'array', root: true },
  });

  ReportLocation.SessionReport = (req, res) => {
    console.log('SessionReport', req.body)
  };
  ReportLocation.remoteMethod('SessionReport', {
    accepts: [
      { arg: 'req', type: 'object', http: { source: 'req' } },
      { arg: 'res', type: 'object', http: { source: 'res' } }
    ],
    description: 'POST sessions report',
    http: { verb: 'post', path: '/sessions' }
  });
};
