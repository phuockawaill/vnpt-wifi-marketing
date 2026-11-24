import Promise from 'bluebird';

const app = require('../server/server');

const { UserAds, Device } = app.models;

const conn = Device.getDataSource().connector;
const es = conn.db;
const bulk = Promise.promisify(es.bulk, { context: es });

let offset = 1496000;
let bulkBody = [];

function doImport(limit = 100000, bulkLimit = 3000) {
  const bulkTimes = [];

  return UserAds
    .find({ limit, offset })
    .then(data => data.map(row => row.toJSON()))
    .then((data) => {
      let totalData = data.length;
      while (totalData > 0) {
        bulkTimes.push(bulkTimes.length);
        totalData -= bulkLimit;
      }

      bulkBody = [];
      data.forEach((row) => {
        bulkBody.push({ update: { _id: Device.toId(row.mac) } });
        bulkBody.push({ doc: row, doc_as_upsert: true });
      });

      offset += data.length;
      return Promise
        .map(bulkTimes, (time) => {
          if (bulkBody.length) {
            return bulk({
              body: bulkBody.splice(0, bulkLimit),
              index: conn.searchIndex,
              type: Device.modelName })
              .then(() => {
                console.log('%d - %d', bulkLimit * time, bulkLimit * (time + 1));
              });
          }
        }, { concurrency: 1 })
        .then(() => {
          console.log('Imported %d rows, total %d', data.length, offset);
          return data.length >= limit ? doImport(limit, bulkLimit) : true;
        });
    })
    .catch((err) => {
      console.error('Error at offset', offset);
      console.error(err);
    });
}

setTimeout(() => {
  doImport(100000, 3000)
    .then(() => {
      console.log('Done');
    });
}, 1000);
