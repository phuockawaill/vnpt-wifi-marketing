const Promise = require('bluebird');
const lodash = require('lodash');

const { ObjectId } = require('mongodb').ObjectID;
const debug = require('debug')('app:module:Campaign');
const error = require('debug')('err:module:Campaign');

module.exports = (Campaign) => {
  Campaign.defineProperty('brandId', { type: ObjectId, require: true });
  Campaign.defineProperty('brands', { type: [ObjectId], require: true });
  Campaign.defineProperty('createdBy', { type: ObjectId, require: true });
  // Campaign.defineProperty('publisherIds', { type: [ObjectId] });
  Campaign.defineProperty('bannerDefaultId', { type: ObjectId });

  Campaign.CREATED = 'created';
  Campaign.APPROVED = 'approved';
  Campaign.DISAPPROVED = 'disapproved';
  Campaign.SCHEDULED = 'scheduled';
  Campaign.RUNNING = 'running';
  Campaign.STOPPED = 'stopped';
  Campaign.FINISHED = 'finished';
  Campaign.statuses = [
    Campaign.CREATED,
    Campaign.APPROVED,
    Campaign.DISAPPROVED,
    Campaign.SCHEDULED,
    Campaign.RUNNING,
    Campaign.STOPPED,
    Campaign.FINISHED,
  ];

  const deleteCampaignMapping = (oldCampaign, newCampaign, locations) => {
    const { CampaignMapping } = Campaign.app.models;
    return CampaignMapping.destroyAll({
      campaignId: oldCampaign.id,
      locationId: { inq: locations.map(l => l.locationId) },
    }).catch((err) => {
      error('%s: delete campaign mapping failed', oldCampaign.name);
      error(err);
      return Promise.resolve(false);
    });
  };
  const upsertCampaignMapping = (oldCampaign, newCampaign, locations) => {
    const { CampaignMapping } = Campaign.app.models;
    return Promise.map(
      locations,
      location =>
        CampaignMapping.findOrCreate(
          {
            where: {
              locationId: location.locationId,
              campaignId: newCampaign.id,
            },
          },
          {
            locationId: location.locationId,
            locationName: location.locationName,
            campaignId: newCampaign.id,
            campaignName: newCampaign.name || oldCampaign.name,
            priority: new Date().getTime(),
            kpi: location.kpi,
            kpiPerDay: location.kpiPerDay,
            impressionRedirectUrl: location.impressionRedirectUrl,
            redirectUrl: location.redirectUrl,
          },
        )
          .then(([cm, created]) => {
            if (!created) {
              cm.kpi = location.kpi;
              cm.kpiPerDay = location.kpiPerDay;

              return cm.save();
            }
            return cm;
          })
          .catch((err) => {
            error('%s: upsert campaign mapping failed', oldCampaign.name);
            error(err);
            return Promise.resolve(false);
          }),
      { concurrency: 1 },
    );
  };

  const handleCampaignMapping = (oldCampaign, newCampaign) => {
    const comparator = (l1, l2) =>
      l1.locationId.toString() === l2.locationId.toString();

    const unTouchLocations = lodash.intersectionWith(
      newCampaign.locations,
      oldCampaign.locations,
      comparator,
    );
    const deletedLocations = lodash.differenceWith(
      oldCampaign.locations,
      unTouchLocations,
      comparator,
    );
    const createdLocations = lodash.differenceWith(
      newCampaign.locations,
      unTouchLocations,
      comparator,
    );

    const allPromises = [];
    if (deletedLocations.length) {
      debug(
        '%s: delete campaign mapping %o',
        oldCampaign.name,
        deletedLocations,
      );
      allPromises.push(
        deleteCampaignMapping(oldCampaign, newCampaign, deletedLocations),
      );
    }
    if (createdLocations.length) {
      debug(
        '%s: create campaign mapping %o',
        oldCampaign.name,
        createdLocations,
      );
      allPromises.push(
        upsertCampaignMapping(oldCampaign, newCampaign, createdLocations),
      );
    }
    if (unTouchLocations.length) {
      debug(
        '%s: update campaign mapping %o',
        oldCampaign.name,
        unTouchLocations,
      );
      allPromises.push(
        upsertCampaignMapping(oldCampaign, newCampaign, unTouchLocations),
      );
    }

    return Promise.all(allPromises).catch((err) => {
      error('%s: handle campaign mapping failed', oldCampaign.name);
      error(err);
    });
  };

  Campaign.observe('before save', (ctx, next) => {
    if (ctx.instance && !ctx.isNewInstance) {
      debug('%s: handle campaign mapping', ctx.instance.name);
      Campaign.findById(ctx.instance.id)
        .then(oldCampaign => handleCampaignMapping(oldCampaign, ctx.instance))
        .then(() => next())
        .catch((err) => {
          error('%s: get campaign failed', ctx.instance.name);
          error(err);
          next(err);
        });
    } else if (ctx.isNewInstance) {
      debug('%s: trigger before create', ctx.instance.name);
      ctx.instance.status = Campaign.SCHEDULED;
      next();
    } else {
      next();
    }
  });
  Campaign.observe('after save', (ctx, next) => {
    if (ctx.instance && ctx.isNewInstance) {
      debug('%s: handle campaign mapping', ctx.instance.name);
      handleCampaignMapping(
        { locations: [], name: ctx.instance.name },
        ctx.instance,
      ).then(() => next());
    } else {
      next();
    }
  });
  Campaign.observe('before delete', (ctx, next) => {
      let CampaignMapping = Campaign.app.models.CampaignMapping,
      Location = Campaign.app.models.Location;
      let chain = Promise.resolve();
      chain = chain.then(() => CampaignMapping.find({ where: { campaignId: ctx.where.id } }));
      chain
        .then(maps => Promise.each(maps, (map) => {
          return Location.findById(map.locationId).then((location) => {
              if(location) {
                  let saveCampaigns = lodash.reject(location.activeCampaigns, { campaignId: ctx.where.id });
                  return location.updateAttributes({ activeCampaigns: saveCampaigns });
              }
          });
      })
      .then(() => CampaignMapping.destroyAll({ campaignId: ctx.where.id })))
      .then(() => next())
      .catch((err) => console.log(err));
    // .catch((err) => {
    //     error('%s: delete campaign mapping failed, campaign', ctx.where.id);
    //     error(err);
    // });
    // next();
  });
  Campaign.approve = campaignId =>
    Campaign.findById(campaignId).then((campaign) => {
      if (!campaign) {
        throw new Error('Campaign not exists');
      }
      if (
        campaign.status !== Campaign.CREATED &&
        campaign.status !== Campaign.DISAPPROVED
      ) {
        throw new Error(`Cannot approve ${campaign.status} campaign`);
      }
      return campaign
        .updateAttribute('status', Campaign.APPROVED)
        .then(savedCampaign => savedCampaign.status);
    });
  Campaign.remoteMethod('approve', {
    description: 'Approve Campaign',
    accepts: [{ arg: 'id', type: 'string', description: 'Campaign ID' }],
    http: { path: '/:id/approve' },
    returns: [{ arg: 'status', type: 'string' }],
  });

  Campaign.disapprove = campaignId =>
    Campaign.findById(campaignId).then((campaign) => {
      if (!campaign) {
        throw new Error('Campaign not exists');
      }
      if (campaign.status !== Campaign.CREATED) {
        throw new Error(`Cannot disapprove ${campaign.status} campaign`);
      }
      return campaign
        .updateAttribute('status', Campaign.DISAPPROVED)
        .then(savedCampaign => savedCampaign.status);
    });
  Campaign.remoteMethod('disapprove', {
    description: 'Disapprove Campaign',
    accepts: [{ arg: 'id', type: 'string', description: 'Campaign ID' }],
    http: { path: '/:id/disapprove' },
    returns: [{ arg: 'status', type: 'string' }],
  });

  Campaign.enable = campaignId =>
    Campaign.findById(campaignId).then((campaign) => {
      if (!campaign) {
        throw new Error('Campaign not exists');
      }
      if (campaign.status !== Campaign.STOPPED) {
        throw new Error(`Cannot enable ${campaign.status} campaign`);
      }
      return campaign.updateAttribute('status', Campaign.SCHEDULED);
    });
  Campaign.remoteMethod('enable', {
    description: 'Enable Campaign',
    accepts: [{ arg: 'id', type: 'string', description: 'Campaign ID' }],
    http: { path: '/:id/enable' },
    returns: [{ arg: 'campaign', type: Campaign.modelName, root: true }],
  });

  Campaign.disable = campaignId =>
    Campaign.findById(campaignId).then((campaign) => {
      if (!campaign) {
        throw new Error('Campaign not exists');
      }
      if (
        [Campaign.APPROVED, Campaign.SCHEDULED, Campaign.RUNNING].indexOf(
          campaign.status,
        ) < 0
      ) {
        throw new Error(`Cannot disable ${campaign.status} campaign`);
      }
      return campaign.updateAttribute('status', Campaign.STOPPED);
    });
  Campaign.remoteMethod('disable', {
    description: 'Enable Campaign',
    accepts: [{ arg: 'id', type: 'string', description: 'Campaign ID' }],
    http: { path: '/:id/disable' },
    returns: [{ arg: 'campaign', type: Campaign.modelName, root: true }],
  });
};
