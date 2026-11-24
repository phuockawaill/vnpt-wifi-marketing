class AuthInterceptor {
  constructor($rootScope, Promise, AuthEvents, LoopBackAuth) {
    this.responseError = (response) => {
      switch (response.status) {
        case 401:
          LoopBackAuth.clearUser();
          LoopBackAuth.clearStorage();
          $rootScope.$broadcast(AuthEvents.notAuthenticated, response);
          break;
        case 403:
          $rootScope.$broadcast(AuthEvents.notAuthorized, response);
          break;
        case 419:
        case 440:
          LoopBackAuth.clearUser();
          LoopBackAuth.clearStorage();
          $rootScope.$broadcast(AuthEvents.sessionTimeout, response);
          break;
        default:
          break;
      }
      return Promise.reject(response);
    };
  }

  static factory($rootScope, $q, AuthEvents, LoopBackAuth) {
    'ngInject';

    AuthInterceptor.instance = new AuthInterceptor($rootScope, $q, AuthEvents, LoopBackAuth);
    return AuthInterceptor.instance;
  }
}

export default angular
  .module('app.factory.auth-interceptor', [])
  .factory('AuthInterceptor', AuthInterceptor.factory);
