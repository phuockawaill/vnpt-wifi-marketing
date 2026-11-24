'use strict';

module.exports = function (TemplateBase) {
    TemplateBase.disableRemoteMethodByName('prototype.patchAttributes');

    TemplateBase.disableRemoteMethodByName('count');
    TemplateBase.disableRemoteMethodByName('createChangeStream');
    TemplateBase.disableRemoteMethodByName('upsert');
    TemplateBase.disableRemoteMethodByName('exists');
    TemplateBase.disableRemoteMethodByName('upsertWithWhere');
    TemplateBase.disableRemoteMethodByName('replaceOrCreate');
    TemplateBase.disableRemoteMethodByName('replaceById');
    TemplateBase.disableRemoteMethodByName('destroyAll');
};
