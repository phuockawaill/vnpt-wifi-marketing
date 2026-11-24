const ObjectId = require('mongodb').ObjectId;
// const Promise = require('bluebird');
// const logger = require('../import/logger')().child({
//   module: 'model:CampaignMapping',
// });

module.exports = (CampaignMapping) => {
  CampaignMapping.defineProperty('campaignId', {
    type: ObjectId,
    required: true,
  });
  CampaignMapping.defineProperty('locationId', {
    type: ObjectId,
    required: true,
  });

  // Update mapping Location-Campaign
  // CampaignMapping.observe('after save', (ctx, next) => {
  //   if (ctx.instance && ctx.isNewInstance) {
  //     logger.debug(
  //       { data: ctx.instance },
  //       'Trigger CampaignMapping after save',
  //     );
  //     const {
  //       ResourceMapping,
  //       Campaign,
  //       Location,
  //       Profile,
  //     } = CampaignMapping.app.models;
  //     Promise.all([
  //       Location.findById(
  //         ctx.instance.locationId,
  //         { fields: { id: 1, ownedBy: 1 } },
  //         { skipCheckResource: true },
  //       ),
  //       Campaign.findById(
  //         ctx.instance.campaignId,
  //         { fields: { id: 1, ownedBy: 1 } },
  //         { skipCheckResource: true },
  //       ),
  //     ])
  //       .then(([location, campaign]) => {
  //         const resourceMappings = [];
  //         if (location.ownedBy) {
  //           const owner = location.owner();
  //           if (owner.profileName !== Profile.ADMIN) {
  //             resourceMappings.push(
  //               ResourceMapping.findOrCreate(
  //                 {
  //                   where: {
  //                     resourceType: ResourceMapping.CAMPAIGN,
  //                     resourceId: campaign.id,
  //                     resourceGroupId: owner.resourceGroupId,
  //                   },
  //                 },
  //                 {
  //                   resourceType: ResourceMapping.CAMPAIGN,
  //                   resourceId: campaign.id,
  //                   scope: ResourceMapping.RELATION,
  //                   resourceGroupId: owner.resourceGroupId,
  //                   options: { campaignMappingId: ctx.instance.id },
  //                 },
  //               ),
  //             );
  //           }
  //         }
  //         if (campaign.ownedBy) {
  //           const owner = campaign.owner();
  //           if (owner.profileName !== Profile.ADMIN) {
  //             resourceMappings.push(
  //               ResourceMapping.findOrCreate(
  //                 {
  //                   where: {
  //                     resourceType: ResourceMapping.LOCATION,
  //                     resourceId: location.id,
  //                     resourceGroupId: owner.resourceGroupId,
  //                   },
  //                 },
  //                 {
  //                   resourceType: ResourceMapping.LOCATION,
  //                   resourceId: location.id,
  //                   scope: ResourceMapping.RELATION,
  //                   resourceGroupId: owner.resourceGroupId,
  //                   options: { campaignMappingId: ctx.instance.id },
  //                 },
  //               ),
  //             );
  //           }
  //         }

  //         if (!resourceMappings) {
  //           logger.debug('No ResourceMapping need to create/update');
  //           return next();
  //         }

  //         return Promise.all(resourceMappings).then((result) => {
  //           logger.debug({ data: result }, 'ResourceMapping created/updated');
  //           next();
  //         });
  //       })
  //       .catch((err) => {
  //         logger.error({ err }, 'ResourceMapping create/update failed');
  //         next();
  //       });
  //   } else {
  //     next();
  //   }
  // });

  // Remove mapping Location-Campaign
  // CampaignMapping.observe('before delete', (ctx, next) => {
  //   logger.debug({ data: ctx.where }, 'Trigger CampaignMapping before delete');

  //   const { ResourceMapping } = CampaignMapping.app.models;
  //   CampaignMapping.find({ where: ctx.where })
  //     .then(mappings => mappings.map(m => m.id))
  //     .then((mappingIds) => {
  //       logger.debug(
  //         { data: mappingIds },
  //         'Delete ResourceMapping with CampaignMappingID list',
  //       );

  //       return ResourceMapping.destroyAll({
  //         'options.campaignMappingId': { inq: mappingIds },
  //       }).catch((err) => {
  //         logger.error({ err }, 'ResourceMapping delete failed');
  //         throw err;
  //       });
  //     })
  //     .then((result) => {
  //       logger.debug({ data: result }, 'ResourceMapping deleted');
  //       next();
  //     })
  //     .catch((err) => {
  //       logger.error({ err }, 'CampaignMapping before delete failed');
  //       next(err);
  //     });
  // });
};
