class AuthService {
  constructor($rootScope, AuthEvents, user) {
    this.$rootScope = $rootScope;
    this.AuthEvents = AuthEvents;
    this.User = user;
  }

  login(credentials, rememberMe = false) {
    return this.User
      .login({ rememberMe, include: 'user' }, credentials).$promise
      .then((session) => {
        this.$rootScope.$broadcast(this.AuthEvents.loginSuccess, session);
        this.$rootScope.$broadcast(this.AuthEvents.currentUserUpdated, session.user);
        return session.user;
      })
      .catch((err) => {
        this.$rootScope.$broadcast(this.AuthEvents.loginFailed, err);
        throw err;
      });
  }

  logout() {
    return this.User
      .logout().$promise
      .then(() => {
        this.$rootScope.$broadcast(this.AuthEvents.logoutSuccess);
      });
  }

  isAuthenticated() {
    return this.User.isAuthenticated();
  }

  isAuthorized(authorizedRoles) {
    if (!angular.isArray(authorizedRoles)) {
      authorizedRoles = [authorizedRoles];
    }
    return (this.isAuthenticated()/* && authorizedRoles.indexOf(this.User.getCu) !== -1*/);
  }

  static factory($rootScope, AuthEvents, User) {
    'ngInject';

    AuthService.instance = new AuthService($rootScope, AuthEvents, User);
    return AuthService.instance;
  }
}

export default angular
  .module('app.factory.auth-service', [])
  .factory('AuthService', AuthService.factory);
