(function genexJslib(window, document) {
  const VERSION = '1.0.0';

  function toQueryString(obj) {
    const parts = [];
    Object.keys(obj).forEach((i) => {
      let value = obj[i];
      if (Array.isArray(value) || typeof value === 'object') {
        value = JSON.stringify(value);
      }
      parts.push(`${encodeURIComponent(i)}=${encodeURIComponent(value)}`);
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
      'Microsoft.XmlHttp',
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
      '@(([^<>()[\\].,;:\\s@"]+\\.)+[^<>()[\\].,;:\\s@"]{2,})$',
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
  Util.prototype.getMac = function getMac(paramName) {
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
  Util.prototype.renderElement = function renderElement(type, attrs, parent) {
    type = type || 'img';
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

  function GN() {
    const adMeta = {};
    const campaignMeta = {};
    const user = {};
    this.options = {
      container: 'genex-jslib-wrapper',
    };

    this.init = (options) => {
      if (!options.locationId) {
        throw new Error('locationId must be provided in options');
      }

      extend(this.options, options);
      adMeta.li = options.locationId;
      adMeta.m = util.getMac(options.macFieldName) || options.macFieldName;
      adMeta.ap = util.getMac(options.ap) || options.ap;
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
      checkVoucher: `${restApiRoot}/vouchers/check`,
    };
    // genex | aerohive | engenius | aruba
    this.loginAP = (params = {}) => {
      let formLogAp = document.createElement('form');
      formLogAp.setAttribute('method', 'POST');
      let formAction = '/wifi/login';
      switch (this.options.ap_type) {
        case 'genex':
          formAction = this.options.loginurl;
          let iRedirect = document.createElement('input');
          iRedirect.setAttribute('type', 'hidden');
          iRedirect.setAttribute('name', 'redirect');
          formLogAp.appendChild(iRedirect);
          document.getElementsByTagName('body')[0].appendChild(formLogAp);
          formLogAp.elements.redirect.value = `${protocol}//${restApiHost}${urls['click']}?${getData(
            true,
            params,
          )}`;
          break;
        case 'engenius':
          formAction = this.options.loginurl;
          let iusr = document.createElement('input');
          iusr.setAttribute('type', 'hidden');
          iusr.setAttribute('name', 'username');

          let ipswrd = document.createElement('input');
          ipswrd.setAttribute('type', 'hidden');
          ipswrd.setAttribute('name', 'password');

          let iUserurl = document.createElement('input');
          iUserurl.setAttribute('type', 'hidden');
          iUserurl.setAttribute('name', 'userurl');

          formLogAp.appendChild(iusr);
          formLogAp.appendChild(ipswrd);
          formLogAp.appendChild(iUserurl);

          document.getElementsByTagName('body')[0].appendChild(formLogAp);
          formLogAp.elements.username.value = '0';
          formLogAp.elements.password.value = '0';
          formLogAp.elements.userurl.value = encodeURIComponent(`${protocol}//${restApiHost}${urls['click']}?${getData(true, params)}`);
          break;
        case 'aerohive':
          formAction = `${protocol}//${restApiHost}${urls['click']}?${getData(
            true,
            Object.assign({}, params, { redirect: this.options.loginurl }),
          )}`;
          break;
        case 'aruba':
          formAction = this.options.loginurl;
          let iCmd = document.createElement('input');
          iCmd.setAttribute('type', 'hidden');
          iCmd.setAttribute('name', 'cmd');

          let iUsr = document.createElement('input');
          iUsr.setAttribute('type', 'hidden');
          iUsr.setAttribute('name', 'user');

          let iPwd = document.createElement('input');
          iPwd.setAttribute('type', 'hidden');
          iPwd.setAttribute('name', 'password');

          let iUrl = document.createElement('input');
          iUrl.setAttribute('type', 'hidden');
          iUrl.setAttribute('name', 'url');

          formLogAp.appendChild(iCmd);
          formLogAp.appendChild(iUsr);
          formLogAp.appendChild(iPwd);
          formLogAp.appendChild(iUrl);

          document.getElementsByTagName('body')[0].appendChild(formLogAp);
          formLogAp.elements.cmd.value = 'authenticate';
          formLogAp.elements.user.value = '0';
          formLogAp.elements.password.value = '0';
          formLogAp.elements.url.value = `${protocol}//${restApiHost}${urls['click']}?${getData(true, params)}`;
          break;
        default: break;
      }
      formLogAp.setAttribute('action', formAction);
      formLogAp.submit();
    };

    this.unifiLoginLink = (additionalData = {}) => {
        return `${protocol}//${restApiHost}/unifiLogin?${getData(
          true,
          Object.assign({}, additionalData, {m: this.options.mac, si: this.options.siteId}),
        )}`
    };

    this.AerohiveLogin = (params = {}) => {
        let formLogAer = document.createElement('form');
        formLogAer.setAttribute('method', 'POST');
        formLogAer.setAttribute('action', `${protocol}//${restApiHost}${urls['click']}?${getData(
          true,
          Object.assign({}, params, {redirect: this.options.loginurl}),
        )}`);
        document.getElementsByTagName('body')[0].appendChild(formLogAer);
        formLogAer.submit();
        console.log(formLogAer.action);
    };

    this.voucherLogin = (code, trackingClick) => {//support engenius
        let formLogEng = document.createElement('form');
        formLogEng.setAttribute('method', 'POST');
        formLogEng.setAttribute('action', `${protocol}//${restApiHost}/voucher_login?${getData(
          true,
          {m: this.options.mac},
        )}`);

        let iCode = document.createElement('input');
        iCode.setAttribute('type', 'hidden');
        iCode.setAttribute('name', 'voucher');

        let iloginurl = document.createElement('input');
        iloginurl.setAttribute('type', 'hidden');
        iloginurl.setAttribute('name', 'loginurl');

        let iUserurl = document.createElement('input');
        iUserurl.setAttribute('type', 'hidden');
        iUserurl.setAttribute('name', 'userurl');

        formLogEng.appendChild(iCode);
        formLogEng.appendChild(iloginurl);
        formLogEng.appendChild(iUserurl);

        document.getElementsByTagName('body')[0].appendChild(formLogEng);
        formLogEng.elements.voucher.value = code;
        formLogEng.elements.loginurl.value = this.options.loginurl;
        formLogEng.elements.userurl.value = trackingClick;

        formLogEng.submit();

    };

    const createFormLogin = (options) => {
        const formLogin = document.createElement('form');
        formLogin.setAttribute('method', 'POST');
        formLogin.setAttribute('name', 'formLogin');

        if (options.loginurl) { // engenius
            formLogin.setAttribute('action', options.loginurl || '/login');
            const iusr = document.createElement('input');
            iusr.setAttribute('type', 'hidden');
            iusr.setAttribute('name', 'username');

            const ipswrd = document.createElement('input');
            ipswrd.setAttribute('type', 'hidden');
            ipswrd.setAttribute('name', 'password');

            const iUserurl = document.createElement('input');
            iUserurl.setAttribute('type', 'hidden');
            iUserurl.setAttribute('name', 'userurl');
            document.getElementsByTagName('body')[0].appendChild(formLogin);

            formLogin.appendChild(iusr);
            formLogin.appendChild(ipswrd);
            formLogin.appendChild(iUserurl);
            formLogin.elements.username.value = '0';
            formLogin.elements.password.value = '0';
        } else if (options.isUnifi) { // unifi
            formLogin.setAttribute('action', '/unifiLogin?'+getData(true, {si: options.siteId, lci: options.groupId, m: options.mac}));
            document.getElementsByTagName('body')[0].appendChild(formLogin);
        }
    };

    this.urlFor = (action, additionalData = {}) => {
      if(this.options.isUnifi){
          additionalData.si = this.options.siteId;
      }
      if (!urls[action]) return '';
      if(this.options.loginurl && ['click'].indexOf(action) > -1){
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
        src,
      });
    };

    let adContainer;
    const onLoadAdSuccess = (data) => {
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
      //add meta Google Sign In
      if(campaignMeta.ggAppClientId){
          console.log('add meta Google Sign In', campaignMeta);
          if(campaignMeta.ggEmailLogin){
              this.options.loginViaEmail = true;
          }
          var metaGGClient = document.createElement('meta');
          metaGGClient.name = 'google-signin-client_id';
          metaGGClient.content = campaignMeta.ggAppClientId;
          document.body.appendChild(metaGGClient);

          var scriptGGClient = document.createElement('script');
          scriptGGClient.src = 'https://apis.google.com/js/platform.js?onload=renderGoogleButton';
          scriptGGClient.setAttribute('async', '');
          scriptGGClient.setAttribute('defer', '');
          document.body.appendChild(scriptGGClient);
          util.renderElement('img', {
            width: 0,
            height: 0,
            style: 'display: none',
            src: 'https://accounts.google.com/Logout',
          })
      }

      adContainer.innerHTML = data.html;
      runScriptOnInnerHTML(adContainer, () => {
          var metaKeywords = document.querySelector('meta[name="keywords"]') || document.querySelector('meta[name="news_keywords"]');
          console.log('metaKeywords', metaKeywords);
        [this.urlFor('impression'),
        this.options.isCatfish?this.urlFor('visit', {
            host: location.host,
            keywords: metaKeywords?metaKeywords.content:''
        }):'']
          .concat(campaignMeta.impressionUrls || [])
          .forEach(src =>
            util.renderElement('img', {
              width: 0,
              height: 0,
              style: 'display: none',
              src,
            }),
          );
          if(document.formLogin){
              if(this.options.loginurl){
                  document.formLogin.action = this.options.loginurl;
              } else if(this.options.isUnifi) {
                  document.formLogin.action = '/unifiLogin?'+getData(true, {si: this.options.siteId, lci: this.options.groupId, m: this.options.mac})
              } else {
                  this.options.loginurl = location.origin+'/login';//location.origin
              }
          } else {
              createFormLogin(this.options);
          }

          //change data device
          if(data.device){
              if(data.device.fb){
                  data.device.audience.name = data.device.fb.fbName;
                  data.device.audience.email = data.device.fb.email;
                  data.device.audience.gender = data.device.fb.gender;
              }
              if(data.device.google){
                  extend(data.device.audience, data.device.google);
              }
              let divName = document.getElementById('audience.name');
              if(divName){
                  if(data.device.fb){
                      divName.style['white-space'] = 'nowrap';
                      divName.style['position'] = 'relative';
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
      if(!this.options.mac && this.options.isCatfish && this.options.apRoute){
          util.ajax(
            { url: `http://${this.options.apRoute}/wifi/remote_mac` },
            (mac)=>{
                extend(this.options, {mac});
                extend(adMeta, {m: mac});
                loadAd();
            },
            ()=>loadAd(),
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
      let redirectUrl = `${protocol}//${restApiHost}${restApiRoot}/fb/login`;
      if (campaignMeta.fbAppDomain) {
        const restApiPort = restApiHost.split(':')[1];
        const fbHost = `${campaignMeta.fbAppDomain}${restApiPort
          ? `:${restApiPort}`
          : ''}`;
        redirectUrl = redirectUrl.replace(restApiHost, fbHost);
      }

      const loginFbParams = toQueryString({
        client_id: campaignMeta.fbAppId,
        scope: `email${campaignMeta.fbFeed === 'implicit'
          ? ',publish_actions'
          : ''}`,
        redirect_uri: redirectUrl,
        state: getData( false, Object.assign({}, {redirect: this.options.loginurl+'?redirect='+redirect, failRoute: window.location.href}, params))
      });
      console.log('redirect_uri', redirectUrl);
      window.location.href = `https://www.facebook.com/v2.9/dialog/oauth?${loginFbParams}`;
    };

    this.loginGoogle = (id, email, loginUrl, { success, error }) => {
      if (!campaignMeta.ggAppClientId) {
        throw new Error('Campaign has no Google ClientId provided');
      }
      if (!id || !email) throw new Error('Id and email must be provided');
      let mac = util.getMac(this.options.macFieldName) || this.options.macFieldName;
      let clickUrl = encodeURIComponent(this.urlFor('click', {m:mac, email: email, google: 'id||'+id+'||email||'+email}));
      util.ajax(
        {
            method: 'POST',
            url: loginUrl,
            data: 'redirect='+clickUrl+'&email='+email
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
  GN.version = VERSION;

  window.renderGoogleButton = function(){
      gapi.signin2.render('gg_signin2', {
        'width': 300,
        'longtitle': true,
        'theme': 'dark',
        'onsuccess': (googleUser)=>{
            let genexJslib = window.GN;
            let mac = util.getMac(genexJslib.options.macFieldName) || genexJslib.options.macFieldName;
            let id = googleUser.getAuthResponse().id_token,
                email = googleUser.getBasicProfile().getEmail(),
                fullName = googleUser.getBasicProfile().getName();
            let clickUrl = encodeURIComponent(genexJslib.urlFor('click', {m:mac, email: email, google: 'id||'+id+'||email||'+email+'||name||'+fullName}));
            console.log('post login loginViaEmail', genexJslib.options.loginViaEmail);
            util.ajax(
              {
                  method: 'POST',
                  url: genexJslib.options.loginurl || '/login',
                  data: genexJslib.options.loginViaEmail?'redirect='+clickUrl+'&email='+email:'redirect='+clickUrl //+"&email="+email
              },
              (res)=>{
                  let GoogleAuth = gapi.auth2.getAuthInstance();
                  GoogleAuth.signOut().then(()=>{
                      GoogleAuth.disconnect();
                      googleUser.disconnect();
                      document.write(res);
                  });
              },
              (error)=>{ console.log('errsend', err) }
            );
        },
        'onfailure': (error)=>{
            console.log('onFailure', error);
            location.reload();
        }
      });
  };

  window.getJsonFromUrl = function(){
      let query = location.search.substr(1);
      let result = {};
      decodeURIComponent(query).split('&').forEach(function(part) {
          let item = part.split('=');result[item[0]] = decodeURIComponent(item[1]);
      });
      return result;
  }

  window.GN = new GN();
  window.m = window.GN; //  For v2 compatibility
}(window, window.document));
