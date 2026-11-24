const ejs = require('ejs');
const Promise = require('bluebird');
const nodemailer = require('nodemailer');
const app = require('../server');

const verifyMail = () => {
    let smtpTransport = nodemailer.createTransport({
        host: app.get('mail').host,
        secure: true,
        port: 465,
        auth: { user: app.get('mail').username, pass: app.get('mail').password }
    });

    return new Promise((resolve, reject) => {
        smtpTransport.verify((error, success) => {
            if (error) {
                console.log('verify email Err', error);
                reject('verify error');
            } else {
                console.log(">> Server is ready to take our messages <<");
                resolve(smtpTransport);
            }
        });
    });
};

const sendMail = (smtpTransport, to, subject, html, cc, bcc) => {
    let mailOptions = {
        from: app.get('mail').sender,
        to,
        cc,
        bcc,
        subject,
        html
    }

    return new Promise((resolve, reject) => {
        smtpTransport.sendMail(mailOptions, (error, response) => {
            if (error) {
                reject('Message sent error');
            } else {
                resolve("Message sent: " + response.messageId);
            }
            smtpTransport.close();
        });
    });
};

const excute = async (verify, queue) => {
    try {
        const { message: { to, cc, bcc, subject }, locals, mailTemplate: { htmlTemplate } } = queue;
        const embedCodeHtml = ejs.render(htmlTemplate, { locals });
        await sendMail(verify, to, subject, embedCodeHtml, cc, bcc);
        return { queue, status: 'success' };
    } catch (error) {
        return { queue, status: 'error' };
    }
};

const callSetJob = async () => {
    const { MailQueue } = app.models;
    console.log('>> get mail to queue');

    let verify = await verifyMail();
    let mailqueues = await MailQueue.find({
        where: { status: 'approved' },
        include: {
            relation: 'mailTemplate',
            scope: { fields: ['htmlTemplate'] }
        },
        limit: 10
    });
    mailqueues = (mailqueues && mailqueues.length) ? mailqueues.map(item => item.toJSON()) : [];
    await MailQueue.destroyAll({ id: { inq: mailqueues.map(item => item.id) } });

    return Promise.all([Promise.map(mailqueues, (queue) => excute(verify, queue), { concurrency: 3 })]);
    // return [];
};

const upsertFunc = async (item) => {
    const { MailLog } = app.models;
    return await MailLog.upsert(item);
};

const run = (app) => {
    return (job, cb) => {
        console.log('start email jobs');
        return callSetJob()
            .then(([mails]) => {
                if (mails && mails.length) {
                    Promise.all(mails.map(item => upsertFunc({
                        queue: item.queue ? item.queue : {},
                        status: item.status ? item.status : 'error',
                        createdAt: new Date()
                    })))
                        .then(() => cb());
                    console.log('>> done email');
                } else {
                    cb();
                    console.log('not any mail');
                }
            }).catch((err) => {
                console.log('err email jobs', err);
                cb(err);
            });
    };
};

module.exports = run;

if (
    require.main === module ||
    require.main.filename.indexOf('boot.babel') > 0
) {
    const app = require('../server'); // eslint-disable-line global-require
    run(app)(null, () => process.exit(0));
}
