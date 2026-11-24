export default function ($httpProvider) {
  'ngInject';

  $httpProvider.interceptors.push('AuthInterceptor');
}
