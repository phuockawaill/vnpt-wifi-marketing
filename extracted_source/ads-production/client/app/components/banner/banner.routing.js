import angular from 'angular';
import moment from 'moment';

function routes($stateProvider) {
    'ngInject';

    $stateProvider
        .state('admin.banner', {
            url: '/banner',
            templateProvider: $templateCache => Promise.all([
                import(/* webpackChunkName: "banner" */ './banner-fm.pug'),
                import(/* webpackChunkName: "banner" */ './banner-preview.pug'),
                import(/* webpackChunkName: "banner" */ './banner-gen-fm.pug'),
                import(/* webpackChunkName: "banner" */ './banner-fm-campaign.pug'),
                import(/* webpackChunkName: "banner" */ './banner.pug'),
            ]).spread((fmTemplate, previewTemplate, genFmtemplate, fmCampaign, template) => {
                $templateCache.put('banner/banner-fm', fmTemplate);
                $templateCache.put('banner/banner-preview', previewTemplate);
                $templateCache.put('banner/banner-gen-fm', genFmtemplate);
                $templateCache.put('banner/banner-fm-campaign', fmCampaign);
                return template;
            }),
            params: { quick: false, is_preview: false, created: moment().valueOf(), previewObj: {}, guidance: false },
            controller: 'BannerCtrl as vm',
            resolve: {
                loadCtrl: $ocLazyLoad => Promise
                    .all([
                        import('../../extensions/init/ag-grid'),
                        import(/* webpackChunkName: "banner" */ './banner.controller'),
                    ])
                    .spread((agGrid, module) => {
                        $ocLazyLoad.load({ name: module.name });
                        return module.controller;
                    }),
                banners: (Banner, User, currentUser) => {
                    // check banner to find
                    let query = {};
                    if (currentUser.profileName === 'admin') {
                        return User.find().$promise
                            .then((users) => Banner.find({
                                filter: {
                                    where: {
                                        "or": [
                                            { "createdBy": currentUser.id },
                                            ...users.map(usr => ({ "createdBy": usr.id }))
                                        ]
                                    }
                                }
                            }).$promise)
                    } else {
                        if (currentUser.profileName !== 'superadmin') {
                            query = { where: { "createdBy": currentUser.id } };
                        }
                        return Banner.find({ filter: query }).$promise
                    }
                },
                forms: (FormGenerate, User, currentUser) => {
                    //check banner to find
                    let query = {};
                    if (currentUser.profileName === 'admin') {
                        return User.find().$promise
                            .then((users) => FormGenerate.find({
                                filter: {
                                    where: {
                                        "or": [
                                            { "createdBy": currentUser.id },
                                            ...users.map(usr => ({ "createdBy": usr.id }))
                                        ]
                                    }
                                }
                            }).$promise)
                    } else {
                        if (currentUser.profileName !== 'superadmin') {
                            query = { where: { "createdBy": currentUser.id } };
                        }
                        return FormGenerate.find({ filter: query }).$promise
                    }
                },
                campaigns: (currentUser, User, Campaign) => {
                    let query = {};
                    if (currentUser.profileName === 'admin') {
                        return User.find().$promise
                            .then((users) => Campaign.find({
                                filter: {
                                    where: {
                                        "or": [
                                            { "createdBy": currentUser.id },
                                            ...users.map(usr => ({ "createdBy": usr.id }))
                                        ]
                                    }
                                }
                            }).$promise)
                    } else {
                        if (currentUser.profileName !== 'superadmin') {
                            query = { where: { "createdBy": currentUser.id } };
                        }
                        return Campaign.find({ filter: query }).$promise
                    }
                },
                templates: (TemplateBase) => {
                    let query = {};
                    return TemplateBase.find({ filter: query }).$promise
                },
                currentUser: AuthResolver => AuthResolver.getCurrentUser(),

                ages: (currentUser, CommonData) => CommonData.ageCategories(true),
                genders: (currentUser, CommonData) => CommonData.genderCategories(true),
                devices: (currentUser, CommonData) => CommonData.deviceCategories(true),
                oses: (currentUser, CommonData) => CommonData.osCategories(true),
                incomes: (currentUser, CommonData) => CommonData.incomeCategories(true),
                websiteCats: CommonData => CommonData.websiteCategories(true),
            },
        });
}

export default angular
    .module('app.banner.routing', [])
    .config(routes);
