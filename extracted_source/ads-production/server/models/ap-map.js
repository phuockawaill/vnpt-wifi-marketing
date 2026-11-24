const { ObjectId } = require('mongodb').ObjectID;
module.exports = (APMap) => {
    APMap.defineProperty('createdBy', { type: ObjectId, require: true });
    APMap.defineProperty('locationId', { type: ObjectId, require: true });
    APMap.defineProperty('keyId', { type: ObjectId, require: true });
};
