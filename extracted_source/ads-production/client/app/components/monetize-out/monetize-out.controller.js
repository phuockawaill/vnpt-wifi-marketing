import './monetize-out.less';
import _merge from 'lodash/merge';
import _cloneDeep from 'lodash/cloneDeep';
import _differenceWith from 'lodash/differenceWith';
import _isEqual from 'lodash/isEqual';

class MonetizeOutCtrl {
    constructor($scope, $rootScope, alertify, Messages, VNMessages, CommonUtil, Location, locations, shares, CommonData, PublisherShare, currentUser, User) {
        setTimeout(() => { $scope.$broadcast('rzSliderForceRender'); }, 200);
        this.alertify = alertify;
        this.$rootScope = $rootScope;
        this.Messages = this.$rootScope.isLang === 'VN' ? VNMessages : Messages;
        this.CommonUtil = CommonUtil;
        this.CommonData = CommonData;
        this.PublisherShare = PublisherShare;
        this.Location = Location;
        this.User = User;
        this.currentUser = currentUser;
        this.locations = locations.map(item => item.toJSON());
        this.shares = shares.map(item => item.toJSON());
        this.initData();
    }

    initData() {
        const commonOptions = _cloneDeep(this.CommonUtil._defaultRzsliderConfigs);
        const commonOptions2 = _cloneDeep(this.CommonUtil._defaultRzsliderConfigs);
        this.slider = _merge(commonOptions);
        this.sliderWithLocation = _merge(commonOptions2, {
            options: {
                translate: (value) => {
                    switch (value) {
                        case 30:
                            return `${value}%`;
                        case 100:
                            return `${value}%`;
                        default:
                            return `${value}%`;
                    }
                }
            }
        });
        this.obj = {
            cityId: '',
            districtId: '',
            sharing: "true",
            sharingType: 'all',
            shareAll: 30,
        };
        this.selectCity = {
            width: '100%',
            placeholder: 'Pick a City/Province',
            data: [],
        };
        this.selectDistrict = {
            width: '100%',
            placeholder: 'Pick a District',
            data: [],
        };
        this.selectLocations = [];

        this.CommonData.cities().then(cities => {
            cities = cities.map(item => item.toJSON());
            cities = cities.concat([{ text: 'All', value: 'all', id: 'all' }]);
            this.cities = cities;
            this.selectCity.data = cities;
            this.obj.cityId = cities.filter(item => item.id === 'all')[0].id;

            if (this.shares && this.shares.length) {
                const getData = this.shares[0];
                this.obj.sharing = getData.share ? "true" : "false";
                this.obj.sharingType = getData.sharingType;
                this.obj.shareAll = getData.value;
                this.locations = this.locations.map(item => {
                    const findCity = cities.find(item2 => item2.id === item.cityId);
                    const findDistrict = (findCity && findCity.options && findCity.options.district) ? findCity.options.district.find(item3 => item3.value === item.districtId) : null;
                    const findSharingValue = getData.locationDetail.find(item4 => item4.location === item.id);
                    const sharingValue = (findSharingValue && findSharingValue.value) ? findSharingValue.value : 30;
                    const enableShare = true;
                    return {
                        ...item,
                        cityName: findCity ? findCity.text : '',
                        districtName: findDistrict ? findDistrict.text : '',
                        sharingValue,
                        enableShare,
                    }
                });
            } else {
                this.locations = this.locations.map(item => {
                    const findCity = cities.find(item2 => item2.id === item.cityId);
                    const findDistrict = (findCity && findCity.options && findCity.options.district) ? findCity.options.district.find(item3 => item3.value === item.districtId) : null;
                    return {
                        ...item,
                        cityName: findCity ? findCity.text : '',
                        districtName: findDistrict ? findDistrict.text : '',
                        sharingValue: 30,
                        enableShare: true,
                    }
                });
            }

            this.selectLocations = _cloneDeep(this.locations);
        });
    }

    async refresh() {
        if (this.currentUser.profileName === 'publisher') {
            const locations = await this.Location.find({ filter: { where: { "createdBy": this.currentUser.id } } }).$promise;
            const shares = await this.PublisherShare.find({ filter: { where: { "userId": this.currentUser.id } } }).$promise;
            this.locations = locations.map(item => item.toJSON());
            this.shares = shares.map(item => item.toJSON());
            this.initData();
        }
    }

    selectCityChange() {
        if (!this.obj.cityId) {
            this.selectLocations = this.locations.filter(item => {
                const find = this.selectLocations.find(item2 => item2.id === item.id);
                item.sharingValue = (find && find.sharingValue) ? find.sharingValue : item.sharingValue;
                item.enableShare = true;
                return item;
            });
            this.selectDistrict.data = [];
            this.obj.districtId = '';
            return;
        }

        if (this.obj.cityId === 'all') {
            this.selectLocations = this.locations.filter(item => {
                const find = this.selectLocations.find(item2 => item2.id === item.id);
                item.sharingValue = (find && find.sharingValue) ? find.sharingValue : item.sharingValue;
                item.enableShare = true;
                return item;
            });
            this.selectDistrict.data = [];
            this.obj.districtId = '';
            return;
        }

        this.selectLocations = this.locations.filter(item => {
            const find = this.selectLocations.find(item2 => item2.id === item.id);
            item.sharingValue = (find && find.sharingValue) ? find.sharingValue : item.sharingValue;
            item.enableShare = true;

            if (item.cityId === this.obj.cityId) {
                return item;
            }
        });

        const foundCityDistrict = this.cities.find(ct => ct.id === this.obj.cityId);
        this.districts = (foundCityDistrict.options && foundCityDistrict.options.district) ? foundCityDistrict.options.district : [];
        this.districts.map(d => {
            d.id = d.value;
            return d;
        });

        this.selectDistrict.data = this.districts;
        const foundDistrict = this.districts.find(d => d.value === this.obj.districtId);
        foundDistrict ? this.obj.districtId = this.obj.districtId : delete this.obj.districtId;
    };

    selectDistrictChange() {
        if (!this.obj.districtId) {
            return;
        }
        this.selectLocations = this.locations.filter(item => {
            const find = this.selectLocations.find(item2 => item2.id === item.id);
            item.sharingValue = (find && find.sharingValue) ? find.sharingValue : item.sharingValue;
            item.enableShare = true;

            if (item.districtId === this.obj.districtId) {
                return item;
            }
        });
    };

    async save() {
        let locationDetail = [];
        if (this.obj.sharing === 'false') {
            locationDetail = this.selectLocations.map(item => ({
                location: item.id,
                value: 30,
                enable: false,
            }));
        } else {
            locationDetail = (this.obj.sharingType === 'all') ? this.selectLocations.map(item => ({
                location: item.id,
                value: this.obj.shareAll,
                enable: true,
            })) : this.selectLocations.map(item => ({
                location: item.id,
                value: item.sharingValue,
                enable: true,
            }));
        }

        const saveData = {
            share: (this.obj.sharing === 'true') ? true : false,
            value: (this.obj.sharing === 'true') ? this.obj.shareAll : 30,
            locationDetail: (this.shares && this.shares.length) ? _differenceWith(locationDetail, this.shares[0].locationDetail, _isEqual) : locationDetail,
            sharingType: this.obj.sharingType,
        };

        if (this.shares && this.shares.length && this.shares[0].id) {
            try {
                await this.PublisherShare.updateAll({ where: { id: this.shares[0].id } }, saveData).$promise;
                this.refresh();
                this.alertify.success(this.Messages.updateSuccess);
            } catch (error) {
                this.alertify.error(this.Messages.updateFailed);
            }
        } else {
            try {
                await this.PublisherShare.create(saveData).$promise;
                this.refresh();
                this.alertify.success(this.Messages.createSuccess);
            } catch (error) {
                this.alertify.error(this.Messages.createFailed);
            }
        }
    }
}

export default angular
    .module('app.monetize-out.controller', [
        'rzSlider',
        'app.directive.select2',
        'app.directive.app-rz-slider',
    ])
    .controller('MonetizeOutCtrl', MonetizeOutCtrl);
