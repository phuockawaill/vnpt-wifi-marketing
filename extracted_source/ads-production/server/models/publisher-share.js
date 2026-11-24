'use strict';
import lodash from 'lodash';

const { ObjectId } = require('mongodb').ObjectID;

module.exports = function (PublisherShare) {
    PublisherShare.disableRemoteMethodByName('count');
    PublisherShare.disableRemoteMethodByName('createChangeStream');
    PublisherShare.disableRemoteMethodByName('upsert');
    PublisherShare.disableRemoteMethodByName('exists');
    PublisherShare.disableRemoteMethodByName('upsertWithWhere');
    PublisherShare.disableRemoteMethodByName('replaceOrCreate');
    PublisherShare.disableRemoteMethodByName('replaceById');
    PublisherShare.disableRemoteMethodByName('destroyAll');

    PublisherShare.defineProperty('userId', { type: ObjectId });

    const upSert = async (LocationShareCached, loc) => {
        try {
            return await LocationShareCached.upsert(loc);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    const destroy = async (LocationShareCached, loc) => {
        try {
            return await LocationShareCached.destroyById(loc);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    const isMerge = (a, b, p) => a.filter(aa => b.findIndex(bb => aa[p].toString() === bb[p].toString()) < 0).concat(b);

    const excuteWithShare = async (chain) => {
        if (chain.isDelete) {
            return;
        }

        let newLocationDetail = lodash.cloneDeep(chain.locationDetail);
        let locationShares = [];
        if (chain.userId) {
            let share = await PublisherShare.findOne({ where: { userId: chain.userId } });
            if (share) {
                share = share.toJSON();
                const { locationDetail } = share;
                if (locationDetail && locationDetail.length) {
                    locationShares = locationDetail;
                }
            }
        }

        chain.locationDetail = isMerge(locationShares, newLocationDetail, "location");
    }

    PublisherShare.observe('before save', async (ctx) => {
        const userId = ctx.options && ctx.options.accessToken && ctx.options.accessToken.userId;
        if (ctx.instance) {
            ctx.instance.userId = (ctx.instance && ctx.instance.userId) ? ctx.instance.userId : (userId ? userId : null);
            await excuteWithShare(ctx.instance.toJSON());
            if (ctx.instance.isDelete) {
                delete ctx.instance.isDelete;
            }
        } else if (ctx.data) {
            ctx.data.userId = (ctx.data && ctx.data.userId) ? ctx.data.userId : (userId ? userId : null);
            await excuteWithShare(ctx.data);
            if (ctx.data.isDelete) {
                delete ctx.data.isDelete;
            }
        }
        return;
    });

    PublisherShare.observe('after save', async (ctx) => {
        const { LocationShareCached } = PublisherShare.app.models;

        let chain = [];
        if (ctx.instance) {
            chain = [ctx.instance];
        } else if (ctx.data) {
            chain = [ctx.data];
        }

        return chain.map(item => {
            let loopLocations = item.locationDetail;
            let insertLocations = [];
            let deleteLocations = [];

            if (!item.sharingType) {
                return;
            }

            if (item && item.share) {
                if (item.sharingType && item.sharingType === 'all') {
                    loopLocations = loopLocations.map(item2 => { item2.value = item.value; return item2; });
                }
                insertLocations = loopLocations.filter(item2 => item2.enable);
                insertLocations = insertLocations.map(item2 => ({ id: item2.location, value: item2.value, currentCount: 1, createdBy: item.userId }));
                deleteLocations = loopLocations.filter(item2 => !item2.enable);

                return Promise.all([Promise.map(insertLocations, (loc) => upSert(LocationShareCached, loc), { concurrency: 5 }), Promise.map(deleteLocations, (loc) => destroy(LocationShareCached, loc.location), { concurrency: 5 })]);
            }
            return Promise.all([Promise.map(loopLocations, (loc) => destroy(LocationShareCached, loc.location), { concurrency: 5 })]);
        });
    });
};
