const moment = require('moment');
const lodash = require('lodash');
const Promise = require('bluebird');

const debug = require('debug')('app:job:observe-campaign');
const error = require('debug')('err:job:observe-campaign');

const run = (app) => {
  const RUNNABLE_NOW = 'runnable_now';
  const RUNNABLE = 'runnable';
  const NOT_RUNNABLE = 'not_runnable';
  const FINISHED = 'finished';

  const {
    Campaign,
    CampaignCached,
    Location,
    LocationCached,
    CampaignMapping,
    ReportTracking,
    Tracking
  } = app.models;

  const RUNNABLE_STATUSES = [
    Campaign.APPROVED,
    Campaign.SCHEDULED,
    Campaign.RUNNING,
  ];

  const getCampaignActualStatus = (campaign) => {
    let result = RUNNABLE_NOW;
    const now = moment();

    if (campaign.status === Campaign.STOPPED) {
      return Promise.resolve(NOT_RUNNABLE);
    } else if (moment(campaign.scheduleTo).isBefore(now)) {
      return Promise.resolve(FINISHED);
    } else if (moment(campaign.scheduleFrom).isAfter(now)) {
      return Promise.resolve(RUNNABLE);
    }

    const daysOfWeek = (campaign.daysOfWeek || [])
      .indexOf(now.isoWeekday().toString());
    if (campaign.daysOfWeek && campaign.daysOfWeek.length && daysOfWeek < 0) {
      return Promise.resolve(RUNNABLE);
    }

    const startTime = campaign.startTimeOfDay || 0;
    const endTime = campaign.endTimeOfDay || 23;
    const timeNow = parseInt(now.format('HH'), 10);

    debug(
      '%s: start %d stop %d now %d',
      campaign.name,
      startTime,
      endTime,
      timeNow,
    );
    if (startTime > timeNow || endTime < timeNow) {
      return Promise.resolve(RUNNABLE);
    }

    return Promise.all([
      ReportTracking.getReport(undefined, undefined, campaign.id),
      campaign.kpiPerDay &&
        ReportTracking.getReport(
          undefined,
          undefined,
          campaign.id,
          undefined,
          undefined,
          now.startOf('day').toISOString(),
        ),
    ])
      .then(([total, today]) => {
        total = total && total[0];
        today = today && today[0];

        if (total) {
          campaign.click = total.click;
          campaign.impression = total.impression;
          campaign.ctr = `${((total.click || 0) /
            ((total.impression || 1) * 0.01)).toFixed(2)}%`;
          campaign.kpiCompleted = campaign.kpi
            ? `${((total.click || 0) / (campaign.kpi * 0.01)).toFixed(2)}%`
            : 'Unlimited';
        }
        if (today) {
          campaign.clickToday = today.click;
          campaign.impressionToday = today.impression;
          campaign.ctrToDay = `${((today.click || 0) /
            ((today.impression || 1) * 0.01)).toFixed(2)}%`;
          campaign.kpiCompletedToDay = campaign.kpiPerDay
            ? `${((today.click || 0) / (campaign.kpiPerDay * 0.01)).toFixed(
                2,
              )}%`
            : 'Unlimited';
        }

        if (
          total &&
          total.click &&
          campaign.kpi &&
          total.click > campaign.kpi
        ) {
          result = NOT_RUNNABLE;
        }
        if (
          today &&
          today.click &&
          campaign.kpiPerDay &&
          today.click > campaign.kpiPerDay
        ) {
          result = NOT_RUNNABLE;
        }
      })
      .then(() => result);
  };
  const getCampaignNewStatus = (campaign, actualStatus) => {
    debug('%s: actual status %s', campaign.name, actualStatus);
    let newStatus;
    let newState;

    switch (actualStatus) {
      case RUNNABLE_NOW:
        if (RUNNABLE_STATUSES.indexOf(campaign.status) > -1) {
          newStatus = Campaign.RUNNING;
          newState = true;
        } else {
          newState = false;
        }
        break;
      case RUNNABLE:
        if (RUNNABLE_STATUSES.indexOf(campaign.status) > -1) {
          newStatus = Campaign.SCHEDULED;
        }
        newState = false;
        break;
      case NOT_RUNNABLE:
        newStatus = Campaign.STOPPED;
        newState = false;
        break;
      case FINISHED:
        if (RUNNABLE_STATUSES.indexOf(campaign.status) > -1) {
          newStatus = Campaign.FINISHED;
        }
        newState = false;
        break;
      default:
        newState = false;
        newStatus = false;
    }

    return { status: newStatus, state: newState };
  };

  const updateCampaignCache = (updatedCampaign) => {
    if (updatedCampaign.active) {
      debug('%s: update cache', updatedCampaign.name);
      return CampaignCached.upsert(updatedCampaign.toJSON());
    }
    debug('%s: delete cache', updatedCampaign.name);
    const {
      _adapter: Adapter,
    } = CampaignCached.getDataSource().connector.client;
    const destroyById = Promise.promisify(Adapter.destroy, {
      context: Adapter,
    });

    return destroyById(CampaignCached.modelName, updatedCampaign.id.toString());
  };

  const processCampaignStatus = (campaign) => {
    debug('%s: process', campaign.name);

    return getCampaignActualStatus(campaign)
      .then(actualStatus => getCampaignNewStatus(campaign, actualStatus))
      .then(({ status, state }) => {
        const saveData = {
          click: campaign.click,
          impression: campaign.impression,
          ctr: campaign.ctr,
          kpiCompleted: campaign.kpiCompleted,
        };
        if (campaign.status !== status) {
          saveData.status = status;
          debug('%s: status %s => %s', campaign.name, campaign.status, status);
        }
        if (campaign.active !== state) {
          saveData.active = state;
          debug('%s: active %s => %s', campaign.name, campaign.active, state);
        }

        return campaign.updateAttributes(saveData, { skipCheckResource: true });
      })
      .then(updateCampaignCache);
  };
  const updateLocationRealActiveCampaigns = (location) => {
    if (!location.id) {
      return null;
    }
    return CampaignMapping.find({
      where: { locationId: location.id },
      fields: { campaignId: 1, priority: 1 },
    })
      .then(campaigns =>
        Promise.all([
          campaigns,
          CampaignCached.find({
            where: { id: { inq: campaigns.map(i => i.campaignId.toString()) } },
          }),
        ]),
      )
      .then(
        ([campaignMappings, activeCampaigns]) =>
          Promise.map(activeCampaigns.filter(i => i.id), (campaign) => {
            const [locationInfo] = lodash
              .get(campaign, 'locations', [])
              .filter(i => i.locationId.toString() === location.id.toString());

            const [mappingInfo] = campaignMappings.filter(
              i => i.campaignId.toString() === campaign.id.toString(),
            );
            const activeCampaign = {
              campaignId: campaign.id,
              campaignName: campaign.name,
              audience: campaign.audience,
              kpi: locationInfo.kpi,
              kpiPerDay: locationInfo.kpiPerDay,
              priority: lodash.get(mappingInfo, 'priority')
            };

            const now = moment();
            return Promise.all([
              ReportTracking.getReport(
                undefined,
                undefined,
                campaign.id,
                location.id,
              ),
              ReportTracking.getReport(
                undefined,
                undefined,
                campaign.id,
                location.id,
                undefined,
                now.startOf('day'),
                now.endOf('day'),
              ),
            ])
              .then(([total, today]) => {
                total = total && total[0];
                today = today && today[0];

                if (total) {
                  activeCampaign.click = total.click;
                  activeCampaign.impression = total.impression;
                  activeCampaign.ctr = `${((total.click || 0) /
                    ((total.impression || 1) * 0.01)).toFixed(2)}%`;
                  activeCampaign.kpiCompleted = activeCampaign.kpi
                    ? `${((total.click || 0) /
                        (activeCampaign.kpi * 0.01)).toFixed(2)}%`
                    : 'Unlimited';
                }
                if (today) {
                  activeCampaign.clickToday = today.click;
                  activeCampaign.impressionToday = today.impression;
                  activeCampaign.ctrToDay = `${((today.click || 0) /
                    ((today.impression || 1) * 0.01)).toFixed(2)}%`;
                  activeCampaign.kpiCompletedToday = activeCampaign.kpiPerDay
                    ? `${((today.click || 0) /
                        (activeCampaign.kpiPerDay * 0.01)).toFixed(2)}%`
                    : 'Unlimited';
                }

                return activeCampaign;
              })
              .catch(() => activeCampaign);
          }),
        { concurrency: 1 },
      )
      .then((activeCampaigns) => {
        location.activeCampaigns = lodash.sortBy(activeCampaigns, 'priority');
        debug('%s: active campaigns %o', location.name, activeCampaigns);
        return Promise.all([
          location.save(),
          LocationCached.upsert(location.toJSON()),
        ]);
      });
  };

  const processTopLocation = (offset = 0, limit = 50) =>
    Location.find(
      { order: 'createdAt ASC', limit, offset },
      { skipCheckResource: true },
    ).then(locations =>
      Promise.map(locations, updateLocationRealActiveCampaigns, {
        concurrency: 1,
      }).then(
        () =>
          locations.length === limit &&
          processTopLocation(offset + limit, limit),
      ),
    );

  const processTopCampaign = (offset = 0, limit = 50) =>
    Campaign.find(
      {
        where: { status: { nin: [Campaign.CREATED, Campaign.FINISHED] } },
        order: 'createdAt ASC',
        limit,
        offset,
      },
      { skipCheckResource: true },
    )
      .then(campaigns =>
        Promise.mapSeries(campaigns, processCampaignStatus).then(
          () => campaigns.length,
        ),
      )
      .then(
        length => length === limit && processTopCampaign(offset + limit, limit),
      )
      .catch((err) => {
        error('campaign observer job failed');
        error(err);
      });

  const processFrequency = () =>
      Campaign.find({where: {status: Campaign.RUNNING}}).then((campaigns)=>{
          console.log('processFrequency campaigns', campaigns);
          const esTrackingConn = Tracking.getDataSource().connector;
          const esTrackingDb = esTrackingConn.db;
          Promise.promisify(esTrackingDb.search).call(esTrackingDb, {
            index: esTrackingConn.searchIndex,
            type: Tracking.modelName,
            body: {
                query: {
                    bool: {
                        should: lodash.map(campaigns, (item)=>{ return { term: { 'meta.campaignId': item.id }}})
                    }
                },
                size: 0,
                aggs: {
                    "mac": {
                        "terms": { "field": "mac" },
                        "aggs": {
                            "campaign": {
                              "terms": { "field": "meta.campaignId"},
                              "aggs": {
                                  "location": {
                                      "terms": { "field": "meta.locationId", size: 100 },
                                      "aggs": {
                                        "clickAggs": {
                                          "nested": { "path": "actions" },
                                          "aggs": { "action": { "terms": { "field": "actions.action", "size": 2  } } }
                                        }
                                      }
                                  }
                              }
                            }
                        }
                    }
                }
            },
        }).then((res)=>{
              let frequencyObj = {};
              // res.aggregations.campaign.buckets.forEach((camp)=>{
              //     frequencyObj[camp.key] = {total: 0};
              //     camp.location.buckets.forEach((loc)=>{
              //         frequencyObj[camp.key][loc.key] = 0;
              //         loc.clickAggs.action.buckets.forEach((act)=>{
              //             if(act.key==='click'){
              //                 frequencyObj[camp.key][loc.key] = act.doc_count;
              //                 frequencyObj[camp.key].total += act.doc_count;
              //             }
              //         });
              //     });
              // });
              console.log('processFrequency data', JSON.stringify(res));
        });
      });

  return (job, cb) => {
    debug('start');
    return processTopCampaign(0, 50)
      .then(() => processTopLocation(0, 50))
      // .then(() => processFrequency())
      .then(() => {
        debug('campaign observe job finished');
        cb();
      })
      .catch((err) => {
        error('campaign observe job failed');
        error(err);
        cb(err);
      });
  };
};

module.exports = run;

if (
  require.main === module ||
  require.main.filename.indexOf('boot.babel') > 0
) {
  const app = require('../server'); // eslint-disable-line global-require
  run(app)(null, () => process.exit(0));
}
