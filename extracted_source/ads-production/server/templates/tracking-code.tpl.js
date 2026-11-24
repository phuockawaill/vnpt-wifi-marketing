/* global M */
(function renderCode(document, tagName, id) {
  const mAsyncInit = () => {
    M.init({
      locationId: '<%= locals.locationId %>',
      macFieldName: '<%= locals.macFieldName %>',
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
}(document, 'script', 'm-jssdk'));
// gn-jslib || m-jssdk
