import vnFl from 'assets/images/icons/vn_flag.png';
import usFl from 'assets/images/icons/usa_flag.png';

class RegisterCtrl {
  constructor($scope, $state, alertify, Messages, VNMessages, SelectOption, AppConfig, User, cities, venuetypes, registerType, vcRecaptchaService) {
    this.$scope = $scope;
    this.$state = $state;
    this.alertify = alertify;
    this.cities = cities;
    this.venuetypes = venuetypes;
    this.User = User;
    this.SelectOption = SelectOption;
    this.registerType = registerType;
    this.AppConfig = AppConfig;
    this.vcRecaptchaService = vcRecaptchaService;
    this.vnFlUrl = vnFl;
    this.usFlUrl = usFl;
    this.isLang = 'VN';
    this.Messages = this.isLang === 'VN' ? VNMessages : Messages;

    this.credentials = {
      username: '',
      email: '',
      password: '',
      confirmpassword: '',
      firstname: '',
      lastname: '',
      cityId: '',
      districtId: '',
      phone: '',
      address: '',
      business: '',
      equipment: '',
      equipmentOther: '',
    };

    this.selectCity = {
      width: '100%',
      placeholder: '*',
      data: []
    };

    this.selectDistrict = {
      width: '100%',
      placeholder: '*',
      data: []
    };

    this.selectBusiness = {
      width: '100%',
      placeholder: '*',
      data: (this.venuetypes && this.venuetypes.length) ? this.venuetypes.map(item => ({
        text: item.name,
        id: item.id
      })) : []
    };

    this.selectEquipment = {
      width: '100%',
      placeholder: 'Your equipment',
      data: [
        { text: 'Engenius', id: 'engenius' },
        { text: 'Ruijie', id: 'ruijie' },
        { text: 'Aerohive', id: 'aerohive' },
        { text: 'Unify', id: 'unify' },
        { text: 'TP-Link Omada Controller', id: 'tplink' },
        { text: 'Ruckus Standalone', id: 'ruckus' },
        { text: 'Other - please type your own', id: 'other' }
      ]
    };

    this.selectCity.data = this.cities;
    this.errorMessage = '';
    this.recaptchaSiteKey = this.AppConfig.recaptchaSiteKey;
    this.widgetId = null;
    this.reCaptchaResponse = null;
    this.notify = false;
    this.vcRecaptchaService.reload();
    this.onload = false;
  }

  trim() {
    if (this.credentials.username) {
      this.credentials.username = this.credentials.username.latinize();
      this.credentials.username = this.credentials.username.replace(/\s/g, '');
    }
  }

  selectCityChange() {
    if (!this.credentials.cityId) {
      return;
    }
    let foundCityDistrict = this.cities.find(ct => ct.id === this.credentials.cityId);
    this.districts = foundCityDistrict.options.district ? foundCityDistrict.options.district : [];
    this.districts.map(d => {
      d.id = d.value;
      return d;
    });
    this.selectDistrict.data = this.districts;
    let foundDistrict = this.districts.find(d => d.value === this.credentials.districtId);
    foundDistrict ? this.credentials.districtId = this.credentials.districtId : delete this.credentials.districtId;
  }

  setWidgetId(widgetId) {
    this.widgetId = widgetId;
  }

  setResponse(response) {
    this.reCaptchaResponse = response;
  }

  reload() {
    this.vcRecaptchaService.reload(this.widgetId);
  }

  register(credentials, validForm) {
    this.onload = true;
    if (!validForm) {
      this.registerForm.username.$setDirty();
      this.registerForm.username.$validate();
      this.registerForm.email.$setDirty();
      this.registerForm.email.$validate();
      this.registerForm.password.$setDirty();
      this.registerForm.password.$validate();
      this.registerForm.confirmpassword.$setDirty();
      this.registerForm.confirmpassword.$validate();
      this.registerForm.firstname.$setDirty();
      this.registerForm.firstname.$validate();
      this.registerForm.lastname.$setDirty();
      this.registerForm.lastname.$validate();
      this.registerForm.city.$setDirty();
      this.registerForm.city.$validate();
      this.registerForm.district.$setDirty();
      this.registerForm.district.$validate();
      this.registerForm.phone.$setDirty();
      this.registerForm.phone.$validate();
      this.registerForm.business.$setDirty();
      this.registerForm.business.$validate();

      if (
        this.registerForm.username.$valid && this.registerForm.email.$valid &&
        this.registerForm.password.$valid && this.registerForm.confirmpassword.$valid &&
        this.registerForm.firstname.$valid && this.registerForm.lastname.$valid &&
        this.registerForm.city.$valid && this.registerForm.district.$valid &&
        this.registerForm.phone.$valid && this.registerForm.business.$valid &&
        !this.reCaptchaResponse
      ) {
        alert("Please resolve the captcha and submit!");
      }
      this.onload = false;
      return;
    }

    this.errorMessage = null;
    const findCity = this.selectCity.data.find(item => item.id === credentials.cityId);
    const findDistrict = this.selectDistrict.data.find(item => item.id === credentials.districtId);
    const obj = {
      name: credentials.username,
      phone: credentials.phone,
      email: credentials.email,
      password: credentials.password,
      registerType: this.registerType,
      'g-recaptcha-response': this.reCaptchaResponse,
      options: {
        firstname: credentials.firstname,
        lastname: credentials.lastname,
        address: credentials.address,
        city: { id: findCity.id, text: findCity.text, value: findCity.value },
        district: { id: findDistrict.id, text: findDistrict.text, value: findDistrict.value },
        equipment: (credentials.equipment === 'other') ? credentials.equipmentOther : credentials.equipment,
        business: credentials.business ? this.selectBusiness.data.find(item => item.id === credentials.business).text : '',
        businessId: credentials.business
      }
    };
    if (this.registerType === 'client') {
      obj.options.trial = true;
    }
    this.User
      .register(obj)
      .$promise.then(() => {
        this.reload();
        this.reCaptchaResponse = null;
        this.notify = true;
        // this.alertify.success(this.Messages.createSuccess);
        // setTimeout(() => this.$state.go('login'), 800);
      })
      .catch((err) => {
        this.reload();
        this.reCaptchaResponse = null;
        this.alertify.error(this.Messages.createFailed);
        if (err && err.data && err.data.error) {
          this.errorMessage = err.data.error.message;
        }
        this.onload = false;
      });
  }
}

export default angular
  .module('app.register.controller', ['app.directive.select2', 'vcRecaptcha'])
  .controller('RegisterCtrl', RegisterCtrl);
