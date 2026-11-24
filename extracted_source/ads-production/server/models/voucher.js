const Promise = require('bluebird');
const { ObjectId } = require('mongodb').ObjectID;
const moment = require('moment');
const lodash = require('lodash');
const csv = require('csv');

const logger = require('../import/logger')().child({ module: 'Model:Voucher' });
const debug = require('debug')('app:model:voucher');
const {
  standardizeMacAddress,
} = require('../import/utils');
const getRandomCode = () =>{
    let text = "";
    let possible = "0123456789";

    for (let i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    text +='-'
    for (let i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};
module.exports = (Voucher) => {
    Voucher.defineProperty('createdBy', { type: ObjectId, require: true });

    const verifyRequest = async (userId, clientKey)=>{
        const { User } = Voucher.app.models;
        if(!userId || !clientKey){
            return Promise.reject('Need authenticate');
        }
        let usr = await User.findOne({where: {_id: userId, clientkey: clientKey}});
        if(!usr){
            return Promise.reject('Unauthenticate');
        }
        return usr;
    };

    Voucher.createVouchers = (number, quota, expiredAt, download=0, upload=0, byteQuota=0, name="", userId, clientKey, cb) => {
        Promise.resolve().then(()=>verifyRequest(userId, clientKey))
        .then((usr)=>{
            number = Math.ceil(number);
            let createArr = [], currentTime = moment().valueOf();
            if(number<1){
                return Promise.resolve([]);
            }
            if(download<0 || upload<0 || byteQuota<0){
                return Promise.reject("Require positive number");
            }
            if(currentTime >= expiredAt){
                return Promise.reject('Do not create expired Voucher');
            }
            for (let i=0;i<number;i++){
                createArr.push({
                    code: getRandomCode(),
                    name,
                    quota,
                    expiredAt,
                    download, upload, byteQuota,
                    createdAt: currentTime,
                    createdBy: userId
                });
            }
            return Promise.resolve(createArr);
        })
        .then((data)=>Voucher.create(data)
            .then((resCreate)=>{
                cb(null, data);
            })
        )
        .catch((err)=>{
            let error = new Error(err);
            error.statusCode = 400;
             cb(error);
        });
    };
    Voucher.remoteMethod('createVouchers', {
        accepts: [
            {arg: 'number', type: 'number', required: true, description: 'Number of voucher to create'},
            {arg: 'quota', type: 'number', required: true, description: 'Number of active user use a voucher'},
            {arg: 'expiredAt', type: 'number', required: true, description: 'Voucher expired time Date getTime()'},
            {arg: 'download', type: 'number', description: 'Bandwidth Limit (Download) Kbps'},
            {arg: 'upload', type: 'number', description: 'Bandwidth Limit (Upload) Kbps'},
            {arg: 'byteQuota', type: 'number', description: 'Byte Quota MB'},
            {arg: 'name', type: 'string', description: 'Voucher Name'},
            {arg: 'clientId', type: 'string', required: true, description: 'Client Id'},
            {arg: 'clientKey', type: 'string', required: true, description: 'Client Key'}
        ],
        http: {path: '/createVouchers/', verb: 'post'},
        returns: { arg: 'body', http: { target: 'body' }, root: true }
        // returns: [
        //   {arg: 'body', http: { target: 'body' }, root: true},
        //   {arg: 'Content-Type', type: 'string', http: { target: 'header' }}
        // ]
    });

    Voucher.lists = (from, to, userId, clientKey, cb) => {
        Promise.resolve().then(()=>verifyRequest(userId, clientKey))
        .then((usr)=>{
            if(from<1 || to<1){
                return Promise.reject("Require positive number");
            }
            return Voucher.find({where: {createdAt: {gte: from, lte: to}, createdBy: usr.id}, fields: {code: true, name: true, quota: true, expiredAt: true, download: true, upload: true, byteQuota: true}});
        })
        .then((data)=>{
            cb(null, data);
        })
        .catch((err)=>{
            let error = new Error(err);
            error.statusCode = 400;
             cb(error);
        });
    };
    Voucher.remoteMethod('lists', {
        accepts: [
            {arg: 'from', type: 'number', required: true, description: 'Range from create Voucher'},
            {arg: 'to', type: 'number', required: true, description: 'Range to create Voucher'},
            {arg: 'clientId', type: 'string', required: true, description: 'Client Id'},
            {arg: 'clientKey', type: 'string', required: true, description: 'Client Key'}
        ],
        http: {path: '/lists/', verb: 'post'},
        returns: { arg: 'body', http: { target: 'body' }, root: true }
    });

    Voucher.statistics = (from, to, userId, clientKey, cb) => {
        Promise.resolve().then(()=>verifyRequest(userId, clientKey))
        .then((usr)=>{
            if(from<1 || to<1){
                return Promise.reject("Require positive number");
            }
            return Voucher.find({where: {createdAt: {gte: from, lte: to}, createdBy: usr.id}});
        })
        .then((data)=>{
            let obj = {created: data.length}, currentTime = moment().valueOf();
            obj.used = data.filter(vou=>vou.status).length;
            obj.unexpired = data.filter(vou=>vou.expiredAt>currentTime).length;
            obj.expired = data.filter(vou=>vou.expiredAt<currentTime).length;
            cb(null, obj);
        })
        .catch((err)=>{
            let error = new Error(err);
            error.statusCode = 400;
             cb(error);
        });
    };
    Voucher.remoteMethod('statistics', {
        accepts: [
            {arg: 'from', type: 'number', required: true, description: 'Range from create Voucher'},
            {arg: 'to', type: 'number', required: true, description: 'Range to create Voucher'},
            {arg: 'clientId', type: 'string', required: true, description: 'Client Id'},
            {arg: 'clientKey', type: 'string', required: true, description: 'Client Key'}
        ],
        http: {path: '/statistics/', verb: 'post'},
        returns: { arg: 'body', http: { target: 'body' }, root: true }
    });

    Voucher.deleteVoucher = (code, from, to, userId, clientKey, cb) => {
        Promise.resolve().then(()=>verifyRequest(userId, clientKey))
        .then((usr)=>{
            if(code){
                return Voucher.find({where: {code, createdBy: usr.id}});
            }
            if(!from || !to){
                return Promise.reject("Require range number");
            }
            if(from<1 || to<1){
                return Promise.reject("Require positive number");
            }
            return Voucher.find({where: {createdAt: {gte: from, lte: to}, createdBy: usr.id}});
        })
        .then((data)=>{
            if(data.length){
                Voucher.destroyAll({_id: {inq: data.map(item=>item.id)}}).then(()=>{
                    cb(null, 'OK');
                })
            } else {
                return Promise.reject("Not found any voucher!");
            }
        })
        .catch((err)=>{
            let error = new Error(err);
            error.statusCode = 400;
             cb(error);
        });
    };
    Voucher.remoteMethod('deleteVoucher', {
        accepts: [
            {arg: 'code', type: 'string', description: 'Voucher code'},
            {arg: 'from', type: 'number', description: 'Range from create Voucher'},
            {arg: 'to', type: 'number', description: 'Range to create Voucher'},
            {arg: 'clientId', type: 'string', required: true, description: 'Client Id'},
            {arg: 'clientKey', type: 'string', required: true, description: 'Client Key'}
        ],
        http: {path: '/deleteVoucher/', verb: 'post'},
        returns: { arg: 'body', http: { target: 'body' }, root: true }
    });

    Voucher.getVoucherData = (time, userId, clientKey, cb) => {
        Promise.resolve().then(()=>verifyRequest(userId, clientKey))
        .then((usr)=>{
            return Voucher.find({where: {status: 1, expiredAt: {gte: moment().valueOf()}}});
        })
        .then((data)=>{
            let listMac = [], listVou = [];
            if(data.length){
                data.forEach((vou)=>{
                    listVou.push({vou: vou.code, time: vou.makeSurvey?vou.expiredAt:moment(vou.expiredAt).subtract(Number(time), 'minutes').valueOf()});
                    if(vou.current && lodash.size(vou.current)){
                        lodash.forEach(vou.current, (__, mac)=>{
                            listMac.push({mac, vou: vou.code});
                        });
                    }
                });
                cb(null, {listMac, listVou});
            } else {
                cb(null, {});
            }
        })
        .catch((err)=>{
            let error = new Error(err);
            error.statusCode = 400;
             cb(error);
        });
    };
    Voucher.remoteMethod('getVoucherData', {
        accepts: [
            {arg: 'time', type: 'number', description: 'Number of hour to show survey'},
            {arg: 'clientId', type: 'string', required: true, description: 'Client Id'},
            {arg: 'clientKey', type: 'string', required: true, description: 'Client Key'}
        ],
        http: {path: '/getVoucherData/', verb: 'post'},
        returns: { arg: 'body', http: { target: 'body' }, root: true }
    });

    const errHash = {
        VOUCHER_INVALID: "Voucher không tồn tại!",
        VOUCHER_EXPIRED: "Voucher đã hết hạn!",
        VOUCHER_MAXUSER: "Mã Voucher này đã vượt quá số lượng thiết bị sử dụng, vui lòng sử dụng mã khác!",
        VOUCHER_MAXDATA: "Voucher đã hết dung lượng sử dụng!"
    };

    Voucher.check = (code, mac, cb) => {
        Promise.resolve().then(()=>Voucher.findOne({where: {code}}))
        .then((vou)=>{
            if(vou){
                if(mac.indexOf('-')){
                    mac = mac.split("-").join(':');
                }
                if(moment().valueOf() > vou.expiredAt){
                    return Promise.reject("Voucher đã hết hạn!");
                } else if(vou.quota && vou.current && !vou.current[mac] && lodash.size(vou.current) >= vou.quota){
                    return Promise.reject("Mã Voucher này đã vượt quá số lượng thiết bị sử dụng, vui lòng sử dụng mã khác!");
                } else if(vou.loggedIn && vou.loggedIn[mac] && vou.byte>0 && vou.loggedIn[mac].totalData >= (vou.byte*1024*1024)){
                    return Promise.reject("Voucher đã hết dung lượng sử dụng!");
                } else {
                    cb(null, vou.status);
                }
            } else {
                return Promise.reject("Voucher không tồn tại!");
            }
        })
        .catch((err)=>{
            let error = new Error(err);
            error.statusCode = 400;
             cb(error);
        });
    };
    Voucher.remoteMethod('check', {
        accepts: [
            {arg: 'code', type: 'string', description: 'Voucher code', required: true},
            {arg: 'm', type: 'string', description: 'Device Mac', required: true}
        ],
        http: {path: '/check/', verb: 'get'},
        returns: { arg: 'body', type: 'boolean', http: { target: 'body' }, root: true }
    });
};
