import './quick.less';
import fmQuick from './quick.pug';
import _filter from 'lodash/filter';
import lodash from 'lodash';
import moment from 'moment';
import Swal from 'sweetalert2';

const regexMAC = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;

class QuickCtrl {
    constructor(
        $scope,
        $rootScope,
        $state,
        AuthService,
        AuthEvents,
        $templateCache,
        User,
        Banner,
        Campaign,
        Location,
        alertify,
        Messages,
        VNMessages,
        Profile,
        SelectOption,
        CommonData,
    ) {
        'ngInject';
        this.Profile = Profile;
        this.Location = Location;
        this.User = User;
        this.Banner = Banner;
        this.Campaign = Campaign;
        this.SelectOption = SelectOption;
        this.CommonData = CommonData;
        this.AuthService = AuthService;

        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            this.isMobile = true;
        }

        // =======
        $templateCache.put('quick-setup', fmQuick);
        this.$rootScope = $rootScope;
        this.$scope = $scope;
        this.$state = $state;
        this.alertify = alertify;
        this.Messages = this.$rootScope.isLang === 'VN' ? VNMessages : Messages;

        // =======
        this.showLocationGroup = true;
        this.is_locationGroup = '';
        this.showCreativeAds = true;
        this.is_creativeAds = '';

        // =======
        this.step = 'location';
        this.stepCount = 1;
        this.mapStep = [
            { value: 1, text: 'location' },
            { value: 2, text: 'locationGroup' },
            { value: 3, text: 'creativeAds' },
            { value: 4, text: 'campaign' },
            { value: 5, text: 'summary' }
        ];

        // =======
        this.currentUser = null;
        this.createdLocationGr = null;
        this.locationGroups = [];
        this.accountBrands = [];
        this.profiles = [];
        this.banners = [];

        // == location
        this.selectCity = {
            width: '100%',
            placeholder: this.$rootScope.isLang === 'VN' ? 'Chọn Thành phố/Tỉnh *' : 'Pick a city/province',
            data: []
        };
        this.selectDistrict = {
            width: '100%',
            placeholder: this.$rootScope.isLang === 'VN' ? 'Chọn Quận/Huyện *' : 'Pick a district',
            data: []
        };

        // == campaign
        this.dateOptions = {
            singleDatePicker: true,
            timePicker: true,
            timePicker24Hour: true,
            timePickerSeconds: false,
            showDropdowns: true,
            locale: { format: 'MMM DD, YYYY HH:mm' },
        };

        // == sum obj
        this.quickObj = {
            locationId: null,
            locationName: '',
            locationCityId: null,
            locationCityName: '',
            locationDistrictId: null,
            locationDistrictName: '',
            locationAddress: '',


            locationGrName: '',
            locationGrSelect: null,
            locationGrSelectName: '',

            creativeAdsSelect: null,
            creativeAdsSelectName: '',
            creativeAdsId: null,
            creativeAdsName: '',


            campaignName: '',
            campaignLandingPageUrl: '',
            campaignScheduleFrom: null,
            campaignScheduleTo: null,


            apName: '',
            apMacLan: '',
            apMac: '',
            apMac5: '',
        };

        // == general
        $rootScope.$on(AuthEvents.currentUserUpdated, (event, currentUser) => {
            this.currentUser = currentUser;
            this.init();
        });

        $rootScope.$on(AuthEvents.logoutSuccess, () => {
            this.currentUser = null;
        });

        $rootScope.$on(AuthEvents.creativeQuickSetup, (event, creativeAds) => {
            if (creativeAds) {
                this.quickObj.creativeAdsId = creativeAds.id ? creativeAds.id : null;
                this.quickObj.creativeAdsName = creativeAds.name ? creativeAds.name : '';
            }
        });
    }

    async get_locationGroup() {
        const query = { where: { type: 'location_category' } };

        if (this.currentUser.profileName === 'admin') {
            const users = await this.User.find({ filter: { where: { or: [{ createdBy: this.currentUser.id }, { _id: this.currentUser.id }] } } }).$promise;
            query.where = Object.assign({}, query.where, { createdBy: { inq: users.map(usr => usr.id).concat(this.currentUser.id) } });
        } else if (this.currentUser.profileName !== 'superadmin') {
            query.where = Object.assign({}, query.where, { createdBy: this.currentUser.id });
        }

        this.SelectOption
            .find({ filter: query }).$promise
            .then((locationGroups) => {
                if (locationGroups.length) {
                    this.locationGroups = locationGroups.map(item => item.toJSON());
                    this.quickObj.locationGrSelect = locationGroups[0].id ? locationGroups[0].id : null;
                }
            });
    }

    async get_brand() {
        return this.User.find().$promise;
    }

    async get_cities() {
        return await this.CommonData.cities();
    }

    async get_profiles() {
        return await this.Profile.find().$promise;
    }

    async get_banners() {
        let query = {};
        if (this.currentUser.profileName === 'admin') {
            return this.User.find({ filter: { where: { or: [{ createdBy: this.currentUser.id }, { _id: this.currentUser.id }] } } }).$promise
                .then((users) => this.Banner.find({
                    filter: {
                        where: {
                            or: [
                                { createdBy: this.currentUser.id },
                                ...users.map(usr => ({ createdBy: usr.id }))
                            ]
                        }
                    }
                }).$promise)
        } else {
            if (this.currentUser.profileName !== 'superadmin') {
                query = { where: { createdBy: this.currentUser.id } };
            }
            return this.Banner.find({ filter: query }).$promise
        }
    }

    async init() {
        const [, brands, cities, profiles, banners] = await Promise.all([
            this.get_locationGroup(),
            this.get_brand(),
            this.get_cities(),
            this.get_profiles(),
            this.get_banners(),
        ]);

        this.accountBrands = brands;
        this.accountBrands = this.accountBrands.filter(item => item.profileName === 'brand');
        this.accountBrands = this.accountBrands.map(item => item.toJSON());

        this.selectCity.data = cities;
        this.selectCity.data = this.selectCity.data.map(item => item.toJSON());

        this.profiles = profiles.map(item => item.toJSON());
        this.banners = banners.map(item => item.toJSON());
        this.quickObj.creativeAdsSelect = (this.banners.length && this.banners[0].id) ? this.banners[0].id : null;
    }

    standardizeMac(mac) {
        return mac ? mac.replace(/\s/g, '').toUpperCase() : "";
    }

    validateApMac({ macLan, mac, mac5 }) {
        if (macLan && !regexMAC.test(macLan.toUpperCase())) {
            return 'Mac MAC LAN wrong format!';
        }
        if (mac && !regexMAC.test(mac.toUpperCase())) {
            return 'Mac MAC 2.4GHz wrong format!';
        }
        if (mac5 && !regexMAC.test(mac5.toUpperCase())) {
            return 'Mac MAC 5.0GHz wrong format!';
        }
        if (mac && macLan) {
            if (mac.substr(0, 15) !== macLan.substr(0, 15)) {
                return 'LAN and 2.4GHz MAC not match in an AP!';
            }
            if (mac === macLan) {
                return 'LAN and 2.4GHz MAC require not match!';
            }
        }
        if (mac5 && macLan) {
            if (mac5.substr(0, 15) !== macLan.substr(0, 15)) {
                return 'LAN and 5.0GHz MAC not match in an AP!';
            }
            if (macLan === mac5) {
                return 'LAN and 5.0GHz MAC require not match!';
            }
        }
        if (mac && mac5) {
            if (mac.substr(0, 15) !== mac5.substr(0, 15)) {
                return '2.4GHz and 5.0GHz MAC not match in an AP!';
            }
            if (mac === mac5) {
                return '2.4GHz and 5.0GHz MAC require not match!';
            }
        }
        return 0;
    }

    toogleExpandLicense() {
        $('#quickFmEdit').modal('hide');
        $('#fmExpandLicense').modal();
    }

    setupQuick() {
        this.showLocationGroup = true;
        this.is_locationGroup = '';
        this.showCreativeAds = true;
        this.is_creativeAds = '';

        this.step = 'location';
        this.stepCount = 1;

        lodash.set(this.quickObj, 'locationId', '');
        lodash.set(this.quickObj, 'locationName', '');
        lodash.set(this.quickObj, 'locationCityId', null);
        lodash.set(this.quickObj, 'locationCityName', '');
        lodash.set(this.quickObj, 'locationDistrictId', null);
        lodash.set(this.quickObj, 'locationDistrictName', '');
        lodash.set(this.quickObj, 'locationAddress', '');

        lodash.set(this.quickObj, 'locationGrName', '');
        lodash.set(this.quickObj, 'locationGrSelect', ((this.locationGroups.length && this.locationGroups[0].id) ? this.locationGroups[0].id : null));
        lodash.set(this.quickObj, 'locationGrSelectName', '');

        lodash.set(this.quickObj, 'creativeAdsSelect', ((this.banners.length && this.banners[0].id) ? this.banners[0].id : null));
        lodash.set(this.quickObj, 'creativeAdsSelectName', '');
        lodash.set(this.quickObj, 'creativeAdsId', null);

        lodash.set(this.quickObj, 'campaignName', '');
        lodash.set(this.quickObj, 'campaignLandingPageUrl', '');
        lodash.set(this.quickObj, 'campaignScheduleFrom', null);
        lodash.set(this.quickObj, 'campaignScheduleTo', null);

        lodash.set(this.quickObj, 'apName', '');
        lodash.set(this.quickObj, 'apMacLan', '');
        lodash.set(this.quickObj, 'apMac', '');
        lodash.set(this.quickObj, 'apMac5', '');

        this.quickObj.campaignScheduleTo = moment().endOf('year').toDate().toISOString();
        this.init();
        $('#wrapper-quick').toggleClass('toggled');
    }

    formatMoment(val) { if (!val) return ''; return moment(val).format('MMM DD, YYYY HH:mm'); }

    handleQuickBtn(type, validLocation, validLocationGr, validCampaign) {
        switch (type) {
            case 'next':
                const findCurrentCount = this.mapStep.find(item => item.value === this.stepCount);
                if (findCurrentCount) {
                    if (findCurrentCount.text === 'location') {
                        if (!validLocation) {
                            this.quickFormLocation.name.$setDirty();
                            this.quickFormLocation.name.$validate();
                            this.quickFormLocation.city.$setDirty();
                            this.quickFormLocation.city.$validate();
                            this.quickFormLocation.address.$setDirty();
                            this.quickFormLocation.address.$validate();
                            return;
                        }
                    }

                    if (findCurrentCount.text === 'locationGroup') {
                        if (!this.is_locationGroup) return;

                        if (!validLocationGr) {
                            if (this.is_locationGroup === "create") {
                                this.quickFormLocationGr.name.$setDirty();
                                this.quickFormLocationGr.name.$validate();
                                return;
                            }
                        }
                    }

                    if (findCurrentCount.text === 'creativeAds') {
                        if (!this.is_creativeAds) return;

                        if (this.is_creativeAds === 'create') {
                            if (!this.quickObj.creativeAdsId) {
                                return;
                            }
                        }
                    }

                    if (findCurrentCount.text === 'campaign') {
                        if (!validCampaign) {
                            this.quickFormCampaign.name.$setDirty();
                            this.quickFormCampaign.name.$validate();
                            this.quickFormCampaign.landingPageUrl.$setDirty();
                            this.quickFormCampaign.landingPageUrl.$validate();
                            this.quickFormCampaign.scheduleFrom.$setDirty();
                            this.quickFormCampaign.scheduleFrom.$validate();
                            this.quickFormCampaign.scheduleTo.$setDirty();
                            this.quickFormCampaign.scheduleTo.$validate();
                            return;
                        }
                    }
                }

                this.stepCount += 1;
                break;
            case 'back':
                this.stepCount -= 1;
                break;
            default:
                break;
        }

        const find = this.mapStep.find(item => item.value === this.stepCount);
        if (find) {
            if (find.text === 'summary') {
                this.summary();
            }
            this.step = find.text;
        }
    }

    selectCityChange() {
        if (!this.quickObj.locationCityId) {
            return;
        }
        const foundCityDistrict = this.selectCity.data.find(ct => ct.id === this.quickObj.locationCityId);
        let districts = foundCityDistrict.options.district ? foundCityDistrict.options.district : [];
        districts.map(d => {
            d.id = d.value;
            return d;
        });
        this.selectDistrict.data = districts;
        const foundDistrict = districts.find(d => d.value === this.quickObj.locationDistrictId);
        foundDistrict ? this.quickObj.locationDistrictId = this.quickObj.locationDistrictId : delete this.quickObj.locationDistrictId;
    }

    summary() {
        if (this.quickObj.locationCityId) {
            const locationCityName = this.selectCity.data.find(item => item.id.toString() === this.quickObj.locationCityId.toString());
            this.quickObj.locationCityName = (locationCityName && locationCityName.text) ? locationCityName.text : '';
        }

        if (this.quickObj.locationDistrictId) {
            const locationDistrictName = this.selectDistrict.data.find(item => item.id.toString() === this.quickObj.locationDistrictId.toString());
            this.quickObj.locationDistrictName = (locationDistrictName && locationDistrictName.text) ? locationDistrictName.text : '';
        }

        if (this.is_locationGroup && this.is_locationGroup === 'selectList') {
            const findLocationGr = this.locationGroups.find(item => item.id.toString() === this.quickObj.locationGrSelect.toString());
            this.quickObj.locationGrSelectName = (findLocationGr && findLocationGr.text) ? findLocationGr.text : '';
        }

        if (this.is_creativeAds && this.is_creativeAds === 'selectList') {
            const findCreativeAds = this.banners.find(item => item.id.toString() === this.quickObj.creativeAdsSelect.toString());
            if (findCreativeAds) {
                this.quickObj.creativeAdsSelectName = findCreativeAds.name ? findCreativeAds.name : '';
            }
        }
    }

    switchTo() {
        this.$state.go('admin.banner', { quick: true, is_preview: false, created: moment().valueOf(), previewObj: {} });
    }

    preview(id) {
        this.$state.go('admin.banner', { quick: false, is_preview: true, created: moment().valueOf(), previewObj: { id } });
    }

    generateCode(length) {
        let randomChar = '',
            string = 'ABCDEFGHJKMLNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz0123456789';
        for (var i = 0; i < length; i++) {
            randomChar += string.substr(Math.floor(Math.random() * string.length), 1);
        }
        return randomChar;
    }

    // Save DB
    async saveDB() {
        let brand_username = '';
        const findProfileBrand = this.profiles.find(item => item.name === 'brand');

        if (this.accountBrands && this.accountBrands.length > 0) {
            brand_username = '';
        } else {
            brand_username = `brand_default_${this.generateCode(10).toLowerCase()}`;
        }

        // return;
        document.querySelector('#quickOverlayBg').style.display = 'block';

        try {
            const [creloc, crelocGr, crebrand] = await Promise.all([
                this.Location.create({
                    name: this.quickObj.locationName,
                    address: this.quickObj.locationAddress,
                    cityId: this.quickObj.locationCityId,
                    cityName: this.quickObj.locationCityName,
                    districtId: this.quickObj.locationDistrictId,
                    createdBy: this.currentUser.id,
                }).$promise,
                (this.is_locationGroup && this.is_locationGroup === 'create') ?
                    (
                        this.SelectOption.create({
                            type: 'location_category',
                            createdBy: this.currentUser.id,
                            externalParams: {},
                            options: {
                                hotspotType: 'default',
                                locationConfig: {}
                            },
                            aerohive: {
                                sessionTimeout: 1800,
                                idleTimeout: 300
                            },
                            unifi: {},
                            text: this.quickObj.locationGrName,
                            value: this.quickObj.locationGrName.replace(/[^\w]/g, '').toLowerCase()
                        }).$promise
                    ) : null,
                (this.accountBrands && this.accountBrands.length > 0) ? this.accountBrands[0] : (
                    this.User.create({
                        createdBy: this.currentUser.id,
                        name: 'brand_default',
                        username: brand_username,
                        email: `${brand_username}@gmail.com`,
                        password: '12345678',
                        profileId: (findProfileBrand && findProfileBrand.id) ? findProfileBrand.id : null,
                        profileName: (findProfileBrand && findProfileBrand.name) ? findProfileBrand.name : '',
                        type: 0,
                        rootdir: `/${brand_username}`
                    }).$promise
                )
            ]);

            this.quickObj.locationId = (creloc && creloc.id) ? creloc.id : null;

            if (this.is_locationGroup && this.is_locationGroup === 'selectList') {
                const findLocationGr = this.locationGroups.find(item => item.id.toString() === this.quickObj.locationGrSelect.toString());
                this.createdLocationGr = (findLocationGr && findLocationGr.id) ? findLocationGr : null;
            } else if (this.is_locationGroup && this.is_locationGroup === 'create') {
                this.createdLocationGr = crelocGr || null;
            } else {
                this.createdLocationGr = null;
            }

            const replaceLoc = Object.assign({}, creloc, {
                categoryId: (crelocGr && crelocGr.id) ? crelocGr.id : this.quickObj.locationGrSelect,
                categoryName: (crelocGr && crelocGr.text) ? crelocGr.text : this.quickObj.locationGrSelectName,
            });

            delete replaceLoc.$resolved; delete replaceLoc.$promise; delete replaceLoc.districtName;

            await Promise.all([
                this.Location.replaceById(replaceLoc).$promise,
                this.Campaign.create({
                    scheduleFrom: this.quickObj.campaignScheduleFrom,
                    scheduleTo: this.quickObj.campaignScheduleTo,
                    createdBy: this.currentUser.id,
                    daysOfWeek: [],
                    name: this.quickObj.campaignName,
                    landingPageUrl: this.quickObj.campaignLandingPageUrl,
                    brands: [],
                    locations: [
                        {
                            locationId: (creloc && creloc.id) ? creloc.id : null,
                            locationName: (creloc && creloc.name) ? creloc.name : '',
                            categoryId: (crelocGr && crelocGr.id) ? crelocGr.id : this.quickObj.locationGrSelect,
                            categoryName: (crelocGr && crelocGr.text) ? crelocGr.text : this.quickObj.locationGrSelectName,
                            cityId: (creloc && creloc.cityId) ? creloc.cityId : null,
                            cityName: (creloc && creloc.cityName) ? creloc.cityName : '',
                        }
                    ],
                    banners: [],
                    audience: [{ and: [] }],
                    customFields: [],
                    bannerDefaultId: (this.is_creativeAds && this.is_creativeAds === 'create') ? (this.quickObj.creativeAdsId || null) : (this.quickObj.creativeAdsSelect || null),
                    bannerDefaultName: (this.is_creativeAds && this.is_creativeAds === 'create') ? (this.quickObj.creativeAdsName || '') : (this.quickObj.creativeAdsSelectName || ''),
                    brandId: (crebrand && crebrand.id) ? crebrand.id : null,
                    brandName: (crebrand && crebrand.name) ? crebrand.name : '',
                }).$promise,
            ]);

            setTimeout(() => {
                document.querySelector('#quickOverlayBg').style.display = 'none';
                this.alertify.success(this.Messages.createSuccess);
                if (creloc && creloc.id) {
                    document.getElementById('quickOpenExpandNotify').style.display = 'none';
                    $('#quickFmEdit').modal();
                }
            }, 1000);
        } catch (error) {
            document.querySelector('#quickOverlayBg').style.display = 'none';
            this.alertify.error(this.Messages.createFailed);
        }
    }

    // Create AP
    async createAp() {
        this.quickObj.apMacLan = this.standardizeMac(this.quickObj.apMacLan);
        this.quickObj.apMac = this.standardizeMac(this.quickObj.apMac);
        this.quickObj.apMac5 = this.standardizeMac(this.quickObj.apMac5);

        const validate = this.validateApMac({ macLan: this.quickObj.apMacLan, mac: this.quickObj.apMac, mac5: this.quickObj.apMac5 });
        const saveAp = [{ name: this.quickObj.apName, mac: this.quickObj.apMac, mac5: this.quickObj.apMac5, macLan: this.quickObj.apMacLan }];

        if (validate) {
            this.alertify.error(validate);
            return;
        }

        try {
            if (this.quickObj.locationId) {
                await this.Location.APProcess({ id: this.quickObj.locationId, ap: saveAp, user: this.currentUser.id }).$promise;
                this.alertify.success(this.Messages.createSuccess);
                $('#quickFmEdit').modal('hide');

                if (this.createdLocationGr && this.createdLocationGr.id) {
                    Swal.fire({
                        title: 'Your setup have just been completed',
                        text: 'Please click to get your Hotspot External Link',
                        type: 'success',
                        confirmButtonText: 'Click here'
                    }).then(() => {
                        delete this.createdLocationGr.$resolved;
                        delete this.createdLocationGr.$promise;
                        this.$state.go('admin.location-group', { quickLocationGroup: true, created: moment().valueOf(), quickLocationGroupObj: this.createdLocationGr });
                        this.createdLocationGr = null;
                    });
                }
                this.setupQuick();
            } else {
                this.alertify.error(this.Messages.createFailed);
                this.setupQuick();
            }
        } catch (err) {
            if (err.data.error.message.indexOf('expand') > -1) {
                document.getElementById('quickOpenExpandNotify').style.display = 'block';
            } else {
                this.alertify.error(this.Messages.createFailed + ' ' + err.data.error.message);
            }
            this.setupQuick();
        }
    }
}

export default angular
    .module('quick.controller', [
        require('../../extensions/directives/select2').name,
        require('../../extensions/directives/date-range-picker').name,
    ])
    .controller('QuickCtrl', QuickCtrl);

