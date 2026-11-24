const { ObjectId } = require('mongodb').ObjectID;
module.exports = (Transaction) => {
    Transaction.defineProperty('user', { type: ObjectId, require: true });
    Transaction.defineProperty('destUser', { type: ObjectId });
    Transaction.defineProperty('keyId', { type: ObjectId, require: true });
};
