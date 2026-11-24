export default function ($rootScope, $location, $state, AuthEvents) {
  'ngInject';

  const goLogin = () => {
    if ($state.current && $state.current.name !== 'login') {
      $state.go('login');
    }
  };

  $rootScope.$on(AuthEvents.loginFailed, () => {
    console.log('login failed');
  });
  $rootScope.$on(AuthEvents.loginSuccess, () => {
    $state.go('report.dashboard');
  });
  $rootScope.$on(AuthEvents.logoutSuccess, goLogin);
  $rootScope.$on(AuthEvents.notAuthenticated, goLogin);
  $rootScope.$on(AuthEvents.notAuthorized, () => {
    console.log('not authorized');
  });
  $rootScope.$on(AuthEvents.sessionTimeout, goLogin);
}
