export default function ($rootScope, $state, AuthEvents, User) {
  'ngInject';

  $rootScope.$on('$stateChangeStart', (event, next) => {
    const authenticated = User.isAuthenticated();

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // is Mobile
      if (next.name === 'register.forgot-pass' && !authenticated) {
        return;
      }
      if (next.name === 'register.register-user' && !authenticated) {
        return;
      }
      if (next.name === 'register.register-trial' && !authenticated) {
        return;
      }
      if (next.name === 'register.forgot-pass' && authenticated) {
        event.preventDefault();
        $state.go('report.dashboard');
      }
      if (next.name === 'register.register-user' && authenticated) {
        event.preventDefault();
        $state.go('report.dashboard');
      }
      if (next.name === 'register.register-trial' && authenticated) {
        event.preventDefault();
        $state.go('report.dashboard');
      }
      if (next.name === 'login' && !authenticated) {
        return;
      }
      if (next.name === 'login' && authenticated) {
        event.preventDefault();
        $state.go('report.dashboard');
      }

      if (!authenticated) {
        event.preventDefault();
        // user is not allowed
        $rootScope.$broadcast(AuthEvents.notAuthenticated);
        return;
      }

      if (next.name === 'report.dashboard' && authenticated) {
        return;
      } else {
        event.preventDefault();
        $state.go('report.dashboard');
      }

      return;
    }

    if (next.name === 'register.forgot-pass' && !authenticated) {
      return;
    }
    if (next.name === 'register.register-user' && !authenticated) {
      return;
    }
    if (next.name === 'register.register-trial' && !authenticated) {
      return;
    }
    if (next.name === 'register.forgot-pass' && authenticated) {
      event.preventDefault();
      $state.go('report.dashboard');
    }
    if (next.name === 'register.register-user' && authenticated) {
      event.preventDefault();
      $state.go('report.dashboard');
    }
    if (next.name === 'register.register-trial' && authenticated) {
      event.preventDefault();
      $state.go('report.dashboard');
    }
    if (next.name === 'login' && !authenticated) {
      return;
    }
    if (next.name === 'login' && authenticated) {
      event.preventDefault();
      $state.go('report.dashboard');
    }

    if (!authenticated) {
      event.preventDefault();
      // user is not allowed
      $rootScope.$broadcast(AuthEvents.notAuthenticated);
    }
  });
}
