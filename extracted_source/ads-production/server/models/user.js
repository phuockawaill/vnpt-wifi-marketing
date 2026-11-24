const loopback = require('loopback');
const path = require('path');
const Promise = require('bluebird');
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const axios = require('axios');
const querystring = require('querystring');
const lodash = require('lodash');
const { allowCrossOrigin } = require('../import/access-utils');
const nodemailer = require('nodemailer');

const { ObjectId } = require('mongodb').ObjectID;
const logger = require('../import/logger')().child({ module: 'model:User' });

module.exports = (User) => {
  User.disableRemoteMethodByName('prototype.__count__accessTokens');
  User.disableRemoteMethodByName('prototype.__create__accessTokens');
  User.disableRemoteMethodByName('prototype.__delete__accessTokens');
  User.disableRemoteMethodByName('prototype.__destroyById__accessTokens');
  User.disableRemoteMethodByName('prototype.__findById__accessTokens');
  User.disableRemoteMethodByName('prototype.__get__accessTokens');
  User.disableRemoteMethodByName('prototype.__updateById__accessTokens');
  User.disableRemoteMethodByName('prototype.__get__resourceGroup');
  User.disableRemoteMethodByName('prototype.__get__profile');

  User.disableRemoteMethodByName('prototype.__count__publisherShare');
  User.disableRemoteMethodByName('prototype.__create__publisherShare');
  User.disableRemoteMethodByName('prototype.__delete__publisherShare');
  User.disableRemoteMethodByName('prototype.__destroy__publisherShare');
  User.disableRemoteMethodByName('prototype.__findById__publisherShare');
  User.disableRemoteMethodByName('prototype.__get__publisherShare');
  User.disableRemoteMethodByName('prototype.__update__publisherShare');
  User.disableRemoteMethodByName('prototype.__replaceById__publisherShare');
  User.disableRemoteMethodByName('prototype.__deleteById__publisherShare');

  User.disableRemoteMethodByName('count');
  User.disableRemoteMethodByName('verify');
  User.disableRemoteMethodByName('confirm');
  User.disableRemoteMethodByName('resetPassword');
  User.disableRemoteMethodByName('destroyAll');
  User.defineProperty('createdBy', { type: ObjectId, require: true });

  User.prototype.updateRoleMapping = function updateRoleMapping(
    forceDelete = false,
  ) {
    const { roleMapping, RoleProfileMapping } = User.app.models;
    if (this.profileId && !forceDelete) {
      return roleMapping
        .destroyAll({ principalType: roleMapping.USER, principalId: this.id })
        .then(() =>
          RoleProfileMapping.find({ where: { profileId: this.profileId } }),
        )
        .then(mappings =>
          roleMapping.create(
            mappings.map(map => ({
              principalType: roleMapping.USER,
              principalId: this.id,
              roleId: map.roleId,
            })),
          ),
        )
        .catch((err) => {
          logger.error({ err }, 'Update role mapping failed');
        });
    }
    return roleMapping
      .destroyAll({ principalType: roleMapping.USER, principalId: this.id })
      .catch((err) => {
        logger.error({ err }, 'Delete role mapping failed');
      });
  };

  // Create ResourceGroup
  User.observe('before save', (ctx, next) => {
    if (ctx.instance && ctx.isNewInstance) {
      const { ResourceGroup } = User.app.models;

      ResourceGroup.create()
        .then((resourceGroup) => {
          ctx.instance.resourceGroupId = resourceGroup.id;
          next();
        })
        .catch((err) => {
          logger.error({ err }, 'Create resource group failed');
          next(err);
        });
    } else {
      next();
    }
  });

  // Set the username to the users email address by default.
  User.observe('before save', async (ctx, next) => {
    if (ctx.instance) {
      if (ctx.isNewInstance && !ctx.instance.username) {
        ctx.instance.username = ctx.instance.email;
      }
      if (!ctx.isNewInstance) {
        const oldUsr = await ctx.Model.findById(ctx.instance.id);
        ctx.instance.username = oldUsr.username;
      }
    }
    // next();
  });

  // Update role mapping
  User.observe('after save', (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updateRoleMapping().then(() => next()).catch((err) => {
        logger.error({ err }, 'Update role mapping failed');
        next();
      });
    } else {
      next();
    }
  });

  // Remove role mapping
  User.observe('before delete', (ctx, next) => {
    const context = ctx.options && ctx.options.accessToken;
    const deleteId = ctx.where.id.inq ? ctx.where.id.inq[0] : ctx.where.id;
    if (deleteId.toString() === context.userId.toString()) {
      return Promise.reject('Not allow!');
    }
    if (ctx.instance) {
      ctx.instance.updateRoleMapping(true).then(() => next()).catch((err) => {
        logger.error({ err }, 'Delete role mapping failed');
        next();
      });
    } else {
      next();
    }
  });

  // Send `Account created` mail
  const accountCreatedRenderer = loopback.template(
    path.resolve(__dirname, '../templates/account-created.ejs'),
  );
  User.observe('after save', (ctx, next) => {
    const app = User.app;

    if (
      !ctx.instance ||
      !ctx.instance.email ||
      !app.get('mail').accountCreated
    ) {
      return next();
    }

    const { Email } = app.models;
    const htmlContent = accountCreatedRenderer({
      locals: {
        user: ctx.instance,
        appUrl: `${app.get('restApiScheme')}//${app.get('restApiHost')}`,
      },
    });

    Email.send(
      {
        from: app.get('mail').sender,
        to: ctx.instance.email,
        subject: 'Ads Platform Account Created',
        text: 'Ads platform account created',
        html: htmlContent,
      },
      (err) => {
        if (err) {
          logger.error({ err }, 'Send email failed');
        } else {
          logger.info(`Email sent to ${ctx.instance.email}`);
        }
      },
    );

    return next();
  });

  const getCurrentProfile = async (req) => {
    const { accessToken: AccessToken, user: User } = req.app.models;
    let token = await Promise.resolve(Promise.promisify(AccessToken.findForRequest).call(AccessToken, req))
    if (!token) return null;
    return User.findById(token.userId);
  };

  const beforeFind = (ctx, _, next) => {
    const filter = lodash.get(ctx, 'args.filter', {});
    getCurrentProfile(ctx.req)
      .then((usr) => {
        switch (usr.profileName) {
          case 'admin': {
            return User.find({ where: { or: [{ createdBy: usr.id }, { _id: usr.id }] } })
              .then((users) => {
                console.log('users admin', JSON.stringify(users));
                filter.where = {
                  or: [
                    { _id: usr.id },
                    { createdBy: usr.id },
                    ...users.map(usrC => ({ createdBy: usrC.id }))
                  ]
                };
                ctx.args.filter = filter;
                console.log('find admin filter', JSON.stringify(filter));
                next();
              });
          }
          case 'client':
          case 'publisher':
          case 'brand': filter.where = { or: [{ createdBy: usr.id }, { _id: usr.id }] }; ctx.args.filter = filter; next(); break;
          default: next();
        }
      });
  };
  User.beforeRemote('find', beforeFind);
  User.beforeRemote('findWithTotal', beforeFind);

  // Add profile menu to getCurrentUser
  const appendProfileAndRole = (result, profileId, next) => {
    const { Profile, License } = User.app.models;
    Profile.findById(profileId, { include: 'menu' })
      .then((profile) => {
        profile = profile.toJSON();
        if (profile && profile.menu && profile.menu.tree) {
          result.menuTree = profile.menu.tree;
        }
        return Promise.all([License.find({ where: { userId: result.id } })]);
      })
      .then(([lins]) => {
        if (lins) {
          result.licenses = lins;
        }
        next();
      })
      .catch((err) => {
        logger.error({ err }, 'Get profile failed');
        next(err);
      });
  };

  User.afterRemote('findById', (ctx, user, next) => {
    const currentUserId = ctx.req.accessToken.userId.toString();
    if (currentUserId && user && currentUserId === user.id.toString()) {
      ctx.result = ctx.result.toJSON();
      appendProfileAndRole(ctx.result, user.profileId, next);
    } else {
      next();
    }
  });

  User.beforeRemote('login', (ctx, _, next) => {
    ctx.args.include = ['user'];
    next();
  });

  User.afterRemote('login', (ctx, accessToken, next) => {
    const res = ctx.res;
    if (ctx.result && ctx.result.toJSON().user.options && ctx.result.toJSON().user.options.status === false) {
      return next('confirmEmail');
    }
    if (accessToken != null) {
      if (accessToken.id != null) {
        res.cookie('access_token', accessToken.id, {
          httpOnly: true,
          signed: true,
          maxAge: 1000 * accessToken.ttl,
        });
      }
    }
    ctx.result = ctx.result.toJSON();
    const profileId = ctx.result.user.profileId;
    appendProfileAndRole(ctx.result.user, profileId, next);
  });

  User.getClientkey = async (userId) => {
    let usr = await User.findById(userId);
    let md5sum = crypto.createHash('md5').update(JSON.stringify({ name: usr.name, profileName: usr.profileName, username: usr.username, password: usr.password, email: usr.email })).digest('hex');
    let keyObj = {
      clientId: userId,
      clientkey: md5sum
    };
    await usr.updateAttribute('clientkey', md5sum);
    return keyObj;
  };
  User.remoteMethod('getClientkey', {
    accepts: [
      { arg: 'userId', type: 'string', required: true }
    ],
    http: { path: '/:userId/getClientkey', verb: 'get' },
    returns: { arg: 'keyObj', type: 'object' }
    // {arg: 'body', http: { target: 'body' }, root: true},
    // {arg: 'Content-Type', type: 'string', http: { target: 'header' }}

  });

  User.beforeRemote('register', (ctx, _, next) => {
    const app = User.app;
    const responseRecaptcha = ctx.req.body['g-recaptcha-response'];

    if (!responseRecaptcha) {
      ctx.res.status(401);
      return next(new Error());
    }

    const params = querystring.stringify({
      secret: app.get('recaptchaSecretKey'),
      response: responseRecaptcha
    });

    axios.get(`${app.get('recaptchaURL')}?${params}`).then(res => {
      if (res.data && res.data.success) {
        return next();
      } else {
        ctx.res.status(401);
        return next(new Error());
      }
    }).catch((err) => {
      next(err);
    });
  });

  User.register = async (name, phone, email, password, options, registerType, req) => {
    const { Profile, MailTemplate, MailQueue } = User.app.models;
    const existsUser = await User.findOne({ where: { or: [{ username: name }, { email }] } });
    const publisherProfile = await Profile.findOne({ where: { name: registerType }, fields: { id: 1, name: 1 } });
    delete options.authorizedRoles;

    if (existsUser) {
      if (existsUser.username === name) {
        return Promise.reject('Username exists!');
      }
      return Promise.reject('Email exists!');
    }
    options.ip = req.ipAddr;
    options.status = false;

    const obj = {
      name: `${options.lastname} ${options.firstname}`,
      username: name,
      password,
      phone,
      email,
      maxUploadSize: 10,
      rootdir: `/${name}`,
      profileId: publisherProfile.id,
      profileName: publisherProfile.name,
      type: 0,
      options,
    };

    try {
      const userCreated = await User.create(obj);
      const app = User.app;
      const code = CryptoJS.AES.encrypt(JSON.stringify({ id: userCreated.id, email: obj.email }), app.get('secretKey')).toString();
      // send email confirm
      const getmailTemplate = await MailTemplate.findOne({ where: { and: [{ type: 'confirm_email' }, { used: true }] }, fields: { id: 1 } });
      if (getmailTemplate) {
        await MailQueue.create({
          mailTemplateId: ObjectId(getmailTemplate.id),
          message: {
            to: email,
            cc: '',
            bcc: '',
            subject: `[Genex Wifi DSP Platform] Confirm Email - ${obj.name}`
          },
          locals: {
            confirmLink: `${app.get('restApiScheme')}//${app.get('appHostName')}${app.get('restApiRoot')}/verify/account/${encodeURIComponent(code)}`
          },
          status: 'approved'
        });
      }
      return Promise.resolve({ statusCode: 200, data: { status: 'created' } });
    } catch (error) {
      return Promise.reject('Register failed!');
    }
  };

  User.remoteMethod('register', {
    accepts: [
      { arg: 'name', type: 'string', required: true, description: 'name' },
      { arg: 'phone', type: 'string', required: true, description: 'Phone of user' },
      { arg: 'email', type: 'string', required: true, description: 'Email of user' },
      { arg: 'password', type: 'string', required: true, description: 'Password of user' },
      { arg: 'options', type: 'object', description: 'Other type of user' },
      { arg: 'registerType', type: 'string', description: 'profile Create' },
      { arg: 'req', type: 'object', http: { source: 'req' } }
    ],
    http: { path: '/register', verb: 'post' },
    returns: { arg: 'body', http: { target: 'body' }, root: true }
  });

  // Password-reset
  User.requestPasswordReset = async (username, email, req) => {
    const existsUser = await User.findOne({ where: { username } });
    if (!existsUser) {
      return Promise.reject('Tên đăng nhập không tồn tại');
    }

    try {
      await User.resetPassword({ email });
      return Promise.resolve({ statusCode: 200, data: { status: 'ok' } });
    } catch (error) {
      return Promise.reject('Lỗi khi reset password. Vui lòng liên hệ admin');
    }
  };

  User.remoteMethod('requestPasswordReset', {
    accepts: [
      { arg: 'username', type: 'string', required: true, description: 'username' },
      { arg: 'email', type: 'string', required: true, description: 'Email of user' },
      { arg: 'req', type: 'object', http: { source: 'req' } }
    ],
    http: { path: '/request-password-reset', verb: 'post' },
    returns: { arg: 'body', http: { target: 'body' }, root: true }
  });

  User.on('resetPasswordRequest', async (info) => {
    const app = User.app;
    const { MailTemplate, MailQueue } = User.app.models;
    const url = `${app.get('restApiScheme')}//${app.get('restApiHost')}${app.get('restApiRoot')}/users/get-reset-token`;

    try {
      // send email confirm
      const getmailTemplate = await MailTemplate.findOne({ where: { and: [{ type: 'forgot_password' }, { used: true }] }, fields: { id: 1 } });
      if (getmailTemplate) {
        await MailQueue.create({
          mailTemplateId: ObjectId(getmailTemplate.id),
          message: {
            to: info.email,
            cc: '',
            bcc: '',
            subject: '[Genex Wifi DSP Platform] Reset Password'
          },
          locals: {
            url: `${url}?access_token=${info.accessToken.id}`
          },
          status: 'approved'
        });
      }
    } catch (error) {
      console.log(error);
    }
  });

  User.afterRemote('setPassword', function (context, user, next) {
    const { AccessToken } = User.app.models;
    const app = User.app;

    const templateResponse = loopback.template(
      path.resolve(__dirname, '../templates/email-template/response-new-password.ejs'),
    );

    allowCrossOrigin(context.res);
    context.res.header('Content-Type', 'text/html');
    context.res.header('Access-Control-Request-Headers', 'text/html');
    context.res.header('X-Frame-Options', 'ALLOW-FROM SAMEORIGIN');
    context.res.send(templateResponse(
      {
        title: 'Password reset success',
        content: 'Password đã được khôi phục',
        redirectTo: `${app.get('restApiScheme')}//${app.get('restApiHost')}`,
        redirectToLinkText: 'Click vào đây để điều hướng đến trang đăng nhập',
      }
    ));
    context.res.end();

    if (context.req && context.req.accessToken && context.req.accessToken.id) {
      AccessToken.destroyAll({ _id: context.req.accessToken.id });
    }
  });

  User.getResetToken = (req, res) => {
    if (!req.accessToken) return res.status(401).send('Rất tiếc, token hết hạn hoặc không hợp lệ');
    const app = User.app;
    const templatePasswordReset = loopback.template(
      path.resolve(__dirname, '../templates/email-template/password-reset.ejs'),
    );

    allowCrossOrigin(res);
    res.header('Content-Type', 'text/html');
    res.header('Access-Control-Request-Headers', 'text/html');
    res.header('X-Frame-Options', 'ALLOW-FROM SAMEORIGIN');
    res.send(templatePasswordReset({
      redirectUrl: `${app.get('restApiScheme')}//${app.get('restApiHost')}${app.get('restApiRoot')}/users/reset-password?access_token=${req.accessToken.id}`,
    }));
    res.end();
  };

  User.remoteMethod('getResetToken', {
    description: 'Get reset token',
    accepts: [
      { arg: 'req', type: 'object', http: { source: 'req' } },
      { arg: 'res', type: 'object', http: { source: 'res' } }
    ],
    http: { path: '/get-reset-token', verb: 'get' },
    returns: { arg: 'body', http: { target: 'body' }, root: true }
  });
  // End Password-reset

  User.venueTypes = async (req, res) => {
    const app = User.app;
    try {
      const result = await axios(
        {
          method: 'GET',
          url: `${app.get('dspHost')}/api/venueTypes`
        }
      );
      if (result && result.data) {
        return { data: result.data };
      }
      return { data: [] };
    } catch (error) {
      return Promise.reject({ message: 'get venue type failed', statusCode: 500 });
    }
  };

  User.remoteMethod('venueTypes', {
    description: 'Get venue type',
    accepts: [
      { arg: 'req', type: 'object', http: { source: 'req' } },
      { arg: 'res', type: 'object', http: { source: 'res' } }
    ],
    http: { path: '/venueTypes', verb: 'get' },
    returns: { arg: 'body', http: { target: 'body' }, root: true }
  });
};
