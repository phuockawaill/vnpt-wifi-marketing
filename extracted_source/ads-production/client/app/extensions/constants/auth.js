export default angular
  .module('app.constant.auth', [])
  .constant('AuthEvents', {
    loginSuccess: 'auth-login-success',
    loginFailed: 'auth-login-failed',
    logoutSuccess: 'auth-logout-success',
    sessionTimeout: 'auth-session-timeout',
    notAuthenticated: 'auth-not-authenticated',
    notAuthorized: 'auth-not-authorized',
    currentUserUpdated: 'current-user-updated',
    creativeQuickSetup: 'creative-quick-setup',
  })
  .constant('ProfileConst', {
    all: '*',
    admin: 'admin',
    advertiser: 'advertiser',
    publisher: 'publisher',
    client: 'client',
  });
