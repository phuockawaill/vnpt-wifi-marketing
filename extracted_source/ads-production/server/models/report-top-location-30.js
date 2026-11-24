const ObjectId = require('mongodb').ObjectId;

module.exports = (ReportTopLocation30) => {
  ReportTopLocation30.defineProperty('brandId', { type: ObjectId });
  ReportTopLocation30.defineProperty('locationId', { type: ObjectId });
};
