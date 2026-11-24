/* global M */

(function renderCode(document, tagName, id) {
    if (window != window.top || new RegExp('<%= locals.hosts %>').test(window.location.hostname)) {
      return;
    };
  const mAsyncInit = () => {
    M.init({
      isCatfish: true,
      apRoute: '<%= locals.apRoute %>',
      locationId: '<%= locals.locationId %>',
      macFieldName: '<%= locals.macFieldName %>',
      meta: {
        ci: '<%= locals.campaignId %>'
      }
    });
    M.loadAd();
  };

  if (document.getElementById(id)) {
    return;
  }
  const fjs = document.getElementsByTagName(tagName)[0];
  const js = document.createElement(tagName);
  js.src = '<%= locals.adScriptUrl %>';
  js.id = id;
  js.onload = mAsyncInit;
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'gn-jslib'));
// gn-jslib || m-jssdk
