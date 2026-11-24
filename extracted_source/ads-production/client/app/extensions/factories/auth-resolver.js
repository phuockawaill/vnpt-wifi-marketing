class AuthResolver {
  constructor($rootScope, Promise, User) {
    this.$rootScope = $rootScope;
    this.Promise = Promise;
    this.User = User;
  }

  getCurrentUser() {
    if (this.User.getCachedCurrent()) {
      return this.User.getCachedCurrent();
    }
    return this.Promise((resolve, reject) => {
      const unwatch = this.$rootScope.$watch('currentUser', (currentUser) => {
        if (angular.isDefined(currentUser)) {
          if (currentUser) {
            resolve(currentUser);
          } else {
            reject();
          }
          unwatch();
        }
      });
    });
  }

  static factory($rootScope, $q, User) {
    'ngInject';

    AuthResolver.instance = new AuthResolver($rootScope, $q, User);
    return AuthResolver.instance;
  }
}

export default angular
  .module('app.factory.auth-resolver', [])
  .factory('AuthResolver', AuthResolver.factory);
