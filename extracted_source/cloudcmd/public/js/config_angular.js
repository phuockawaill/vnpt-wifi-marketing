angular.module('app', ['ngNotify'])
    .controller('AppCtrl', ['$rootScope', '$scope', '$http', 'ngNotify', function ($rootScope, $scope, $http, ngNotify) {
        $scope.users = [];
        $scope.updater = false;
        $scope.title = '';
        $scope.register = {
            isAdmin: 0
        };

        $scope.notify = function (title, type) {
            ngNotify.set(title, {
                position: 'bottom',
                type: type,
            });
        };

        $scope.restApi = function (method, url, data) {
            return $http({
                headers: { 'Content-Type': 'application/json' },
                method: method,
                url: '/api/users/' + url,
                data: data
            })
        };

        $scope.findAllUser = function () {
            $scope.restApi('GET', '')
                .then(function (data) {
                    $scope.users = data.data;
                })
                .catch(function (err) {
                    console.log(err);
                });
        };

        $scope.findAllUser();

        $scope.newUser = function () {
            $scope.title = 'New User';
            $scope.register = {};
            $scope.updater = false;
        };

        $scope.createUser = function (register) {
            register.type = register.isAdmin
            if (register.isAdmin == undefined || register.isAdmin == false) { register.type = 0; }

            $scope.restApi('POST', '', register)
                .then(function (data) {
                    $scope.register = {};
                    $scope.findAllUser();
                    $scope.notify('Add new user success', 'success');
                })
                .catch(function (err) {
                    $scope.notify('Add new user error', 'error');
                });
        };

        $scope.editUser = function (e) {
            $scope.title = 'Edit User';
            var index = _.findIndex($scope.users, function (item) {
                return item.id == e.id;
            });

            if (index != -1) {
                $scope.register = $scope.users[index];
                $scope.updater = true;
            }
        };

        $scope.updateUser = function (register) {
            register.type = register.isAdmin
            if (register.isAdmin == undefined || register.isAdmin == false) { register.type = 0; }
            var userId = register.id;

            $scope.restApi('PATCH', userId, register)
                .then(function (data) {
                    $scope.register = {};
                    $('#myModal').modal('hide');
                    $scope.findAllUser();
                    $scope.notify('Update user success', 'success');
                })
                .catch(function (err) {
                    $scope.notify('Update user error', 'error');
                });
        };

        $scope.deleteUser = function (u) {
            if (!confirm('Do you want to delete user ' + u.username + '?')) {
                return;
            }

            var index = _.findIndex($scope.users, function (item) {
                return item.id == u.id;
            });

            $scope.restApi('DELETE', u.id)
                .then(function (data) {
                    if (index != -1) {
                        $scope.users.splice(index, 1);
                        $scope.notify('Delete user ' + u.username + ' success', 'success');
                    }
                })
                .catch(function (err) {
                    $scope.notify('Delete user ' + u.username + ' error', 'error');
                });
        };
    }]);

