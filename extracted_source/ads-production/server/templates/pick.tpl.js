/* global M */
/* eslint quotes:0 no-useless-escape:0 */

(function render() {
  function decodeHtml(html) {
    const e = document.createElement('div');
    e.innerHTML = html;
    return e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue;
  }
  let html = "<% var lines = locals.html.split('\n'); %>";
  html = ["<% for (var i = 0; i < lines.length; i++) { %>", "<%= lines[i] %><% } %>"].join('\n');
  const data = {
    html,
    adMeta: '<%= "" + JSON.stringify(locals.adMeta) %>',
    device: '<%= "" + JSON.stringify(locals.device) %>',
    campaignMeta: {
      ggAppClientId: '<%= locals.campaignMeta.ggAppClientId %>',
      ggEmailLogin: '<%= locals.campaignMeta.ggEmailLogin %>',
      fbAppId: '<%= locals.campaignMeta.fbAppId %>',
      fbAppDomain: '<%= locals.campaignMeta.fbAppDomain %>',
      fbFeed: '<%= locals.campaignMeta.fbFeed %>',
    },
  };

  let impressionUrls = "<% var urls = locals.campaignMeta.impressionUrls || []; %>";
  impressionUrls = [
    "<% for (var i = 0; i < urls.length; i++) { %>", "<%= urls[i] %><% } %>",
  ].filter(item => !!item).map(item => decodeHtml(item));

  try {
    data.html = decodeHtml(data.html);
    data.adMeta = JSON.parse(decodeHtml(data.adMeta));
    data.device = JSON.parse(decodeHtml(data.device));
    data.campaignMeta.impressionUrls = impressionUrls;
    M.setAd(data);
  } catch (e) {
    console.error(e);
  }
}());
