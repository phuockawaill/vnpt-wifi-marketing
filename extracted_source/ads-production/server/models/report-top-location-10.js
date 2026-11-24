const ObjectId = require('mongodb').ObjectId;

module.exports = (ReportTopLocation10) => {
  ReportTopLocation10.defineProperty('locationId', { type: ObjectId });
};
