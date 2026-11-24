const { ObjectId } = require('mongodb').ObjectID;
const lodash = require('lodash');
const { standardizeMacAddressCNA } = require('../import/utils');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const postDSP = async (url, data, Authorization) => {
    return await axios(
        {
            method: 'POST',
            url,
            data,
            headers: { 'Content-Type': 'application/json', 'Authorization': Authorization },
        }
    )
};

module.exports = (Model, options) => {
    const { type } = options;

    Model.observe('before save', async (ctx) => {
        const app = Model.app;
        const { PublisherShare, APMap, User, Location, SelectOption } = Model.app.models;
        const context = ctx.options && ctx.options.accessToken;

        if (!context) {
            return;
        }

        try {
            let share = await PublisherShare.findOne({ where: { userId: context.userId } });
            let locationShares = [];

            if (share) {
                share = share.toJSON();
                const { locationDetail } = share;
                if (locationDetail && locationDetail.length) {
                    locationShares = locationDetail;
                }
            }

            let chain = {};
            if (ctx.instance) {
                chain = ctx.instance;
            } else if (ctx.data) {
                chain = ctx.data;
            }

            switch (type) {
                case 'PublisherShare':
                    if (chain && chain.share) {
                        if (chain.locationDetail) {
                            const locations = chain.locationDetail.filter(item => item.enable);
                            const aps = await APMap.find({ where: { locationId: { inq: locations.map(item => item.location) } } });
                            let infoLocations = await Promise.map(locations, location => Location.findById(location.location, { fields: { id: 1, name: 1, cityId: 1, districtId: 1, address: 1 } }));
                            infoLocations = infoLocations.map(item => item.toJSON());
                            const arrLocationId = lodash.uniqBy(infoLocations.map(item => item.cityId ? item.cityId : null).filter(item => item !== null), e => e);
                            const locationVal = await SelectOption.find({ where: { id: { inq: arrLocationId } } });
                            infoLocations = infoLocations.map(item => {
                                const findC = lodash.find(locationVal, item2 => item2.id.toString() === item.cityId.toString());
                                if (findC) {
                                    item.cityValue = findC.value || null;
                                }
                                return item;
                            });

                            if (chain.userId) {
                                let user = await User.findOne({ where: { id: chain.userId } });
                                user = user ? user.toJSON() : null;
                                infoLocations = infoLocations.map(item => {
                                    item.venueTypeId = (user && user.options && user.options.businessId) ? user.options.businessId : null;
                                    return item;
                                });

                                await postDSP(`${app.get('dspHost')}/api/user/register`,
                                    {
                                        name: user.name,
                                        username: user.username,
                                        phone: user.phone || null,
                                        email: user.email
                                    },
                                    jwt.sign({ type: 'Register' }, app.get('secretKey'), { expiresIn: 60 }));

                                await Promise.all([
                                    Promise.map(infoLocations, loc => postDSP(`${app.get('dspHost')}/api/venue`,
                                        loc,
                                        jwt.sign({ type: 'Venue', createdByUsername: user.username }, app.get('secretKey'), { expiresIn: 60 })), { concurrency: 10 }),
                                    postDSP(`${app.get('dspHost')}/api/adunit`,
                                        { venueIds: infoLocations.map(item => item.id) },
                                        jwt.sign({ type: 'AdUnit', createdByUsername: user.username }, app.get('secretKey'), { expiresIn: 60 })),
                                    Promise.map(aps, ap => postDSP(`${app.get('dspHost')}/api/aps`,
                                        {
                                            name: ap.name,
                                            mac: ap.mac || ap.mac5,
                                            venueId: ap.locationId,
                                        },
                                        jwt.sign({ type: 'APMap', createdByUsername: user.username }, app.get('secretKey'), { expiresIn: 60 })), { concurrency: 10 })
                                ]);
                            }
                        }
                    }
                    break;
                case 'Location':
                    if (chain && chain.id) {
                        const findInShare = lodash.find(locationShares, item => item.location.toString() === chain.id.toString());
                        if (findInShare && findInShare.enable) {
                            const [user, aps, locationVal] = await Promise.all([
                                User.findOne({ where: { id: context.userId } }),
                                APMap.find({ where: { locationId: chain.id } }),
                                SelectOption.findById(chain.cityId)
                            ]);

                            await Promise.all([
                                postDSP(`${app.get('dspHost')}/api/venue`,
                                    {
                                        id: chain.id,
                                        name: chain.name,
                                        cityId: chain.cityId,
                                        cityValue: (locationVal && locationVal.value) ? locationVal.value : null,
                                        districtId: chain.districtId, address: chain.address,
                                        venueTypeId: (user && user.options && user.options.businessId) ? user.options.businessId : null
                                    },
                                    jwt.sign({ type: 'Venue', createdByUsername: user.username }, app.get('secretKey'), { expiresIn: 60 })),
                                postDSP(`${app.get('dspHost')}/api/adunit`,
                                    { venueIds: [chain.id] },
                                    jwt.sign({ type: 'AdUnit', createdByUsername: user.username }, app.get('secretKey'), { expiresIn: 60 })),
                                Promise.map(aps, ap => postDSP(`${app.get('dspHost')}/api/aps`,
                                    {
                                        name: ap.name,
                                        mac: ap.mac || ap.mac5,
                                        venueId: ap.locationId,
                                    },
                                    jwt.sign({ type: 'APMap', createdByUsername: user.username }, app.get('secretKey'), { expiresIn: 60 })), { concurrency: 10 })
                            ]);
                        }
                    }
                    break;
                default:
                    break;
            }
        } catch (error) {
            return Promise.reject({ statusCode: 500, code: 'SERVER FAILED' });
        }
    });

    Model.observe('after save', async (ctx) => {
        const app = Model.app;
        const { PublisherShare, Location, LocationShareCached, User, SelectOption } = Model.app.models;
        const context = ctx.options && ctx.options.accessToken;
        if (!context) {
            return;
        }

        try {
            let share = await PublisherShare.findOne({ where: { userId: context.userId } });
            let locationShares = [];
            if (share) {
                share = share.toJSON();
                const { locationDetail } = share;
                if (locationDetail && locationDetail.length) {
                    locationShares = locationDetail;
                }
            }

            let chain = {};
            if (ctx.instance) {
                chain = ctx.instance;
            } else if (ctx.data) {
                chain = ctx.data;
            }

            switch (type) {
                case 'Location':
                    if (ctx.instance && ctx.isNewInstance && share) {
                        const [user, locationVal] = await Promise.all([
                            User.findOne({ where: { id: context.userId } }),
                            SelectOption.findById(chain.cityId)
                        ]);

                        await Promise.all([
                            postDSP(`${app.get('dspHost')}/api/venue`,
                                {
                                    id: chain.id,
                                    name: chain.name,
                                    cityId: chain.cityId,
                                    cityValue: (locationVal && locationVal.value) ? locationVal.value : null,
                                    districtId: chain.districtId, address: chain.address,
                                    venueTypeId: (user && user.options && user.options.businessId) ? user.options.businessId : null
                                },
                                jwt.sign({ type: 'Venue', createdByUsername: user.username }, app.get('secretKey'), { expiresIn: 60 })),
                            postDSP(`${app.get('dspHost')}/api/adunit`,
                                { venueIds: [chain.id] },
                                jwt.sign({ type: 'AdUnit', createdByUsername: user.username }, app.get('secretKey'), { expiresIn: 60 }))
                        ]);

                        locationShares.push({ location: chain.id.toString(), value: (share.sharingType === 'all') ? (share.value || 30) : 30, enable: true });
                        await Promise.all([
                            PublisherShare.updateAll({ id: ObjectId(share.id) }, { locationDetail: locationShares, userId: share.userId }),
                            LocationShareCached.upsert({ id: ObjectId(chain.id), value: (share.sharingType === 'all') ? (share.value || 30) : 30, currentCount: 1, createdBy: context.userId })
                        ]);
                    }
                    break;
                default:
                    break;
            }
        } catch (error) {
            let chain = {};
            if (ctx.instance) {
                chain = ctx.instance;
            } else if (ctx.data) {
                chain = ctx.data;
            }

            switch (type) {
                case 'Location':
                    await Location.destroyById(chain.id);
                    break;
                default:
                    break;
            }

            return Promise.reject({ statusCode: 500, code: 'SERVER FAILED' });
        }
    });

    Model.observe('before delete', async (ctx) => {
        const app = Model.app;
        const { APMap } = Model.app.models;
        const data = ctx.where;

        try {
            switch (type) {
                case 'APMap':
                    if (data && data.locationId) {
                        const aps = await APMap.find({ where: { locationId: data.locationId } });
                        await postDSP(`${app.get('dspHost')}/api/adunit`,
                            { venueId: data.locationId },
                            jwt.sign({ type: 'AdUnit', isDelete: true }, app.get('secretKey'), { expiresIn: 60 }));

                        await Promise.all([
                            postDSP(`${app.get('dspHost')}/api/venue`,
                                { id: data.locationId },
                                jwt.sign({ type: 'Venue', isDelete: true }, app.get('secretKey'), { expiresIn: 60 })),
                            Promise.map(aps, ap => postDSP(`${app.get('dspHost')}/api/aps`,
                                {
                                    name: ap.name,
                                    mac: ap.mac || ap.mac5,
                                    venueId: ap.locationId,
                                },
                                jwt.sign({ type: 'APMap', isDelete: true }, app.get('secretKey'), { expiresIn: 60 })), { concurrency: 10 })
                        ]);
                    }

                    if (data && data.mac) {
                        const mac = standardizeMacAddressCNA(data.mac);
                        const aps = await APMap.find({ where: { or: [{ macLan: mac }, { mac }, { mac5: mac }] } });
                        await Promise.map(aps, ap => postDSP(`${app.get('dspHost')}/api/aps`,
                            {
                                name: ap.name,
                                mac: ap.mac || ap.mac5,
                                venueId: ap.locationId,
                            },
                            jwt.sign({ type: 'APMap', isDelete: true }, app.get('secretKey'), { expiresIn: 60 })), { concurrency: 10 });
                    }
                    break;
                default:
                    break;
            }
        } catch (error) {
            return Promise.reject({ statusCode: 500, code: 'SERVER FAILED' });
        }
    });
};