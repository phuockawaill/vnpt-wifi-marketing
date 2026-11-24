import vnFl from 'assets/images/icons/vn_flag.png';
import usFl from 'assets/images/icons/usa_flag.png';

class LoginCtrl {
  constructor(AuthService, $scope, alertify, Messages, VNMessages) {
    this.$scope = $scope;
    this.alertify = alertify;
    this.AuthService = AuthService;

    this.credentials = {
      username: '',
      password: '',
    };
    this.errorMessage = '';
    this.warningMessage = '';
    this.showConfirm = false;
    this.confirmForm = false;
    this.notifyConfirm = false;
    this.vnFlUrl = vnFl;
    this.usFlUrl = usFl;
    this.isLang = 'VN';
    this.Messages = this.isLang === 'VN' ? VNMessages : Messages;
  }

  login(credentials) {
    this.errorMessage = null;
    this.AuthService.login(credentials)
      .then((user) => {
        if (this.$scope.$parent.app) {
          this.$scope.$parent.app.setCurrentUser(user);
        }
      })
      .catch((err) => {
        if (err && err.data && err.data.error) {
          if (err.data.error.message === 'confirmEmail') {
            console.log('show confirm email!');
            this.warningMessage = 'Your account is not activated yet, please check mail and click confirm button to activate!';
            // this.showConfirm = true;
          } else {
            this.errorMessage = err.data.error.message;
          }
        }
      });
  }

  getConfirm() {
    // TO-DO api send confirm email
    console.log('input confirm');
    this.credentials = {
      username: '',
      password: ''
    };
    this.errorMessage = '';
    this.warningMessage = '';
    this.showConfirm = false;
    this.alertify.success('Your confirm email sent!');
    this.notifyConfirm = true;
  }
}

export default angular
  .module('app.login.controller', [])
  .controller('LoginCtrl', LoginCtrl);
