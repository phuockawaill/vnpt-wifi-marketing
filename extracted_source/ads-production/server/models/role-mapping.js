const mongo = require('mongodb');

module.exports = (RoleMapping) => {
  RoleMapping.defineProperty('principalId', { type: id => (id ? mongo.ObjectId(id.toString()) : id) });
};
