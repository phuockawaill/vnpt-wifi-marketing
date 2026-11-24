import angular from 'angular';
import 'angular-ui-notification';

export default angular
  .module('app.notification', ['ui-notification'])
  .config(function (NotificationProvider) {
    'ngInject';
    NotificationProvider.setOptions({
      delay: 5000,
      startTop: 20,
      startRight: 10,
      verticalSpacing: 20,
      horizontalSpacing: 20,
      positionX: 'left',
      positionY: 'bottom'
    });
  });
