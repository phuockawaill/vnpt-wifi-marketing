'use strict';

const debug = require('debug')('app:model:MailLog');
const error = require('debug')('err:model:MailLog');

module.exports = function (MailLog) {
    MailLog.disableRemoteMethodByName('prototype.__count__users');
    MailLog.disableRemoteMethodByName('prototype.__create__users');
    MailLog.disableRemoteMethodByName('prototype.__delete__users');
    MailLog.disableRemoteMethodByName('prototype.__destroyById__users');
    MailLog.disableRemoteMethodByName('prototype.__findById__users');
    MailLog.disableRemoteMethodByName('prototype.__get__users');
    MailLog.disableRemoteMethodByName('prototype.__updateById__users');
    MailLog.disableRemoteMethodByName('prototype.patchAttributes');

    MailLog.disableRemoteMethodByName('createChangeStream');
    MailLog.disableRemoteMethodByName('upsert');
    MailLog.disableRemoteMethodByName('exists');
    MailLog.disableRemoteMethodByName('upsertWithWhere');
    MailLog.disableRemoteMethodByName('replaceOrCreate');
    MailLog.disableRemoteMethodByName('replaceById');
    MailLog.disableRemoteMethodByName('destroyAll');
};