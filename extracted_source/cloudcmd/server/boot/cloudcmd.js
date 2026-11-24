const path = require('path');
const fse = require('fs-extra');
const cloudcmd = require('cloudcmd');
const cookieParser = require('cookie-parser');
const io = require('socket.io');

const currentUser = require('../middleware/current-user');

function bootstrap(app) {
  const appConfig = app.get('cloudcmd');
  const { mountPath, rootDir } = appConfig;

  const socket = io(app.server, { path: `${mountPath}/socket.io` });

  const clientConfig = {
    prefix: mountPath,
    editor: appConfig.editor,
    packer: appConfig.packer,
    diff: true,
    localStorage: true,
    buffer: true,
    dirStorage: false,
    cache: true,
    showKeysPanel: true,
    progress: true,
    htmlDialogs: true,
    configDialog: true,
    onePanelMode: true,
    resourceUrl: appConfig.resourceUrl,
    resourcePath: appConfig.resourcePath,
  };
  const config = Object.assign(
    {
      zip: true,
      minify: false,
      online: true,
      open: false,
      console: true,
      terminal: false,
    },
    clientConfig,
  );

  // Socket auth
  const socketCookieParser = cookieParser(app.get('cookieSecret'));
  socket.use((connection, next) =>
    socketCookieParser(connection.request, null, next),
  );

  const socketCurrentUser = currentUser();
  socket.use((connection, next) => {
    const req = connection.request;
    req.app = app;
    req.header = headerName => req.headers[headerName];
    return socketCurrentUser(req, null, () => {
      if (!req.user) {
        return next({ statusCode: 401, code: 'Unauthenticated' });
      }
      return next();
    });
  });

  // Define cloudcmd phase that come right after files phase
  app.defineMiddlewarePhases(['files', 'cloudcmd']);
  const addMiddleware = app.middleware.bind(app, 'cloudcmd');

  // Rewrite URL for fs APIs
  const fsApiPath = '/api/v1/fs';

  const resourceMiddleware = app.loopback.static(rootDir);
  addMiddleware(appConfig.resourcePath, (req, res, next) => {
    req.url = req.url.replace(appConfig.resourcePath, '');
    resourceMiddleware(req, res, next);
  });

  // Require auth & ensure user's dir exists
  addMiddleware(mountPath, (req, res, next) => {
    if (!req.user || (req.user && req.query.userId)) {
      if (req.path.indexOf(fsApiPath) !== -1) {
        return res.status(401).json({ message: 'Unauthenticated cloudcmd' });
      }
      if(req.query.userId){
          return res.render('login_query.pug');
      } else {
          return res.render('login.pug');
      }
    }
    const fsPath = path.join(rootDir, req.user.rootdir);
    return fse
      .ensureDir(fsPath)
      .then(() => {
        next();
      })
      .catch(() => next());
  });

  // Take control index render
  addMiddleware(mountPath, (req, res, next) => {
    const typeUser = req.user.type;
    const reqPath = req.path || '/';
    if (reqPath === '/' || reqPath.indexOf('/fs') === 0) {
      const filePath = decodeURIComponent(reqPath.replace('/fs', ''));
      res.render('index.pug', {
        mountPath,
        path: filePath,
        config: JSON.stringify(clientConfig),
        type: typeUser,
      });
      return;
    }
    next();
  });

  // Replace render template
  const templatePath = '/tmpl/fs/file.hbs';
  const template = `<{{ tag }} {{ attribute }}class="{{ className }} table">
    <span data-name="js-type" class="column mini-icon {{ type }}"></span>
    <span data-name="js-name" class="column name reduce-text">{{ name }}</span>
    <span data-name="js-copy-link" class="column copy-url reduce-text">
      <span>copy</span>
      <button><i class="fa fa-link"></i></button>
    </span>
    <span data-name="js-size" class="column size reduce-text">{{ size }}</span>
    <span data-name="js-date" class="column date reduce-text">{{ date }}</span>
    <span data-name="js-owner" class="column owner reduce-text">{{owner}}</span>
    <span data-name="js-mode" class="column mode reduce-text">{{ mode }}</span>
  </{{ tag }}>`;
  addMiddleware(mountPath, (req, res, next) => {
    const isTemplate = req.path.indexOf(templatePath) > -1;
    if (isTemplate) {
      return res.status(200).send(template);
    }
    return next();
  });

  // Hide server specific config
  const configPath = '/api/v1/config';
  addMiddleware(mountPath, (req, res, next) => {
    const isConfig = req.path.indexOf(configPath) > -1;
    if (isConfig) {
      return res.status(200).json(clientConfig);
    }
    return next();
  });

  // Rewrite actual path
  addMiddleware(mountPath, (req, res, next) => {
    const isApi = req.path.indexOf(fsApiPath) > -1;
    if (isApi) {
      const actualPath = req.user.rootdir;
      if (req.path.indexOf(actualPath) < 0) {
        req.url = req.url.replace(req.path, `${fsApiPath}${actualPath}`);
      }
    }
    next();
  });

  addMiddleware(mountPath, (req, res, next) => {
    const isDownload = req.path.indexOf('/api/v1/pack/');
    if (isDownload > -1 && req.method === 'GET') {
      res.removeHeader('X-Content-Type-Options');
      res.removeHeader('X-Download-Options');
    }
    next();
  });

  // Limit upload file size
  const onUploadErr = (req, res, content) => {
    req.once('end', () => {
      const filePath = req.path.replace(fsApiPath, '');
      return fse.remove(decodeURIComponent(path.resolve(rootDir, filePath)));
    });
    res.status(403).send(content);
  };
  let maxFileSize = appConfig.maxFileSize * 1024 * 1024;
  const { Configuration } = app.models;
  addMiddleware(mountPath, (req, res, next) => {
    if (req.path.indexOf(fsApiPath) > -1 && req.method === 'PUT') {
        Configuration.findOne({
          where: { key: 'maxFileSize' },
        }).then((cof)=>{
            if(cof){
                maxFileSize = Number(cof.value) * 1024 * 1024;
            }
            const listen = (oldHandler) => {
              req.removeListener('data', oldHandler);

              let dataSize = 0;
              let overLimit = false;

              req.on('data', (chunk) => {
                if (overLimit) return;

                dataSize += chunk ? chunk.length : 0;
                if (dataSize > maxFileSize) {
                  overLimit = true;
                  onUploadErr(req, res, 'File is too big');
                  return;
                }
                oldHandler(chunk);
              });
            };

            req.on('newListener', function handler(event, dataHandler) {
              if (event !== 'data') return;
              req.removeListener('newListener', handler);
              process.nextTick(() => {
                listen(dataHandler);
              });
            });
        });
    }
    next();
  });
  //delete catch
  addMiddleware(mountPath, async (req, res, next) => {
      if(req.method === 'DELETE'){
          console.log('DELETE FILE', req.path);
      }
      next();
  });
  const middlewares = cloudcmd({
    socket,
    config: Object.assign({ root: rootDir }, config),
  });

  // Replace last static middleware with loopback#static
  // that allow next on 404
  const staticIndex = middlewares.length - 1;
  const cloudcmdRoot = require
    .resolve('cloudcmd')
    .replace('/legacy/server/cloudcmd.js', '');
  middlewares.splice(staticIndex, 1, app.loopback.static(cloudcmdRoot));

  // Set all cloudcmd middlewares
  middlewares.forEach(mid => addMiddleware(mid));
}

module.exports = function cmd(app) {
  app.on('started', () => {
    bootstrap(app);
  });
};
