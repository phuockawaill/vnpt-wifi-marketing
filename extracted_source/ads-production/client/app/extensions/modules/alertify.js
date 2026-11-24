import angular from 'angular';
import 'alertify.js/dist/js/ngAlertify';

export default angular
  .module('app.alertify', ['ngAlertify'])
  .run((alertify) => {
    'ngInject';

    alertify.logPosition('bottom right');
  });
