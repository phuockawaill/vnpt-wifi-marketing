(function mSdk(window, document) {
  const VERSION = '1.0.0';
  function standardizeMacAddressCNA(mac) {
    if (!mac) return null;
    mac = mac.replace(/[-.]/g, '').toUpperCase();
    if (mac.indexOf(':') === -1) {
      mac = mac.match(/[\s\S]{0,2}/g).join(':');
    }
    mac = mac.substr(0, 17);
    return mac;
  }

  function toQueryString(obj) {
    const parts = [];
    Object.keys(obj).forEach((i) => {
      let value = obj[i];
      if (Array.isArray(value) || typeof value === 'object') {
        value = JSON.stringify(value);
      }
      if (value) {
        parts.push(`${encodeURIComponent(i)}=${encodeURIComponent(value)}`);
      }
    });
    return parts.join('&');
  }
  function getXhr() {
    if (typeof XMLHttpRequest !== 'undefined') {
      return new XMLHttpRequest();
    }
    const versions = [
      'MSXML2.XmlHttp.6.0',
      'MSXML2.XmlHttp.5.0',
      'MSXML2.XmlHttp.4.0',
      'MSXML2.XmlHttp.3.0',
      'MSXML2.XmlHttp.2.0',
      'Microsoft.XmlHttp'
    ];

    let xhr;
    for (let i = 0; i < versions.length; i += 1) {
      try {
        xhr = new ActiveXObject(versions[i]); // eslint-disable-line
        break;
      } catch (e) {} // eslint-disable-line
    }
    return xhr;
  }
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  const extend = (dest, ...data) => {
    data.forEach((item) => {
      if (!item || typeof item !== 'object' || typeof dest !== 'object') return;
      Object.keys(item).forEach((key) => {
        dest[key] = item[key];
      });
    });
    return dest;
  };

  const phoneFormat = /^(84|0)\d{9}\d?$/;
  function isPhoneNumberValid(phone) {
    return !!phone && phoneFormat.test(phone);
  }

  const emailFormat = new RegExp(
    [
      '^(([^<>()[\\].,;:\\s@"]+(\\.[^<>()[\\].,;:\\s@"]+)*)|(".+"))',
      '@(([^<>()[\\].,;:\\s@"]+\\.)+[^<>()[\\].,;:\\s@"]{2,})$'
    ].join(''),
    'i',
  );
  function isEmailValid(email) {
    return !!email && emailFormat.test(email);
  }

  // Run scripts in innerHTML
  function runInSeq(arr, allDone, curIndex) {
    if (typeof curIndex === 'undefined') {
      curIndex = 0;
    }

    arr[curIndex](() => {
      curIndex += 1;
      if (curIndex === arr.length) {
        allDone();
      } else {
        runInSeq(arr, allDone, curIndex);
      }
    });
  }
  function copyScript($script, callback) {
    const s = document.createElement('script');
    s.type = 'text/javascript';
    if ($script.src) {
      s.onload = callback;
      s.error = callback;
      s.src = $script.src;
    } else {
      s.textContent = $script.innerText;
    }
    $script.parentNode.replaceChild(s, $script);
    if (!$script.src) {
      callback();
    }
  }
  function runScriptOnInnerHTML(node, allDone) {
    const scriptArr = node.querySelectorAll('script');

    const runList = [];
    Array.prototype.forEach.call(scriptArr, ($script) => {
      runList.push((callback) => {
        copyScript($script, callback);
      });
    });

    if (!runList.length) return allDone();
    return runInSeq(runList, allDone);
  }

  function Util() {}
  Util.prototype.getParamFromUrl = function getParamFromUrl(paramName, url) {
    if (!url) {
      url = window.location.href;
    }
    paramName = paramName.replace(/[[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${paramName}(=([^&#]*)|&|#|$)`);
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  };
  Util.prototype.getParamFromHiddenField = function getParamFromHiddenField(
    paramName,
  ) {
    if (paramName) return null;
    const hiddenField = document.querySelector(`input[name=${paramName}]`);
    return hiddenField && hiddenField.getAttribute('value');
  };
  Util.prototype.getCookie = function getCookie(cookieName) {
    const nameEQ = `${cookieName}=`;
    const parts = document.cookie.split(';');
    for (let i = 0; i < parts.length; i += 1) {
      let part = parts[i];
      while (part.charAt(0) === ' ') part = part.substring(1, part.length);
      if (part.indexOf(nameEQ) === 0) {
        return part.substring(nameEQ.length, part.length);
      }
    }
    return undefined;
  };
  Util.prototype.getMac = function getMac(paramName = 'mac') {
    paramName = paramName || 'mac';
    return (
      this.getParamFromUrl(paramName) ||
      this.getCookie(paramName) ||
      this.getParamFromHiddenField(paramName) ||
      ''
    ); // Prevent undefined value
  };
  Util.prototype.isPhoneNumberValid = isPhoneNumberValid;
  Util.prototype.isEmailValid = isEmailValid;
  Util.prototype.extend = extend;
  Util.prototype.clone = clone;
  Util.prototype.renderElement = function renderElement(type = 'img', attrs, parent) {
    parent = parent || document.body;
    const ele = document.createElement(type);
    if (type === 'script') ele.setAttribute('type', 'text/javascript');
    Object.keys(attrs).forEach((attrName) => {
      ele.setAttribute(attrName, attrs[attrName]);
    });
    parent.appendChild(ele);
  };
  Util.prototype.ajax = function ajax(options, success, error) {
    const request = getXhr();
    if (!request) return false;

    request.open(options.method || 'GET', options.url, true);
    if (options.method === 'POST') {
      request.setRequestHeader(
        'Content-type',
        'application/x-www-form-urlencoded',
      );
    }
    request.onreadystatechange = function stateChanged() {
      if (this.readyState === XMLHttpRequest.DONE) {
        if (this.status >= 200 && this.status < 400) {
          if (typeof success === 'function') {
            let response = this.responseText;
            if (options.json) {
              try {
                response = JSON.parse(this.responseText);
              } catch (e) {
                response = undefined;
              }
            }

            success(response);
          }
        } else if (typeof error === 'function') {
          error(this);
        }
      }
    };
    request.send(options.data);
    return request;
  };

  const util = new Util();
  window.Util = util;

  function M() {
    const adMeta = {};
    const campaignMeta = {};
    const user = {};
    this.options = {
      container: 'm-sdk-wrapper'
    };

    this.init = (options) => {
      if (!options.locationId) {
        throw new Error('locationId must be provided in options');
      }

      extend(this.options, options);
      adMeta.li = options.locationId;
      adMeta.m = util.getMac(options.macFieldName) || options.macFieldName;
      adMeta.ap = util.getMac(options.ap) || options.ap;
      adMeta.m = standardizeMacAddressCNA(adMeta.m);
      adMeta.ap = standardizeMacAddressCNA(adMeta.ap);
      console.log('params', options);
      extend(adMeta, options.meta);
    };
    const getData = (asQueryString, additionalData) => {
      const data = extend({}, adMeta, additionalData);
      if (!asQueryString) return data;
      return toQueryString(data);
    };
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const restApiHost = '<%= locals.restApiHost %>' || '127.0.0.1:3000';
    const restApiRoot = '<%= locals.restApiRoot %>' || '/api';
    const urls = {
      pick: `${restApiRoot}/a_d/pick`,
      impression: `${restApiRoot}/tracking/impression`,
      click: `${restApiRoot}/tracking/click`,
      visit: `${restApiRoot}/tracking/visit`,
      phoneCode: `${restApiRoot}/verify/get/phone`,
      verifyPhoneCode: `${restApiRoot}/verify/phone`,
      emailCode: `${restApiRoot}/verify/get/email`,
      verifyEmailCode: `${restApiRoot}/verify/email`,
      checkVoucher: `${restApiRoot}/vouchers/check`
    };
    // genex | aerohive | engenius | aruba | aruba_mobility | ruijie | unifi | tplink | ruckus | ruckus_alone | meraki_cloud | xirrus | mikrotik | chillispot | pfsense | cisco_wlc
    // ruckus_alone
    // {
//   formAction = this.options.loginurl.split('?')[0];
//   const iProxy = document.createElement('input');
//   iProxy.setAttribute('type', 'hidden');
//   iProxy.setAttribute('name', 'proxy');
//   const iUip = document.createElement('input');
//   iUip.setAttribute('type', 'hidden');
//   iUip.setAttribute('name', 'uip');
//   const iClientMac = document.createElement('input');
//   iClientMac.setAttribute('type', 'hidden');
//   iClientMac.setAttribute('name', 'client_mac');
//   const iUsr = document.createElement('input');
//   iUsr.setAttribute('type', 'hidden');
//   iUsr.setAttribute('name', 'username');
//   const iPass = document.createElement('input');
//   iPass.setAttribute('type', 'hidden');
//   iPass.setAttribute('name', 'password');
//   const iUrl = document.createElement('input');
//   iUrl.setAttribute('type', 'hidden');
//   iUrl.setAttribute('name', 'url');

//   formLogAp.appendChild(iProxy);
//   formLogAp.appendChild(iUip);
//   formLogAp.appendChild(iClientMac);
//   formLogAp.appendChild(iUsr);
//   formLogAp.appendChild(iPass);
//   formLogAp.appendChild(iUrl);

//   document.getElementsByTagName('body')[0].appendChild(formLogAp);
//   formLogAp.elements.proxy.value = window.getQueryVariableFromQuery(this.options.loginurl.split('?')[1], 'proxy');
//   formLogAp.elements.uip.value = window.getQueryVariableFromQuery(this.options.loginurl.split('?')[1], 'uip');
//   formLogAp.elements.client_mac.value = window.getQueryVariableFromQuery(this.options.loginurl.split('?')[1], 'client_mac');
//   formLogAp.elements.username.value = window.getQueryVariableFromQuery(this.options.loginurl.split('?')[1], 'username');
//   formLogAp.elements.password.value = window.getQueryVariableFromQuery(this.options.loginurl.split('?')[1], 'password');
//   formLogAp.elements.url.value = this.urlFor('click', params);
//   break;
// }
    this.loginAP = (params = {}, getLink = false, loginParams = {}) => {
      const formLogAp = document.createElement('form');
      formLogAp.setAttribute('method', 'POST');
      let pass = false;
      let formAction = '/wifi/login';
      let loginUrl = '';
      console.log('this.loginAP', this.options.ap_type);
      switch (this.options.ap_type) {
        case 'genex': {
          formAction = this.options.loginurl;
          const iRedirect = document.createElement('input');
          iRedirect.setAttribute('type', 'hidden');
          iRedirect.setAttribute('name', 'redirect');
          formLogAp.appendChild(iRedirect);
          document.getElementsByTagName('body')[0].appendChild(formLogAp);
          formLogAp.elements.redirect.value = `${protocol}//${restApiHost}${urls.click}?${getData(
            true,
            params,
          )}`;
          break;
        }
        case 'aruba':
        case 'aerohive': {
          // formAction = `${protocol}//${restApiHost}${urls.click}?${getData(
          //   true,
          //   Object.assign({}, params, { redirect: this.options.loginurl }),
          // )}`;
          loginUrl = `${protocol}//${restApiHost}${urls.click}?${getData(
            true,
            Object.assign({}, params, { redirect: this.options.loginurl }),
          )}`;
          // window.location.replace(decodeURIComponent(this.urlFor('click', Object.assign({}, params, { redirect: this.options.loginurl }))));
          pass = true;
          break;
        }
        case 'ruijie': {
          // formAction = decodeURIComponent(this.urlFor('click')); // { isRuijie: true }
          loginUrl = decodeURIComponent(this.urlFor('click', params));
          pass = true;
          break;
        }
        case 'engenius': {
          formAction = this.options.loginurl;
          const iusr = document.createElement('input');
          iusr.setAttribute('type', 'hidden');
          iusr.setAttribute('name', 'username');

          const ipswrd = document.createElement('input');
          ipswrd.setAttribute('type', 'hidden');
          ipswrd.setAttribute('name', 'password');

          const iUserurl = document.createElement('input');
          iUserurl.setAttribute('type', 'hidden');
          iUserurl.setAttribute('name', 'userurl');

          const iRedirecturl = document.createElement('input');
          iRedirecturl.setAttribute('type', 'hidden');
          iRedirecturl.setAttribute('name', 'redirect');

          formLogAp.appendChild(iusr);
          formLogAp.appendChild(ipswrd);
          formLogAp.appendChild(iUserurl);
          formLogAp.appendChild(iRedirecturl);

          document.getElementsByTagName('body')[0].appendChild(formLogAp);
          formLogAp.elements.username.value = '0';
          formLogAp.elements.password.value = '0';
          formLogAp.elements.userurl.value = encodeURIComponent(this.urlFor('click', params));
          formLogAp.elements.redirect.value = this.urlFor('click', params);
          break;
        }
        case 'meraki_cloud': {
          formAction = this.options.loginurl;
          const iusr = document.createElement('input');
          iusr.setAttribute('type', 'hidden');
          iusr.setAttribute('name', 'username');

          const ipswrd = document.createElement('input');
          ipswrd.setAttribute('type', 'hidden');
          ipswrd.setAttribute('name', 'password');

          const iRedirecturl = document.createElement('input');
          iRedirecturl.setAttribute('type', 'hidden');
          iRedirecturl.setAttribute('name', 'continue_url');

          formLogAp.appendChild(iusr);
          formLogAp.appendChild(ipswrd);
          formLogAp.appendChild(iRedirecturl);

          document.getElementsByTagName('body')[0].appendChild(formLogAp);
          formLogAp.elements.username.value = 'genex';
          formLogAp.elements.password.value = 'genexwifi';
          // formLogAp.elements.userurl.value = encodeURIComponent(this.urlFor('click', params));
          formLogAp.elements.continue_url.value = decodeURIComponent(this.urlFor('click', params));
          break;
        }
        case 'cisco_wlc': {
          formAction = this.options.loginurl;
          const iNetwork = document.createElement('input');
          iNetwork.setAttribute('type', 'hidden');
          iNetwork.setAttribute('name', 'network_name');

          const iRedirecturl = document.createElement('input');
          iRedirecturl.setAttribute('type', 'hidden');
          iRedirecturl.setAttribute('name', 'redirect_url');

          const iButtonClicked = document.createElement('input');
          iButtonClicked.setAttribute('type', 'hidden');
          iButtonClicked.setAttribute('name', 'buttonClicked');

          const iErrFlag = document.createElement('input');
          iErrFlag.setAttribute('type', 'hidden');
          iErrFlag.setAttribute('name', 'err_flag');

          const iErrMsg = document.createElement('input');
          iErrMsg.setAttribute('type', 'hidden');
          iErrMsg.setAttribute('name', 'err_msg');

          const iInfoFlag = document.createElement('input');
          iInfoFlag.setAttribute('type', 'hidden');
          iInfoFlag.setAttribute('name', 'info_flag');

          const iInfoMsg = document.createElement('input');
          iInfoMsg.setAttribute('type', 'hidden');
          iInfoMsg.setAttribute('name', 'info_msg');

          formLogAp.appendChild(iNetwork);
          formLogAp.appendChild(iRedirecturl);
          formLogAp.appendChild(iButtonClicked);
          formLogAp.appendChild(iErrFlag);
          formLogAp.appendChild(iErrMsg);
          formLogAp.appendChild(iInfoFlag);
          formLogAp.appendChild(iInfoMsg);

          document.getElementsByTagName('body')[0].appendChild(formLogAp);
          formLogAp.elements.buttonClicked.value = '4';
          formLogAp.elements.err_flag.value = '0';
          formLogAp.elements.err_msg.value = '';
          formLogAp.elements.info_flag.value = '0';
          formLogAp.elements.info_msg.value = '';
          formLogAp.elements.network_name.value = this.options.wlan;
          formLogAp.elements.redirect_url.value = decodeURIComponent(this.urlFor('click', params));
          break;
        }
        case 'pfsense': {
          formAction = this.options.loginurl;
          const iMac = document.createElement('input');
          iMac.setAttribute('type', 'hidden');
          iMac.setAttribute('name', 'clientmac');

          const iClientIp = document.createElement('input');
          iClientIp.setAttribute('type', 'hidden');
          iClientIp.setAttribute('name', 'clientip');

          const iZone = document.createElement('input');
          iZone.setAttribute('type', 'hidden');
          iZone.setAttribute('name', 'zone');

          const iRedirectUrl = document.createElement('input');
          iRedirectUrl.setAttribute('type', 'hidden');
          iRedirectUrl.setAttribute('name', this.options.redirect_param);

          const iButton = document.createElement('input');
          iButton.setAttribute('type', 'submit');
          iButton.setAttribute('name', 'accept');
          iButton.style.cssText = 'display: none;';

          formLogAp.appendChild(iMac);
          formLogAp.appendChild(iClientIp);
          formLogAp.appendChild(iZone);
          formLogAp.appendChild(iRedirectUrl);
          formLogAp.appendChild(iButton);

          document.getElementsByTagName('body')[0].appendChild(formLogAp);
          formLogAp.elements.clientmac.value = this.options.clientmac;
          formLogAp.elements.clientip.value = this.options.clientip;
          formLogAp.elements.zone.value = this.options.portalzone;
          formLogAp.elements.accept.value = 'Continue';
          formLogAp.elements[this.options.redirect_param].value = decodeURIComponent(this.urlFor('click', params));
          break;
        }
        case 'aruba_mobility':
        case 'tplink': {
          // if (this.options.redirectUrl === 'http://genexwifi.com' || this.options.redirectUrl === 'http://cloud.genexwifi.com') {
            loginUrl = `${this.options.loginurl}&${this.options.redirect_param}=${this.urlFor('click', params)}`;
          // } else {
          //   loginUrl = `${this.options.loginurl}&${this.options.redirect_param}=${encodeURIComponent(this.urlFor('click', params))}`;
          // }
          pass = true;
          break;
        }
        case 'chillispot': {
          const urlParams = window.getJsonFromUrl();
          const clickUrl = this.urlFor('click', params);
          loginUrl = `${this.options.loginurl}?challenge=${urlParams.challenge}&uamip=${urlParams.uamip}&uamport=${urlParams.uamport}&UserName=genex&Password=genexwifi&userurl=${clickUrl}&redirurl=${clickUrl}&button=Login&mac=${urlParams.mac}`;
          pass = true;
          break;
        }
        case 'xirrus':
        case 'mikrotik':
        case 'draytek':
        case 'ruckus_alone':
        case 'ruckus': {
          let loginCaptive = this.options.loginurl;
          if (Object.keys(loginParams).length) {
            Object.keys(loginParams).forEach((key) => {
              if (key === 'username') {
                loginCaptive = loginCaptive.replace('username=genex', `username=${loginParams[key]}`);
              }
              if (key === 'password') {
                loginCaptive = loginCaptive.replace('password=genexwifi', `password=${loginParams[key]}`);
              }
            });
            // username=genex&password=genexwifi
          }
          loginUrl = `${loginCaptive}&${this.options.redirect_param}=${this.urlFor('click', Object.assign({}, params, { model: '', lci: '' }))}`;
          pass = true;
          break;
        }
        case 'ruckus_cloud': {
          loginUrl = `/ruckus_cloud_login?${getData(true, {
            loginurl: this.options.loginurl,
            uip: this.options.uip,
            client_mac: this.options.client_mac,
            integrageKey: this.options.integrageKey,
            redirect: this.urlFor('click', params)
          })}`;
          pass = true;
          break;
        }
        case 'unifi': {
          loginUrl = `/unifiLogin?${getData(true, {
            si: this.options.siteId,
            lci: this.options.groupId,
            redirect: this.urlFor('click', params)
          })}`;
          pass = true;
          break;
        }
        case 'extreme': {
          loginUrl = `${protocol}//${restApiHost}${urls.click}?${getData(
            true,
            Object.assign({}, params, {
              loginCode: JSON.stringify({ type: 'extreme', loginurl: this.options.loginurl, f_hs_server: window.getQueryVariable('hs_server'), f_Qv: encodeURIComponent(window.getQueryVariable('Qv')) })
              // redirect: `${this.options.loginurl}?f_agree=&f_hs_server=${window.getQueryVariable('hs_server')}&f_curr_time=${Math.floor(new Date().getTime() / 1000)}&f_Qv=${encodeURIComponent(window.getQueryVariable('Qv'))}&submit=${encodeURIComponent('I Agree')}`
            }),
          )}`;
          pass = true;
          break;
        }
        case 'zyxelNebula': {
          loginUrl = `${protocol}//${restApiHost}${urls.click}?${getData(
            true,
            Object.assign({}, params, {
              loginCode: JSON.stringify({ type: 'zyxelNebula', loginurl: this.options.loginurl })
              // redirect: `${this.options.loginurl}?f_agree=&f_hs_server=${window.getQueryVariable('hs_server')}&f_curr_time=${Math.floor(new Date().getTime() / 1000)}&f_Qv=${encodeURIComponent(window.getQueryVariable('Qv'))}&submit=${encodeURIComponent('I Agree')}`
            }),
          )}`;
          pass = true;
          break;
        }
        default: break;
      }
      if (getLink) {
        return loginUrl;
      } else if (pass) {
        window.location.replace(loginUrl);
      } else if (this.options.ap_type === 'pfsense') {
        formLogAp.setAttribute('action', formAction);
        document.getElementsByName('accept')[0].click();
      } else {
        formLogAp.setAttribute('action', formAction);
        formLogAp.submit();
      }
    };

    this.unifiLoginLink = (additionalData = {}) => `${protocol}//${restApiHost}/unifiLogin?${getData(
          true,
          Object.assign({}, additionalData, { si: this.options.siteId, lci: this.options.groupId }),
        )}`;
    this.AerohiveLogin = (params = {}) => {
        const formLogAer = document.createElement('form');
        formLogAer.setAttribute('method', 'POST');
        formLogAer.setAttribute('action', `${protocol}//${restApiHost}${urls.click}?${getData(
          true,
          Object.assign({}, params, { redirect: this.options.loginurl }),
        )}`);
        document.getElementsByTagName('body')[0].appendChild(formLogAer);
        formLogAer.submit();
        console.log(formLogAer.action);
    };

    this.voucherLogin = (code, trackingClick) => { // support engenius
        const formLogVouEng = document.createElement('form');
        formLogVouEng.setAttribute('method', 'POST');
        formLogVouEng.setAttribute('action', `${protocol}//${restApiHost}/voucher_login?${getData(
          true,
          { m: this.options.macFieldName },
        )}`);

        const iCode = document.createElement('input');
        iCode.setAttribute('type', 'hidden');
        iCode.setAttribute('name', 'voucher');

        const iloginurl = document.createElement('input');
        iloginurl.setAttribute('type', 'hidden');
        iloginurl.setAttribute('name', 'loginurl');

        const iUserurl = document.createElement('input');
        iUserurl.setAttribute('type', 'hidden');
        iUserurl.setAttribute('name', 'userurl');

        formLogVouEng.appendChild(iCode);
        formLogVouEng.appendChild(iloginurl);
        formLogVouEng.appendChild(iUserurl);

        document.getElementsByTagName('body')[0].appendChild(formLogVouEng);
        formLogVouEng.elements.voucher.value = code;
        formLogVouEng.elements.loginurl.value = this.options.loginurl || this.options.wifiex4u_login;
        formLogVouEng.elements.userurl.value = trackingClick;

        formLogVouEng.submit();
    };

    this.voucherLoginHG = (code, trackingClick) => { // login voucher with Genex HG
        const formLogHGVou = document.createElement('form');
        formLogHGVou.setAttribute('method', 'POST');
        formLogHGVou.setAttribute('action', this.options.loginurl || '/login');

        const iRedirect = document.createElement('input');
        iRedirect.setAttribute('type', 'hidden');
        iRedirect.setAttribute('name', 'redirect');

        const iCode = document.createElement('input');
        iCode.setAttribute('type', 'hidden');
        iCode.setAttribute('name', 'voucher');

        const iLocation = document.createElement('input');
        iLocation.setAttribute('type', 'hidden');
        iLocation.setAttribute('name', 'locationId');

        formLogHGVou.appendChild(iCode);
        formLogHGVou.appendChild(iRedirect);
        formLogHGVou.appendChild(iLocation);

        document.getElementsByTagName('body')[0].appendChild(formLogHGVou);
        formLogHGVou.elements.redirect.value = trackingClick;
        formLogHGVou.elements.voucher.value = code;
        formLogHGVou.elements.locationId.value = this.options.locationId;

        formLogHGVou.submit();
    };

    const createFormLogin = (options) => {
      const formLogEng = document.createElement('form');
      formLogEng.setAttribute('method', 'POST');
      formLogEng.setAttribute('name', 'formLogin');

      if (options.ap_type && window.generateLogin && (options.redirect_param || options.isUnifi)) {
        const loginBtn = document.getElementById('submitLoginButton');
        console.log('create code login', getData(), `${this.options.loginurl}&${this.options.redirect_param}=${this.urlFor('click')}`);
        loginBtn.onclick = () => {
          window.M.loginAP();
          // let redirectUrl = this.urlFor('click');
          // if (['tplink', 'engenius'].indexOf(this.options.ap_type) > -1) {
          //   redirectUrl = encodeURIComponent(redirectUrl);
          // }
          // window.location.replace(`${this.options.loginurl}&${this.options.redirect_param}=${redirectUrl}`);
        };
      } else if (options.loginurl) { // engenius or Ruijie
        formLogEng.setAttribute('action', options.loginurl || '/login');
        const iusr = document.createElement('input');
        iusr.setAttribute('type', 'hidden');
        iusr.setAttribute('name', 'username');

        const ipswrd = document.createElement('input');
        ipswrd.setAttribute('type', 'hidden');
        ipswrd.setAttribute('name', 'password');

        const iUserurl = document.createElement('input');
        iUserurl.setAttribute('type', 'hidden');
        iUserurl.setAttribute('name', 'userurl');

        formLogEng.appendChild(iusr);
        formLogEng.appendChild(ipswrd);
        formLogEng.appendChild(iUserurl);

        document.getElementsByTagName('body')[0].appendChild(formLogEng);
        formLogEng.elements.username.value = '0';
        formLogEng.elements.password.value = '0';
      } else if (options.isUnifi) { // unifi
        formLogEng.setAttribute('action', `/unifiLogin?${getData(true, { si: options.siteId, lci: options.groupId, m: options.mac })}`);
        document.getElementsByTagName('body')[0].appendChild(formLogEng);
      }
    };

    this.urlFor = (action, additionalData = {}) => {
      if (this.options.isUnifi) {
          additionalData.si = this.options.siteId;
      }
      if (this.options.ap_type === 'ruijie') {
        additionalData.model = 'ruijie';
      }
      if (!urls[action]) return '';
      if (this.options.loginurl && ['click'].indexOf(action) > -1) {
          return encodeURIComponent(`${protocol}//${restApiHost}${urls[action]}?${getData(
            true,
            additionalData,
          )}`);
      }
      return `${protocol}//${restApiHost}${urls[action]}?${getData(
        true,
        additionalData,
      )}`;
    };

    this.track = (action, additionalData = {}) => {
      if (!urls[action]) return;
      const src = this.urlFor(action, additionalData);
      util.renderElement('img', {
        width: 0,
        height: 0,
        style: 'display: none',
        src
      });
    };

    let adContainer;
    const onLoadAdSuccess = (data) => {
      setTimeout(() => {
        const adBanner = document.getElementById('adBanner');
        if (adBanner && !adBanner.clientHeight) {
          document.body.innerHTML = '<h3 style="text-align: center; color: red;">Please disable Adblock Plugin and refresh web page to continue!</h3>';
          // alert('Please disable Adblock Plugin to continue!');
        }
      }, 500);
      extend(user, data.user);
      extend(adMeta, data.adMeta);
      this.options.meta = data.adMeta;
      extend(campaignMeta, data.campaignMeta);

      if (!adContainer && this.options.container) {
        adContainer = document.getElementById(this.options.container);
      }
      if (!adContainer) {
        adContainer = document.createElement('div');
        adContainer.setAttribute(
          'id',
          this.options.container || new Date().getTime(),
        );
        adContainer.setAttribute('style', 'width: 100%; height: 100%;');
        document.body.appendChild(adContainer);
      }
      // add meta Google Sign In
      if (campaignMeta.ggAppClientId) {
          console.log('add meta Google Sign In', campaignMeta);
          if (campaignMeta.ggEmailLogin) {
              this.options.loginViaEmail = true;
          }
          // const metaGGClient = document.createElement('meta');
          // metaGGClient.name = 'google-signin-client_id';
          // metaGGClient.content = campaignMeta.ggAppClientId;
          // document.body.appendChild(metaGGClient);

          const scriptGGClient = document.createElement('script');
          // scriptGGClient.src = 'https://apis.google.com/js/platform.js?onload=renderGoogleButton';
          // scriptGGClient.setAttribute('async', '');
          // scriptGGClient.setAttribute('defer', '');
          // document.body.appendChild(scriptGGClient);
          scriptGGClient.src = 'https://apis.google.com/js/api:client.js';
          document.getElementsByTagName('head')[0].appendChild(scriptGGClient);
          setTimeout(() => {
            const scriptLoadGG = document.createElement('script');
            scriptLoadGG.setAttribute('type', 'text/javascript');
            scriptLoadGG.appendChild(document.createTextNode(`attachGoogleFunction("${campaignMeta.ggAppClientId}")`));
            document.body.appendChild(scriptLoadGG);
            util.renderElement('img', {
              width: 0,
              height: 0,
              style: 'display: none',
              src: 'https://accounts.google.com/Logout'
            });
          }, 1000);
      }
      // meta facebook
      console.log('campaignMeta', campaignMeta);
      const likedSession = sessionStorage.getItem('likedPage');
      if (likedSession) {
        sessionStorage.removeItem('likedPage');
        // return;
      }

      // replace locationId && storeId
      if (this.options.isCatfish) {
        console.log('replace locationId && storeId');
        data.html = data.html.replace('{locationId}', this.options.locationId);
      }
      adContainer.innerHTML = data.html;
      runScriptOnInnerHTML(adContainer, () => {
        const metaKeywords = document.querySelector('meta[name="keywords"]') || document.querySelector('meta[name="news_keywords"]');
        console.log('metaKeywords', metaKeywords);
        if (adMeta.ci) {
          [this.urlFor('impression'),
          this.options.isCatfish ? this.urlFor('visit', {
              host: location.host,
              keywords: metaKeywords ? metaKeywords.content : ''
          }) : '']
          .concat(campaignMeta.impressionUrls || [])
          .forEach(src =>
            util.renderElement('img', {
              width: 0,
              height: 0,
              style: 'display: none',
              src
            }),
          );
        }
          if (document.formLogin) {
              if (this.options.loginurl) {
                  document.formLogin.action = this.options.loginurl;
              } else if (this.options.isRuijie) {
                  document.formLogin.action = `${this.options.loginurl}/auth?token=wifiex4u`;// /wifidog
              } else if (this.options.isUnifi) {
                  document.formLogin.action = `/unifiLogin?${getData(true, { si: this.options.siteId, lci: this.options.groupId, m: this.options.mac })}`;
              } else {
                  this.options.loginurl = `${location.origin}/login`;// location.origin
              }
          } else {
              createFormLogin(this.options);
          }

          // change data device
          if (data.device) {
              if (data.device.fb) {
                  data.device.audience.name = data.device.fb.fbName;
                  data.device.audience.email = data.device.fb.email;
                  data.device.audience.gender = data.device.fb.gender;
              }
              if (data.device.google) {
                  extend(data.device.audience, data.device.google);
              }
              const divName = document.getElementById('audience.name');
              if (divName) {
                  if (data.device.fb) {
                      divName.style['white-space'] = 'nowrap';
                      divName.style.position = 'relative';
                      divName.style['margin-left'] = '32px';
                      divName.innerHTML = `<img class="img-circle img-xs" style="border-radius: 50%;width: 32px;height: 32px;position:absolute;left:-32px;top:-4px;"
                        src="https://graph.facebook.com/v2.9/${data.device.fb.fbId}/picture">
                        <a target="_blank"
                          href="https://facebook.com/${data.device.fb.fbId}">
                          ${data.device.fb.fbName}</a>`;
                  } else {
                      divName.innerHTML = data.device.audience.name;
                  }
              }
          }
      });
    };

    const onLoadAdFailed = () => {
      util.renderElement('script', { src: this.urlFor('pick') });
    };

    const loadAd = () => {
      // mac os will failed with xdomain request
      if (/mac os/i.test(navigator.userAgent)) {
        onLoadAdFailed();
        return;
      }
      util.renderElement('div', {
        id: 'adBanner',
        style: 'background-color: transparent; width: 1px; height: 1px;'
      });

      const pickUrl = this.urlFor('pick', { f: 'json', v: VERSION });
      const request = util.ajax(
        { url: pickUrl, json: true },
        onLoadAdSuccess,
        onLoadAdFailed,
      );
      if (request === false) {
        onLoadAdFailed();
      }
    };

    this.loadAd = (container) => {
      if (typeof container === 'string') {
        this.options.container = container;
      }
      if (!this.options.mac && this.options.isCatfish && this.options.apRoute) {
          util.ajax(
            { url: `http://${this.options.apRoute}/wifi/remote_mac` },
            (mac) => {
                extend(this.options, { mac });
                extend(adMeta, { m: mac });
                loadAd();
            },
            () => loadAd(),
          );
      } else {
          loadAd();
      }
    };

    this.setAd = onLoadAdSuccess;

    this.loginFacebook = (redirect, params = {}) => {
      if (!campaignMeta.fbAppId) {
        throw new Error('Campaign has no Facebook AppId provided');
      }
      // let redirectUrl = `${protocol}//${restApiHost}${restApiRoot}/fb/login`;
      let redirectUrl = 'https://gapis.genexwifi.com/api/fb/login';
      let redirectSuccess = '';
      if (campaignMeta.fbAppDomain) {
        // const restApiPort = restApiHost.split(':')[1];
        // const fbHost = `${campaignMeta.fbAppDomain}${restApiPort
        //   ? `:${restApiPort}`
        //   : ''}`;
        // redirectUrl = redirectUrl.replace(restApiHost, fbHost);
        redirectUrl = `https://${campaignMeta.fbAppDomain}/api/fb/login`;
      } else {
        redirectUrl = 'https://gapis.genexwifi.com/api/fb/login';
      }
      switch (this.options.ap_type) {
        case 'aerohive':
          redirectSuccess = `${protocol}//${restApiHost}${urls.click}?${getData(
            true,
            { redirect: encodeURIComponent(this.options.loginurl) },
          )}`;
          break;
        case 'ruijie':
          redirectSuccess = decodeURIComponent(this.urlFor('click'));
          break;
        case 'engenius':
          redirectSuccess = `${this.options.loginurl}&${this.options.redirect_param}=${encodeURIComponent(encodeURIComponent(redirect))}`;
          break;
        case 'aruba':
        case 'aruba_mobility':
        case 'meraki_cloud':
        case 'tplink':
        case 'xirrus':
        case 'mikrotik':
        case 'draytek':
        case 'ruckus_alone':
        case 'ruckus':
          redirectSuccess = `${this.options.loginurl}&${this.options.redirect_param}=${encodeURIComponent(redirect)}`;
          break;
        case 'unifi':
          redirectSuccess = `${protocol}//${restApiHost}/unifiLogin?${getData(true, {
            si: this.options.siteId,
            lci: this.options.groupId,
            redirect: encodeURIComponent(this.urlFor('click', params))
          })}`;
          break;
        case 'chillispot': {
          const urlParams = window.getJsonFromUrl();
          const clickUrl = this.urlFor('click', params);
          redirectSuccess = `${this.options.loginurl}?challenge=${urlParams.challenge}&uamip=${urlParams.uamip}&uamport=${urlParams.uamport}&UserName=genex&Password=genexwifi&userurl=${clickUrl}&redirurl=${clickUrl}&button=Login&mac=${urlParams.mac}`;
          break;
        }
        case 'cisco_wlc': {
          redirectSuccess = `${protocol}//${restApiHost}/redirect_login?${getData(true, {
            ap_type: this.options.ap_type,
            loginurl: this.options.loginurl,
            wlan: this.options.wlan,
            redirect: encodeURIComponent(this.urlFor('click', params))
          })}`;
          break;
        }
        default: redirectSuccess = `${this.options.loginurl}?redirect=${redirect}`;
      }

      const loginFbParams = toQueryString({
        client_id: campaignMeta.fbAppId,
        scope: `email${campaignMeta.fbFeed === 'implicit'
          ? ',publish_actions'
          : ''}`,
        redirect_uri: redirectUrl,
        state: getData(false, Object.assign({}, {
          redirect: redirectSuccess,
          failRoute: window.location.href
        }, params))
      });
      console.log('redirect_uri', redirectUrl);
      window.location.replace(`https://www.facebook.com/v2.9/dialog/oauth?${loginFbParams}`);
    };

    this.loginGoogle = (id, email, loginUrl, { success, error }) => {
      if (!campaignMeta.ggAppClientId) {
        throw new Error('Campaign has no Google ClientId provided');
      }
      if (!id || !email) throw new Error('Id and email must be provided');
      const mac = util.getMac(this.options.macFieldName) || this.options.macFieldName;
      const clickUrl = encodeURIComponent(this.urlFor('click', { m: mac, email, google: `id||${id}||email||${email}` }));
      util.ajax(
        {
            method: 'POST',
            url: loginUrl,
            data: `redirect=${clickUrl}&email=${email}`
        },
        success,
        error,
      );
    };

    this.sendPhoneCode = (phone, { success, error }) => {
      if (!phone) throw new Error('phone must be provided');
      util.ajax({ url: this.urlFor('phoneCode', { phone }) }, success, error);
    };

    this.verifyPhoneCode = (code, { redirect, success, error }) => {
      if (!code) throw new Error('code must be provided');
      util.ajax(
        { url: this.urlFor('verifyPhoneCode', { code, redirect }) },
        success,
        error,
      );
    };

    this.sendEmailCode = (email, { redirect, success, error }) => {
      if (!email) throw new Error('email must be provided');
      util.ajax(
        { url: this.urlFor('emailCode', { email, redirect }) },
        success,
        error,
      );
    };

    this.verifyEmailCode = (code, { success, error }) => {
      if (!code) throw new Error('code must be provided');
      util.ajax(
        { url: this.urlFor('verifyEmailCode', { code }) },
        success,
        error,
      );
    };

    this.checkVoucher = (code, { success, error }) => {
      if (!code) throw new Error('code must be provided');
      util.ajax(
        { url: this.urlFor('checkVoucher', { code }) },
        success,
        error,
      );
    };
  }
  M.version = VERSION;

  window.renderGoogleButton = () => {
    gapi.signin2.render('gg_signin2', {
      width: 300,
      longtitle: true,
      theme: 'dark',
      onsuccess: (googleUser) => {
          const Msdk = window.M;
          const mac = util.getMac(Msdk.options.macFieldName) || Msdk.options.macFieldName;
          const id = googleUser.getAuthResponse().id_token;
          const email = googleUser.getBasicProfile().getEmail();
          const fullName = googleUser.getBasicProfile().getName();
          const clickUrl = encodeURIComponent(Msdk.urlFor('click', { m: mac, email, google: `id||${id}||email||${email}||name||${fullName}` }));
          if (Msdk.options.ap_type) { // aerohive
            console.log('login google follow type', Msdk.options.loginurl);
            Msdk.loginAP({ email, google: `id||${id}||email||${email}||name||${fullName}` });
          } else {
            console.log('post login loginViaEmail', Msdk.options.loginViaEmail);
            if (Msdk.options.wifiex4u_login) {
              window.location.replace(`${Msdk.options.loginurl}?${Msdk.options.loginViaEmail ? `redirect=${clickUrl}&email=${email}` : `redirect=${clickUrl}`}`);
            } else {
              window.location.replace(`${Msdk.options.loginurl}?${Msdk.options.loginViaEmail ? `redirect=${clickUrl}&email=${email}` : `redirect=${clickUrl}`}&userurl=${encodeURIComponent(clickUrl)}&username=0&password=0`);
            }
          }

          // util.ajax(
          //   {
          //       method: 'POST',
          //       url: Msdk.options.loginurl || "/login",
          //       data: Msdk.options.loginViaEmail?"redirect="+clickUrl+"&email="+email:"redirect="+clickUrl //+"&email="+email
          //   },
          //   (res)=>{
          //       let GoogleAuth = gapi.auth2.getAuthInstance();
          //       GoogleAuth.signOut().then(()=>{
          //           GoogleAuth.disconnect();
          //           googleUser.disconnect();
          //           document.write(res);
          //       });
          //   },
          //   (error)=>{ console.log('errsend', error) }
          // );
      },
      onfailure: (error) => {
          console.log('onFailure', error);
          location.reload();
      }
    });
  };

  window.attachGoogleFunction = (ggId) => {
    console.log('attachGoogleFunction', gapi);
    if (!document.getElementById('gg_signin_custom')) {
      return;
    }
    gapi.load('auth2', () => {
      // Retrieve the singleton for the GoogleAuth library and set up the client.
      const auth2 = gapi.auth2.init({
        client_id: ggId,
        cookiepolicy: 'single_host_origin'
        // Request scopes in addition to 'profile' and 'email'
        // scope: 'additional_scope'
      });
      auth2.attachClickHandler(document.getElementById('gg_signin_custom'), {},
        (googleUser) => {
            const Msdk = window.M;
            const mac = util.getMac(Msdk.options.macFieldName) || Msdk.options.macFieldName;
            const id = googleUser.getAuthResponse().id_token;
            const email = googleUser.getBasicProfile().getEmail();
            const fullName = googleUser.getBasicProfile().getName();
            const clickUrl = encodeURIComponent(Msdk.urlFor('click', { m: mac, email, google: `id||${id}||email||${email}||name||${fullName}` }));
            if (Msdk.options.ap_type) { // aerohive
              console.log('login google follow type', Msdk.options.loginurl);
              Msdk.loginAP({ email, google: `id||${id}||email||${email}||name||${fullName}` });
            } else {
              console.log('post login loginViaEmail', Msdk.options.loginViaEmail);
              if (Msdk.options.wifiex4u_login) {
                window.location.replace(`${Msdk.options.loginurl}?${Msdk.options.loginViaEmail ? `redirect=${clickUrl}&email=${email}` : `redirect=${clickUrl}`}`);
              } else {
                window.location.replace(`${Msdk.options.loginurl}?${Msdk.options.loginViaEmail ? `redirect=${clickUrl}&email=${email}` : `redirect=${clickUrl}`}&userurl=${encodeURIComponent(clickUrl)}&username=0&password=0`);
              }
            }

            // util.ajax(
            //   {
            //       method: 'POST',
            //       url: Msdk.options.loginurl || "/login",
            //       data: Msdk.options.loginViaEmail?"redirect="+clickUrl+"&email="+email:"redirect="+clickUrl //+"&email="+email
            //   },
            //   (res)=>{
            //       let GoogleAuth = gapi.auth2.getAuthInstance();
            //       GoogleAuth.signOut().then(()=>{
            //           GoogleAuth.disconnect();
            //           googleUser.disconnect();
            //           document.write(res);
            //       });
            //   },
            //   (error)=>{ console.log('errsend', error) }
            // );
        },
        (error) => {
            console.log('onFailure', error);
            location.reload();
        }
      );
    });
  };

  window.getJsonFromUrl = () => {
    const query = location.search.substr(1);
    const result = {};
    let decodeString = query;
    try {
      decodeString = decodeURIComponent(query);
    } catch (err) {
      console.log('string decoded', decodeString);
    }
    decodeString.split('&').forEach((part) => {
      const item = part.split('=');
      try {
          result[item[0]] = decodeURIComponent(item[1]);
        } catch (err) {
          result[item[0]] = item[1];
        }
    });
    return result;
  };

  window.getQueryVariable = (variable) => {
    const query = window.location.search.substring(1);
    const vars = query.split(/[?&]/);
    for (let i = 0; i < vars.length; i++) {
      const pair = vars[i].split('=');
      if (pair[0] === variable) {
          if (pair[0] === 'Qv') {
              return vars[i].substr(3, vars[i].length);
          }
          return pair[1];
      }
    }
    return '';
  };

  window.getQueryVariableFromQuery = (query, variable) => {
    const vars = query.split(/[?&]/);
    for (let i = 0; i < vars.length; i++) {
      const pair = vars[i].split('=');
      if (pair[0] === variable) {
          if (pair[0] === 'Qv') {
              return vars[i].substr(3, vars[i].length);
          }
          return pair[1];
      }
    }
    return '';
  };

  window.M = new M();
  window.m = window.M; //  For v2 compatibility
}(window, window.document));
