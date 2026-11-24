const loopback = require('loopback');
const path = require('path');

export default function (app) {
    const mailTemplates = [
        {
            type: 'confirm_email',
            htmlTemplate: loopback.template(path.resolve(__dirname, '../../server/templates/email-template/confirm_email.ejs'))(),
            used: true,
        },
        {
            type: 'forgot_password',
            htmlTemplate: loopback.template(path.resolve(__dirname, '../../server/templates/email-template/forgot_password.ejs'))(),
            used: true,
        }
    ];
    return app.models.MailTemplate.create(mailTemplates);
}