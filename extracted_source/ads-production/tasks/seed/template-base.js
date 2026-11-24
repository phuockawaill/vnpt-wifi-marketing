import Promise from 'bluebird';

export default function (app) {
    const templateBases = require('./template-base.json');
    if (templateBases && templateBases.static && templateBases.video) {
        return Promise.all([
            Promise
                .each(templateBases.static, item => {
                    return app.models.TemplateBase.create(item);
                }),
            Promise
                .each(templateBases.video, item => {
                    return app.models.TemplateBase.create(item);
                })
        ]).then(() => { }).catch(err => console.log(err));
    }
}
