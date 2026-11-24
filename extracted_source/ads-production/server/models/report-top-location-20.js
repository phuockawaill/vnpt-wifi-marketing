const ObjectId = require('mongodb').ObjectId;

module.exports = (ReportTopLocation20) => {
  ReportTopLocation20.defineProperty('advertiserId', { type: ObjectId });
  ReportTopLocation20.defineProperty('locationId', { type: ObjectId });
};
