const { ObjectId } = require('mongodb').ObjectID;
module.exports = (FormGenerate) => {
    FormGenerate.defineProperty('createdBy', { type: ObjectId, require: true });
};
