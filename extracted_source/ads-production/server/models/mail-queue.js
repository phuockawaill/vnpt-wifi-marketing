'use strict';

const { ObjectId } = require('mongodb').ObjectID;
const debug = require('debug')('app:model:MailQueue');
const error = require('debug')('err:model:MailQueue');

module.exports = function (MailQueue) {
    MailQueue.disableRemoteMethodByName('prototype.__count__users');
    MailQueue.disableRemoteMethodByName('prototype.__create__users');
    MailQueue.disableRemoteMethodByName('prototype.__delete__users');
    MailQueue.disableRemoteMethodByName('prototype.__destroyById__users');
    MailQueue.disableRemoteMethodByName('prototype.__findById__users');
    MailQueue.disableRemoteMethodByName('prototype.__get__users');
    MailQueue.disableRemoteMethodByName('prototype.__updateById__users');
    MailQueue.disableRemoteMethodByName('prototype.patchAttributes');

    MailQueue.disableRemoteMethodByName('createChangeStream');
    MailQueue.disableRemoteMethodByName('upsert');
    MailQueue.disableRemoteMethodByName('exists');
    MailQueue.disableRemoteMethodByName('upsertWithWhere');
    MailQueue.disableRemoteMethodByName('replaceOrCreate');
    MailQueue.disableRemoteMethodByName('replaceById');
    MailQueue.disableRemoteMethodByName('destroyAll');

    MailQueue.defineProperty('mailTemplateId', { type: ObjectId });
};