(function monkeyPatch(document) {
  CloudCmd.TITLE = 'File Manager';

  let alertEle;
  let alertTimeout;
  function showAlert(message, timeout) {
    if (!message) return;
    if (!timeout || isNaN(timeout)) timeout = 2000;

    if (alertEle && alertEle.parentNode) {
      alertEle.parentNode.removeChild(alertEle);
    }

    alertEle = document.createElement('div');
    alertEle.classList.add('alert');
    alertEle.innerText = message;
    document.body.appendChild(alertEle);

    clearTimeout(alertTimeout);
    alertTimeout = setTimeout(() => {
      alertEle.parentNode.removeChild(alertEle);
    }, 2000);
  }

  function getLIElement(element) {
    if (!element) return element;

    while (element && element.tagName !== 'LI') element = element.parentElement;

    return element;
  }

  function getSPANElement(element) {
    if (!element) return element;

    while (element && element.tagName !== 'SPAN') {
      element = element.parentElement;
    }

    return element;
  }

  function hasClass(element, cls) {
    return ` ${element.className} `.indexOf(` ${cls} `) > -1;
  }

  function onFilesDbClick(event) {
    const current = getLIElement(event.target);
    const isDir = DOM.isCurrentIsDir(current);
    // const path = DOM.getCurrentPath(current);

    if (!isDir) {
      CloudCmd.View.show();
    }
  }

  function onFilesClick(event) {
    const liEle = getLIElement(event.target);
    const current = getSPANElement(event.target);
    if (current === null || liEle === null) return;
    if (!hasClass(current, 'copy-url')) return;

    const copy = function (data) {
      const dummy = document.createElement('input');
      document.body.appendChild(dummy);
      dummy.setAttribute('id', 'dummy_id');
      dummy.setAttribute('value', data);
      dummy.select();
      document.execCommand('copy');
      document.body.removeChild(dummy);

      showAlert('Url copied to clipboard');
    };

    const encodedPath = encodeURI(DOM.getCurrentPath());
    let resourceUrl;
    if (DOM.isCurrentIsDir()) {
      const ext = DOM.getPackerExt(CloudCmd.config('packer'));
      resourceUrl = `${CloudCmd.HOST}${CloudCmd.PREFIX_URL}/pack${encodedPath}${ext}`;
    } else {
      resourceUrl =
        (CloudCmd.config('resourceUrl') || CloudCmd.HOST) +
        CloudCmd.config('resourcePath') +
        encodedPath;
    }

    copy(resourceUrl);
  }

  // Monkey patch loadDir, bind new dbclick and click event
  const loadDir = CloudCmd.loadDir;
  CloudCmd.loadDir = function (options, callback) {
    loadDir.call(CloudCmd, options, function () {
      const ul = document.querySelector('.panel-left ul.files');
      DOM.Events.add('dblclick', ul, onFilesDbClick);
      DOM.Events.addClick(ul, onFilesClick);

      if (typeof callback === 'function') {
        callback(...arguments);
      }
    });
  };

  // Custom menu command
  const menuNewFile = document.querySelector('[data-name="js-new-file"]');
  DOM.Events.addClick(menuNewFile, DOM.promptNewFile);

  const menuNewDir = document.querySelector('[data-name="js-new-directory"]');
  DOM.Events.addClick(menuNewDir, DOM.promptNewDir);

  const menuUpload = document.querySelector('[data-name="js-upload"]');
  DOM.Events.addClick(menuUpload, () => {
    if (typeof CloudCmd.Upload === 'function') {
      CloudCmd.Upload(() => {
        CloudCmd.Upload.show();
      });
    } else {
      CloudCmd.Upload.show();
    }
  });

  const menuUploadCloud = document.querySelector(
    '[data-name="js-upload-cloud"]',
  );
  DOM.Events.addClick(menuUploadCloud, () => {
    if (typeof CloudCmd.Cloud === 'function') {
      CloudCmd.Cloud(() => {
        CloudCmd.Cloud.saveFile();
      });
    } else {
      CloudCmd.Cloud.saveFile();
    }
  });

  // customize upload error
  const oldPut = DOM.load.put;
  DOM.load.put = function (url, body) {
    const excutePut = oldPut.call(this, url, body);
    excutePut.on('error', (error) => {
      DOM.Dialog.alert.call(null, 'Error', error.message);
      CloudCmd.refresh();
    });
    return excutePut;
  };

  // customize filepicker
  const oldloadJs = DOM.load.js;
  DOM.load.js = function (src, func) {
    console.log(src);

    oldloadJs.call(this, src, func);
    if (/\/plugins\.js$/.test(src)) {
      const oldCloud = CloudCmd.Cloud;

      CloudCmd.Cloud = function (callback) {
        oldCloud.call(this, () => {
          filepicker.pick = filepicker.pick.bind(filepicker, {
            services: ['URL', 'GOOGLE_DRIVE', 'DROPBOX', 'SKYDRIVE'],
            language: 'en',
          });
          callback();
        });
      };
    }
  };

  // disable config, console
  delete CloudCmd.Config;
  delete CloudCmd.Konsole;
}(window.document));
