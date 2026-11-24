import moment from "moment";
import _findIndex from "lodash/findIndex";

class MailMarketingCtrl {
  constructor(
    LoopBackResource,
    $window,
    $rootScope,
    alertify,
    AppConfig,
    Messages,
    currentUser
  ) {
    this.LoopBackResource = LoopBackResource;
    this.$window = $window;
    this.$rootScope = $rootScope;

    this.alertify = alertify;
    this.AppConfig = AppConfig;
    this.Messages = Messages;
    this.currentUser = currentUser;

    this.onReady();
  }

  onReady() {
    const username = this.currentUser && this.currentUser.username || "";
    let getMaticUrl = this.AppConfig && this.AppConfig.mauticUrl || "";
    getMaticUrl = getMaticUrl.replace('USER_NAME', username);
    getMaticUrl = getMaticUrl.replace('PASSWORD', username);

    let iframe = document.createElement("iframe");
    const container = document.getElementById("mauticIframe");

    iframe.width = "100%";
    iframe.height = "100%";
    iframe.style.border = "none";
    iframe.style.outline = "none";
    container.style.border = "none";

    if (container.childNodes[0]) {
      console.log(container.childNodes[0]);
      container.removeChild(container.childNodes[0]);
    }
    container.appendChild(iframe);

    iframe.src = null;
    setTimeout(() => {
      // iframe.src = getMaticUrl;
      iframe.src = 'http://mautic.genexwifi.com/index.php/s/login';
    }, 600);
  }
}
export default angular
  .module("app.mail-marketing.controller", [])
  .controller("MailMarketingCtrl", MailMarketingCtrl);

