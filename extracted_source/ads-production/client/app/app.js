import 'expose-loader?jQuery!expose-loader?$!expose-loader?jquery!jquery';
import 'expose-loader?Promise!bluebird';
import 'bootstrap';
// import 'bootstrap.native';

import angular from 'angular';
import 'angular-touch';
import 'angular-resource';
import 'angular-ui-router';
import 'oclazyload';
import './extensions/modules/extend';

import 'assets/assets.js';

// JADE TEMPLATE
const requireAll = (r) => { r.keys().forEach(r); };
requireAll(require.context('./components/layout/', true, /\.(template|ng).(jade|pug)$/));
Promise.config({
  warnings: false,
});

export default angular
  .module('app', [
    'ngTouch',
    'ui.router',
    'oc.lazyLoad',

    // global
    require('./extensions/extensions').name,
    require('./app.routing').name,
    require('./components/login/login.controller').name,
    require('./components/application/application.controller').name,
    require('./components/quick-setup/quick.controller').name,
    require('../lib/lb-services'),
  ])
  .config(require('./extensions/config/inject-auth'))
  .run(require('./extensions/init/get-current-user'))
  .run(require('./extensions/init/access-control'))
  .run(require('./extensions/init/access-control-handle'));
