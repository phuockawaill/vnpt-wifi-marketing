const Promise = require('bluebird');
const { ObjectId } = require('mongodb').ObjectID;
const moment = require('moment');
const lodash = require('lodash');
const {
    sendEmail
} = require('../import/utils');

module.exports = (License) => {
    License.defineProperty('userId', { type: ObjectId, require: true });

    License.disableRemoteMethodByName('exists');
    License.disableRemoteMethodByName('create');
    License.disableRemoteMethodByName('upsert');
    License.disableRemoteMethodByName('updateAll');
    License.disableRemoteMethodByName('prototype.patchAttributes');
    License.disableRemoteMethodByName('prototype.updateAttributes');
    License.disableRemoteMethodByName('replaceOrCreate');
    License.disableRemoteMethodByName('replaceById');
    License.disableRemoteMethodByName('findById');
    License.disableRemoteMethodByName('upsertWithWhere');
    License.disableRemoteMethodByName('deleteById');
    License.disableRemoteMethodByName('createChangeStream');
    License.disableRemoteMethodByName('count');
    License.disableRemoteMethodByName('findWithTotal');
    License.disableRemoteMethodByName('findWithTotal');

    License.requireLicense = (type, ap, numberAp, email, phone, res, req, cb) => {
        const { AccessToken, User, Transaction } = License.app.models;
        const app = License.app;
        Promise.all([Math.random().toString(36).substr(2, 12), Promise.promisify(AccessToken.findForRequest).call(AccessToken, req)])
        .spread((key, token) => {
            let obj = {
                type: type,
                key: key.toUpperCase(),
                status: 0,
                userId: token.userId,
                numberAp,
                createdAt: moment().valueOf()
            };
            return Promise.all([License.create(obj), User.findById(token.userId, { fields: { password: 0 } })]);
        }).then(([lin, usrReq])=>{
            let submitLink = `${app.get('appScheme')}//${app.get('appHost')}/api/Licenses/${lin.id.toString()}/approveLicense?key=${lin.key}&userId=${lin.userId}&email=${email}`;
            let emailActive = '<html>'+
            '<h4>1> Tài khoản yêu cầu </h4>'+
            '<span>- Username: <b>'+usrReq.username+'</b> </span><br>'+
            '<span>- Account Type: <b>'+usrReq.profileName+'</b> </span><br>'+
            '<span>- Email: <b>'+usrReq.email+'</b> </span><br>'+
            '<h4>2> Thông tin yêu cầu </h4>'+
            '<span>- Số lượng AP: <b>'+numberAp+'</b> </span><br>'+
            '<span>- Email: <b>'+email+'</b> </span><br>'+
            '<span>- Phone: <b>'+phone+'</b> </span><br>'+
            '<h4>3> Thời gian yêu cầu: '+moment().format('HH:mm DD/MM/YYYY')+' </h4>'+
            '<p>Click <a href="'+submitLink+'">Kích hoạt License</a> nếu xác nhận kích hoạt License này!</p>'+
            '</html>';
            return Promise.all([
                Transaction.create({ keyId: lin.id.toString(), user: lin.userId, action: 'Request '+type, createdAt: moment().valueOf() }),
                sendEmail('tien@wifiex4u.vn', 'Expanding License Request', emailActive)
            ]);
        }).then(()=>{
            let emailNotify = '<html><label><b>WIFIEX4U</b> cám ơn Quý khách hàng đã gửi yêu cầu mở rộng bản quyền hệ thống, Chúng tôi sẽ liên hệ Quý khách hàng trong thời gian sớm nhất</label></html>';
            sendEmail(email, "Expanding License Request", emailNotify)
            res.sendStatus(200);
        })
        .catch((err) => {
            cb(err);
        });
    };
    License.remoteMethod('requireLicense', {
        accepts: [
            { arg: 'type', type: 'string', required: true },
            { arg: 'ap', type: 'array' },
            { arg: 'numberAp', type: 'number' },
            { arg: 'email', type: 'string', required: true },
            { arg: 'phone', type: 'string' },
            { arg: 'res', type: 'object', http: { source: 'res' } },
            { arg: 'req', type: 'object', http: { source: 'req' } }
        ],
        http: { path: '/requireLicense/', verb: 'post' }
        // returns: [
        //   {arg: 'body', http: { target: 'body' }, root: true},
        //   {arg: 'Content-Type', type: 'string', http: { target: 'header' }}
        // ]
    });

    License.createLicense = (numberAp, userId, req, res, cb) => {
        const { AccessToken, User, Transaction } = License.app.models;
        Promise.all([Math.random().toString(36).substr(2, 12), Promise.promisify(AccessToken.findForRequest).call(AccessToken,req)])
        .spread((key, token) => {
            let obj = {
                type: 'expand',
                key: key.toUpperCase(),
                status: 1,
                userId,
                numberAp,
                createdAt: moment().valueOf()
            };
            return Promise.all([License.create(obj), User.findById(token.userId, { fields: { password: 0 } })]);
        })
        .then(([lin, usrReq])=>{
            return Transaction.create({ keyId: lin.id.toString(), user: usrReq.id, action: 'approved', createdAt: moment().valueOf() });
        })
        .then(()=>{
            res.sendStatus(200);
        })
        .catch((err)=>{
            cb(err);
        });
    };
    License.remoteMethod('createLicense', {
        accepts: [
            { arg: 'numberAp', type: 'number', required: true },
            { arg: 'userId', type: 'string', require: true },
            { arg: 'req', type: 'object', http: { source: 'req' } },
            { arg: 'res', type: 'object', http: { source: 'res' } }
        ],
        http: { path: '/createLicense/', verb: 'get' },
        // returns: [
        //   {arg: 'body', http: { target: 'body' }, root: true},
        //   {arg: 'Content-Type', type: 'string', http: { target: 'header' }}
        // ]
    });

    License.approveLicense = (keyId, key, userId, email, res, cb) => {
        const chain = Promise.resolve();
        const { Transaction } = License.app.models;
        chain.then(() => License.findById(keyId))
        .then((lin) => {
            const emailActive = `<html><label> Your Activate License Key: <b>${lin.key}<b> </label></html>`;

            if (lin && lin.key === key && lin.userId.toString() === userId) {
                if (lin.status === 1 || lin.status === 99) {
                    return res.send('Activate License successful!');
                }
                return Promise.all([
                    lin.updateAttribute('status', 1),
                    Transaction.create({ keyId: lin.id.toString(), user: userId, action: 'approved', createdAt: moment().valueOf() }),
                    sendEmail(email, 'Activate License', emailActive)
                ])
                .spread(() => res.send('Activate License successful!'));
            }
            if (!lin) {
                return res.send('License not found!');
            }
            if (lin.key !== key) {
                return res.send('Wrong license key!');
            }
            if (lin.userId.toString() !== userId) {
                return res.send('This license not belong to User was sent!');
            }
            return res.send('Activate license fail!');
        })
        .catch((err) => {
            cb(err);
        });
    };
    License.remoteMethod('approveLicense', {
        accepts: [
            { arg: 'id', type: 'string', required: true },
            { arg: 'key', type: 'string', required: true },
            { arg: 'userId', type: 'string', require: true },
            { arg: 'email', type: 'string', require: true },
            { arg: 'res', type: 'object', http: { source: 'res' } }
        ],
        http: { path: '/:id/approveLicense/', verb: 'get' }
        // returns: [
        //   {arg: 'body', http: { target: 'body' }, root: true},
        //   {arg: 'Content-Type', type: 'string', http: { target: 'header' }}
        // ]
    });

    License.approveMoveLicense = (keyId, active, userId, req, res, cb) => {
        const { AccessToken, Transaction } = License.app.models;
        Promise.all([License.findById(keyId), Promise.promisify(AccessToken.findForRequest).call(AccessToken, req)])
        .spread((lin, token) => {
            lin.updateAttribute('status', active ? 99 : 1);
            lin.updateAttribute('userId', userId);
            if (active) {
                lin.updateAttribute('end', moment(lin.createdAt).add(1, 'year').valueOf());
            }
            return Transaction.create({ keyId, user: token.userId, destUser: userId, action: active ? 'active' : 'approve', createdAt: moment().valueOf() });// destUser
        })
        .then(() => {
            res.sendStatus(200);
            return cb();
        })
        .catch((err) => {
            cb(err);
        });
    };
    License.remoteMethod('approveMoveLicense', {
        accepts: [
            { arg: 'id', type: 'string', required: true },
            { arg: 'active', type: 'boolean', required: true },
            { arg: 'userId', type: 'string', require: true },
            { arg: 'req', type: 'object', http: { source: 'req' } },
            { arg: 'res', type: 'object', http: { source: 'res' } }
        ],
        http: { path: '/:id/approveMoveLicense/', verb: 'get' },
        // returns: [
        //   {arg: 'body', http: { target: 'body' }, root: true},
        //   {arg: 'Content-Type', type: 'string', http: { target: 'header' }}
        // ]
    });

    License.updateStatus = (id, status, req, cb) => {
        const { AccessToken, User, Transaction } = License.app.models;
        Promise.all([License.findById(id), Promise.promisify(AccessToken.findForRequest).call(AccessToken, req)])
        .spread((lin, token) => {
            let err, type;
            if(status === lin.status){
                cb(null, lin);
            } else {
                switch (status) {
                    case 1:
                        type = 'approve';
                        if(lin.status !== 0 && lin.status !== 2){
                            err = new Error('Not allow!');
                            err.statusCode = 400;
                        }
                        break;
                    case 2:
                        type = 'submit';
                        if(lin.status !== 0){
                            err = new Error('Not allow!');
                            err.statusCode = 400;
                        }
                        break;
                    case 101:
                        type = 'cancel';
                        if(lin.status === 100){
                            err = new Error('Not allow!');
                            err.statusCode = 400;
                        }
                        break;
                    default:
                        type = 'unknown';
                }
                if(err){
                    cb(err);
                } else {
                    return Promise.all([
                        Transaction.create({ keyId: lin.id.toString(), user: token.userId, action: type, createdAt: moment().valueOf() }),
                        lin.updateAttribute('status', status)
                    ]);
                }
            }
        })
        .then(([tran, obj])=>{
            cb(null, obj);
        })
        .catch((err)=>{
            cb(err);
        });
    };
    License.remoteMethod('updateStatus', {
        accepts: [
            { arg: 'id', type: 'string', required: true },
            { arg: 'status', type: 'number', required: true },
            { arg: 'req', type: 'object', http: { source: 'req' } }
        ],
        http: { path: '/:id/updateStatus/', verb: 'post' },
        returns: [{ arg: 'license', type: License.modelName, root: true }],
    });

    License.activeLicense = (key, req, res, cb) => {
        const { AccessToken, User, Transaction, APMap } = License.app.models;
        Promise.all([License.findOne({ where: { key } }), Promise.promisify(AccessToken.findForRequest).call(AccessToken, req)])
        .spread((lin, token) => {
            let err;
            if (token) {
                if (token.userId.equals(lin.userId)) {
                    if (lin.status === 0 || lin.status === 1) {
                        return Promise.all([
                            APMap.find({ where: { status: 0, createdBy: token.userId }, limit: lin.numberAp }),
                            User.findById(token.userId),
                            License.findOne({ where: { type: 'trial', status: 99, userId: token.userId } }),
                            License.replaceById(lin.id.toString(), Object.assign({}, lin, { status: 99, end: moment().add(1, 'year').valueOf() })),
                            Transaction.create({ keyId: lin.id.toString(), user: token.userId, action: 'actived', createdAt: moment().valueOf() })
                        ])
                        .spread((aps, user, trialKey) => {
                            if (trialKey) {
                                APMap.find({ where: { keyId: trialKey.id } }, (err, apm) => {
                                    apm.forEach((ap) => {
                                        ap.updateAttribute('status', 1);
                                        ap.updateAttribute('keyId', lin.id.toString());
                                    });
                                });
                            }
                            aps.forEach((ap) => {
                                ap.updateAttribute('status', 1);
                                ap.updateAttribute('keyId', lin.id.toString());
                            });
                            user.updateAttribute('options', Object.assign({}, user.options, { trial: false }));
                            return cb();
                        });
                    }
                    err = new Error('Key actived! Try another key');
                    err.statusCode = 400;
                    cb(err);
                } else {
                    err = new Error('Key not match! Try another key');
                    err.statusCode = 400;
                    cb(err);
                }
            } else {
                err = new Error('User not found!');
                err.statusCode = 400;
                cb(err);
            }
        })
        .then(() => {
            res.sendStatus(200);
        })
        .catch((err) => {
            cb(err);
        });
    };
    License.remoteMethod('activeLicense', {
        accepts: [
            { arg: 'key', type: 'string', required: true },
            { arg: 'req', type: 'object', http: { source: 'req' } },
            { arg: 'res', type: 'object', http: { source: 'res' } }
        ],
        http: { path: '/:key/activeLicense/', verb: 'get' }
        // returns: [
        //   {arg: 'body', http: { target: 'body' }, root: true},
        //   {arg: 'Content-Type', type: 'string', http: { target: 'header' }}
        // ]
    });

    License.extendLicense = (id, req, res, cb) => {
        const { AccessToken, User, Transaction, APMap } = License.app.models;
        Promise.all([License.findById(id), Promise.promisify(AccessToken.findForRequest).call(AccessToken, req)])
        .spread((lin, token) => {
            let err;
            if (token) {
                return Promise.all([User.findById(token.userId), User.findById(lin.userId)])
                .spread((usr, usrLin) => {
                    if (usr.profileName === 'superadmin') {
                        const endTime = lin.end > moment().valueOf() ? moment(lin.end).add(1, 'year').valueOf() : moment().add(1, 'year').valueOf();
                        return Promise.all([
                            License.updateAll({ id: lin.id.toString() }, { status: 99, end: endTime, notifyExpire: 0 }),
                            APMap.updateAll({ keyId: lin.id.toString()  }, { status: 1 }),
                            Transaction.create({ keyId: lin.id.toString(), user: token.userId, action: 'extend', createdAt: moment().valueOf() }),
                            sendEmail(usrLin.email, 'Extend License', `<html><label> Your License has been extended to <b>${moment(endTime).format('MMM DD, YYYY')}<b> </label></html>`)
                        ])
                        .spread(() => {
                            res.sendStatus(200);
                            return cb();
                        })
                        .catch((errAll) => {
                            console.log('Update license err!', errAll);
                            err = new Error('Update license err!');
                            err.statusCode = 400;
                            return cb(err);
                        });
                    }
                    err = new Error('User not allow!');
                    err.statusCode = 400;
                    return cb(err);
                })
                .catch(() => {
                    err = new Error('user and user license Not found!');
                    err.statusCode = 400;
                    cb(err);
                });
            }
            err = new Error('Token user not found!');
            err.statusCode = 400;
            return cb(err);
        })
        .catch((err) => {
            console.log('find license err', err);
            cb(err);
        });
    };
    License.remoteMethod('extendLicense', {
        accepts: [
            { arg: 'id', type: 'string', required: true },
            { arg: 'req', type: 'object', http: { source: 'req' } },
            { arg: 'res', type: 'object', http: { source: 'res' } }
        ],
        http: { path: '/extendLicense/', verb: 'post' }
        // returns: [
        //   {arg: 'body', http: { target: 'body' }, root: true},
        //   {arg: 'Content-Type', type: 'string', http: { target: 'header' }}
        // ]
    });

  // Add history to License
    const appendHistory = (result, next) => {
        const { Transaction } = License.app.models;
        Transaction.find({ where: { keyId: { inq: result.map(item => item.id.toString()) } }, order: 'createdAt DESC' })
            .then((trans) => {
                let tranMap = lodash.groupBy(trans, t => t.keyId);
                result.forEach((item) => {
                    item.history = tranMap[item.id.toString()] || [];
                });
                next();
            });
    };
    License.afterRemote('find', (ctx, model, next) => {
        if (ctx.result) {
        appendHistory(ctx.result, next);
        } else {
        next();
        }
    });
    License.afterRemote('findOne', (ctx, model, next) => {
        if (ctx.result) {
        const { Transaction } = License.app.models;
        Transaction.find({ where: { keyId: ctx.result.id.toString() }, order: 'createdAt DESC' })
            .then((trans) => {
                ctx.result.history = trans || [];
                next();
            });
        } else {
        next();
        }
    });
};
