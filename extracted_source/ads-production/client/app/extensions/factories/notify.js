function Notify() {
  this.success = (message) => {
    $.notify(message, 'success');
  };

  this.warning = (message) => {
    $.notify(message, 'warning');
  };

  this.error = (message) => {
    $.notify(message, 'error');
  };

  this.info = (message) => {
    $.notify(message, 'info');
  };
}

export default angular
  .module('app.factory.notify', [])
  .factory('Notify', Notify);
