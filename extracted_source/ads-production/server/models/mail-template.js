'use strict';

const debug = require('debug')('app:model:MailTemplate');
const error = require('debug')('err:model:MailTemplate');

module.exports = (MailTemplate) => {
    MailTemplate.disableRemoteMethodByName('prototype.__count__users');
    MailTemplate.disableRemoteMethodByName('prototype.__create__users');
    MailTemplate.disableRemoteMethodByName('prototype.__delete__users');
    MailTemplate.disableRemoteMethodByName('prototype.__destroyById__users');
    MailTemplate.disableRemoteMethodByName('prototype.__findById__users');
    MailTemplate.disableRemoteMethodByName('prototype.__get__users');
    MailTemplate.disableRemoteMethodByName('prototype.__updateById__users');
    MailTemplate.disableRemoteMethodByName('prototype.patchAttributes');

    MailTemplate.disableRemoteMethodByName('createChangeStream');
    MailTemplate.disableRemoteMethodByName('upsert');
    MailTemplate.disableRemoteMethodByName('exists');
    MailTemplate.disableRemoteMethodByName('upsertWithWhere');
    MailTemplate.disableRemoteMethodByName('replaceOrCreate');
    MailTemplate.disableRemoteMethodByName('replaceById');
    MailTemplate.disableRemoteMethodByName('destroyAll');
};
