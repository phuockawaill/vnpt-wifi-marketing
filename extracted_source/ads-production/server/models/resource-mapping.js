const ObjectId = require('mongodb').ObjectId;

module.exports = (ResourceMapping) => {
  ResourceMapping.defineProperty('resourceId', { type: ObjectId });

  // Static fields
  const resourceTypes = ['CAMPAIGN', 'LOCATION', 'BANNER', 'BRAND', 'USER'];
  resourceTypes.forEach((type) => {
    ResourceMapping[type] = type;
  });
  const resourceScope = ['OWNER', 'RELATION'];
  resourceScope.forEach((scope) => {
    ResourceMapping[scope] = scope;
  });

  ResourceMapping.getResources = resourceCtx => ResourceMapping
    .find({ where: resourceCtx, fields: { resourceId: 1 } })
    .then(resourceMaps => resourceMaps.map(item => item.resourceId));
};
