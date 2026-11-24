import angular from 'angular';

function routes($stateProvider) {
    'ngInject';

    $stateProvider
        .state('admin.monetize-out', {
            url: '/monetize-out',
            templateProvider: $templateCache => Promise.all([
                import('./monetize-out.pug'),
            ]).spread((template) => {
                return template;
            }),
            controller: 'MonetizeOutCtrl as vm',
            resolve: {
                loadCtrl: $ocLazyLoad => Promise
                    .all([
                        import('../../extensions/directives/select2'),
                        import('./monetize-out.controller'),
                    ])
                    .spread((select2, module) => {
                        $ocLazyLoad.load({ name: module.name });
                        return module.controller;
                    }),
                locations: function (Location, User, currentUser) {
                    let query = {};
                    if (currentUser.profileName === 'admin') {
                        return User.find().$promise
                            .then((users) => Location.find({ filter: { where: { "createdBy": { "inq": users.map(usr => usr.id).concat(currentUser.id) } } } }).$promise)
                    } else {
                        if (currentUser.profileName !== 'superadmin') {
                            query = { where: { "createdBy": currentUser.id } };
                        }
                        return Location.find({ filter: query }).$promise
                    }
                },
                shares: function (PublisherShare, currentUser) {
                    let query = { where: { "userId": currentUser.id } };
                    return PublisherShare.find({ filter: query }).$promise;
                },
                currentUser: AuthResolver => AuthResolver.getCurrentUser(),
            }
        });
}

export default angular
    .module('app.monetize-out.routing', [])
    .config(routes);
