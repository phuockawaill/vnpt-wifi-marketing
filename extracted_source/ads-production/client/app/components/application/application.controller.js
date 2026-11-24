import _get from 'lodash/get';
import fmChangePasswordTemplate from './change-password.pug';
import fmConfiguration from './configuration.pug';
import fmExpandLicense from './expand-license.pug';
import fmActiveLicense from './active-license.pug';
import logo from 'assets/images/logo_vnpt.png';
import fav from 'assets/images/genex-fav.ico';
import vnFl from 'assets/images/icons/vn_flag.png';
import usFl from 'assets/images/icons/usa_flag.png';
import moment from 'moment';
import Swal from 'sweetalert2';

class ApplicationCtrl {
  constructor(
    $rootScope,
    $state,
    AppConfig,
    AuthService,
    AuthEvents,
    $templateCache,
    User,
    Location,
    SelectOption,
    Banner,
    Campaign,
    Configuration,
    alertify,
    Notification,
    Messages,
    VNMessages,
    License,
    vcRecaptchaService,
  ) {
    'ngInject';

    const sessionWifiTrack = sessionStorage.getItem('wifiRedirect');
    if (sessionWifiTrack) {
      sessionStorage.removeItem('wifiRedirect');
      location.replace(sessionWifiTrack);
    }

    $templateCache.put('change-password', fmChangePasswordTemplate);
    $templateCache.put('configuration', fmConfiguration);
    $templateCache.put('expand-license', fmExpandLicense);
    $templateCache.put('active-license', fmActiveLicense);

    this.$rootScope = $rootScope;
    $rootScope.createdGuidance = 'closed';
    this.AuthEvents = AuthEvents;
    this.$state = $state;
    this.vcRecaptchaService = vcRecaptchaService;

    this.vnFlUrl = vnFl;
    this.usFlUrl = usFl;
    this.isLang = 'VN';

    this.AppConfig = AppConfig;
    this.AuthService = AuthService;
    this.User = User;
    this.Location = Location;
    this.SelectOption = SelectOption;
    this.Banner = Banner;
    this.Campaign = Campaign;
    this.Configuration = Configuration;
    this.License = License;
    this.alertify = alertify;
    this.Messages = Messages;
    this.Notification = Notification;
    this.currentUser = null;
    this.logoUrl = logo;
    this.objPass = {};
    this.objExpand = { type: 'expand' };
    this.config = {};
    this.activeKey = '';
    this.modeLicense = 'active';
    this.childUsers = [];
    this.objChange = {};
    $rootScope.$on(AuthEvents.currentUserUpdated, (event, currentUser) => {
      this.currentUser = currentUser;
      this.menuTree = currentUser.menuTree || [];
      // this.menuTree.push({
      //   text: 'Email Marketing',
      //   icon: 'icon-mail5',
      //   url: 'admin.mailMarketing'
      // });
      this.objExpand.email = currentUser.email;
      if (currentUser.licenses) {
        let message;
        currentUser.licenses.forEach((lin) => {
          if (lin.status === 0) {
            Notification.warning({ message: 'Expanding license Request: Processing', delay: 'none' });
          } else if (lin.status === 1) {
            this.activeKey = lin.key;
            this.objChange = {
              id: lin.id,
              active: false,
            };
            message = `Your License Key: <b>${lin.key}</b><br> Activate License Here!`;
            if (currentUser.profileName === 'admin' || currentUser.profileName === 'superadmin') {
              message = `Your License Key: <b>${lin.key}</b><br> Activate or Approve License Here!`;
            }
            Notification.success({
              message,
              delay: 'none',
              onClose: (ev) => ev[0].className.indexOf('killed') > -1 ? null : this.openDialogLicense(),
            });
          }
        });
      }

      if (this.currentUser && this.currentUser.lang) {
        this.isLang = this.currentUser.lang;
        $rootScope.isLang = this.currentUser.lang;
        this.Messages = $rootScope.isLang === 'VN' ? VNMessages : Messages;
      }

      this.checkShowGuide();
    });

    this.modalPassOptions = {
      onInitialized: this.onModalPasswordInitialized.bind(this),
    };
    this.modalExpandOptions = {
      onInitialized: this.onModalExpandInitialized.bind(this),
    };
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = fav;
    document.getElementsByTagName('head')[0].appendChild(link);

    this.recaptchaSiteKey = this.AppConfig.recaptchaSiteKey;
    this.widgetId = null;
    this.reCaptchaResponse = null;
    this.onlineDocUrl = this.AppConfig.onlineDocUrl;
    // localhost data-sitekey="6Le-6kQUAAAAACRbUqfbkpsowqFNcvOA_eBnuX1O"
    // server data-sitekey="6LfA5UQUAAAAANHrC3DIpnLU1zVs86mIjEvU8DP4"
  }

  onChangeViewLicense(mode) {
    this.modeLicense = mode;
  }
  openDialogLicense(key) {
    if (key) {
      this.activeKey = key.key;
      this.objChange = {
        id: key.id,
        active: false,
      };
    }
    if (this.currentUser.profileName === 'client' || this.currentUser.profileName === 'publisher') {
      $('#fmActiveLicense').modal();
    } else {
      this.User.find().$promise
        .then((usrs) => {
          this.childUsers = usrs.filter(usr => usr.id !== this.currentUser.id && (usr.profileName === 'admin' || usr.profileName === 'client' || usr.profileName === 'publisher')).map((item) => {
            item.description = `${item.username} (${item.profileName})`; return item;
          });
        });
      $('#fmActiveLicense').modal();
    }
  }
  approveChange() {
    this.License.approveMoveLicense(this.objChange).$promise
      .then(() => {
        this.alertify.success('Approve successfully!');
        $('#fmActiveLicense').modal('hide');
      })
      .catch((err) => {
        this.alertify.error(err.data.error.message);
      });
  }

  onModalPasswordInitialized(instance) {
    this.modalPass = instance;
  }
  onModalExpandInitialized(instance) {
    this.modalPass = instance;
  }

  changePassword() {
    this.User.changePassword(this.objPass).$promise
      .then(() => {
        this.alertify.success(this.Messages.changePasswordSuccess);
        this.objPass = {};
        if (this.modalPass) {
          this.modalPass.hide();
        } else {
          $('#fmPass').modal('hide');
        }
        this.logout();
      })
      .catch((res) => {
        const errCode = _get(res, 'data.error.code');
        let message = this.Messages.changePasswordFailed;
        if (errCode in this.Messages) {
          message = `${message} ${this.Messages[errCode]}`;
        }
        this.alertify.error(message);
      });
  }

  GetConfiguration() {
    this.Configuration.find({}).$promise.then((data) => {
      data.forEach(({ key, value }) => {
        this.config[key] = value;
      });
    });
  }

  updateConfig() {
    this.Configuration.find({}).$promise.then((data) => {
      let updateArr = [];
      data.forEach((item) => {
        item.value = this.config[item.key] || item.value;
        updateArr.push(this.Configuration.replaceById(item).$promise);
      });
      Promise.all(updateArr).then(() => {
        this.alertify.success(this.Messages.updateSuccess);
        $('#fmConfig').modal('hide');
      }).catch((err) => {
        this.alertify.error(`${err.message} ${this.Messages[err.Code]}`);
      });
    });
  }

  setCurrentUser(currentUser) {
    this.currentUser = currentUser;
  }

  logout() {
    this.AuthService.logout();
    this.Notification.clearAll();
  }

  isAuthenticated() {
    return this.AuthService.isAuthenticated();
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

  SubmitExpand(validFmExpandLicense) {
    if (!validFmExpandLicense) {
      if (
        this.fmExpandLicense.numberAp.$valid &&
        this.fmExpandLicense.emailConfirm.$valid &&
        !this.reCaptchaResponse
      ) {
        alert("Please resolve the captcha and submit!");
      }
      return;
    }

    document.getElementById('loadingSubmit').style.display = 'block';
    document.getElementById('submitBody').style.display = 'none';

    const chain = Promise.resolve();
    chain
      .then(() => this.License.requireLicense(this.objExpand).$promise)
      .then(() => {
        this.reload();
        this.reCaptchaResponse = null;
        $('#fmExpandLicense').modal('hide');
        this.Notification.warning({ message: 'Expanding license Request: Processing', delay: 'none' });
        this.objExpand.numberAp = 0;
        this.objExpand.emailConfirm = '';
        this.objExpand.phone = '';
        setTimeout(() => {
          document.getElementById('loadingSubmit').style.display = 'none';
          document.getElementById('submitBody').style.display = 'block';
        }, 1000);
      })
      .catch(err => { this.reload(); this.reCaptchaResponse = null; });
  }

  SubmitActive() {
    const chain = Promise.resolve();
    chain
      .then(() => this.License.activeLicense({ key: this.activeKey }).$promise)
      .then(() => {
        $('#fmActiveLicense').modal('hide');
        this.alertify.success('Active successfully!');
      })
      .catch(err => this.alertify.error(`Active failed.  ${err.data.error.message}`));
  }

  setupGuide() {
    this.$rootScope.createdGuidance = 'started';
    this.$state.go('admin.location', { guidance: true, created: moment().valueOf() });
  }

  async changeLang(lang) {
    // this.isLang = lang;
    try {
      await this.User.updateAll({ where: { id: this.currentUser.id } }, { lang });
      setTimeout(() => {
        this.openNotiLanguage();
      }, 500);
    } catch (error) {
      this.alertify.error('Update language failed');
    }
  }

  openNotiLanguage() {
    Swal.fire({
      title: this.isLang === 'VN' ? '<strong>Processing Language</strong>' : '<strong>Đang cập nhật ngôn ngữ</strong>',
      type: 'success',
      html: '<i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i>',
      showConfirmButton: false,
      showCloseButton: false,
      showCancelButton: false,
      focusConfirm: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
    });

    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }

  async checkShowGuide() {
    if (this.currentUser && (this.currentUser.profileName === 'client' || this.currentUser.profileName === 'publisher')) {
      let [locations, locationGroups, creativeAds, brands, campaigns] = await Promise.all([
        this.Location.find({ filter: { where: { createdBy: this.currentUser.id } } }).$promise,
        this.SelectOption.find({ filter: { where: Object.assign({}, { type: 'location_category' }, { createdBy: this.currentUser.id }) } }).$promise,
        this.Banner.find({ filter: { where: { createdBy: this.currentUser.id } } }).$promise,
        this.User.find().$promise,
        this.Campaign.find({ filter: { where: { createdBy: this.currentUser.id } } }).$promise,
      ]);

      locations = locations.map(item => item.toJSON());
      locationGroups = locationGroups.map(item => item.toJSON());
      creativeAds = creativeAds.map(item => item.toJSON());
      brands = brands.map(item => item.toJSON()).filter(item => item.profileName === 'brand');
      campaigns = campaigns.map(item => item.toJSON());

      if ((locations && locations.length) || (locationGroups && locationGroups.length) ||
        (creativeAds && creativeAds.length) || (brands && brands.length) ||
        (campaigns && campaigns.length)) {
        return;
      }
      return this.openSwal();
    }
  }

  openSwal() {
    Swal.fire({
      title: '<strong>Chào mừng đến với GenexWifi DSP Platform</strong>',
      type: 'info',
      html: 'Bạn có muốn bắt đầu setup một chiến dịch?',
      showCloseButton: true,
      showCancelButton: true,
      focusConfirm: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      confirmButtonText: '<i class="fa fa-hand-o-right"></i> Start!',
      cancelButtonText: '<i class="fa fa-step-forward"></i> Skip',
    }).then((result) => {
      if ((result.dismiss === Swal.DismissReason.cancel) || (result.dismiss === Swal.DismissReason.close)) {
        this.$rootScope.createdGuidance = 'closed';
        return;
      }
      this.$rootScope.createdGuidance = 'started';
      this.$state.go('admin.location', { guidance: true, created: moment().valueOf() });
    });
  }
}

export default angular
  .module('application.controller', [
    require('../../extensions/modules/alertify').name,
    require('../../extensions/modules/notification').name,
    require('../../extensions/directives/sticky').name,
    require('../../extensions/directives/bootstrap/modal').name,
    'vcRecaptcha',
  ])
  .controller('ApplicationCtrl', ApplicationCtrl);

