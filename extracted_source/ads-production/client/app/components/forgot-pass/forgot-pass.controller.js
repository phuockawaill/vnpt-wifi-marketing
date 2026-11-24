import vnFl from 'assets/images/icons/vn_flag.png';
import usFl from 'assets/images/icons/usa_flag.png';

class ForgotPassCtrl {
  constructor($scope, $state, alertify, Messages, VNMessages, User) {
    this.$scope = $scope;
    this.$state = $state;
    this.alertify = alertify;
    this.User = User;

    this.errorMessage = '';
    this.credentials = {
      username: '',
      email: '',
    };
    this.vnFlUrl = vnFl;
    this.usFlUrl = usFl;
    this.isLang = 'VN';
    this.Messages = this.isLang === 'VN' ? VNMessages : Messages;
  }

  trim() {
    if (this.credentials.username) {
      this.credentials.username = this.credentials.username.latinize();
      this.credentials.username = this.credentials.username.replace(/\s/g, '');
    }
  }

  reset(credentials, validForm) {
    if (!validForm) {
      this.resetPassForm.username.$setDirty();
      this.resetPassForm.username.$validate();
      this.resetPassForm.email.$setDirty();
      this.resetPassForm.email.$validate();
      return;
    }

    this.errorMessage = '';

    this.User.requestPasswordReset({
      username: credentials.username,
      email: credentials.email,
    }).$promise.then(() => {
      this.alertify.success(this.Messages.createSuccess);
      setTimeout(() => this.$state.go('login'), 800);
    }).catch((err) => {
      this.alertify.error(this.Messages.createFailed);
      if (err && err.data && err.data.error) {
        this.errorMessage = err.data.error.message;
      }
    });
  }
}

export default angular
  .module('app.forgot-pass.controller', [])
  .controller('ForgotPassCtrl', ForgotPassCtrl);
