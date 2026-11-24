import angular from 'angular';

export default angular
  .module('app.config', [])
  .factory('AppConfig', () => require('lib/config.json'));
