export default function ($rootScope, AuthEvents, User) {
  'ngInject';

  return User.getCurrent().$promise
    .then((user) => {
      $rootScope.currentUser = user;
      $rootScope.$broadcast(AuthEvents.currentUserUpdated, user);
    })
    .catch((err) => {
    });
}
