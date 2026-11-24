const useragent = require('useragent');

const BOTS = [
  '\\+https:\\/\\/developers.google.com\\/\\+\\/web\\/snippet\\/',
  'googlebot',
  'baiduspider',
  'gurujibot',
  'yandexbot',
  'slurp',
  'msnbot',
  'bingbot',
  'facebookexternalhit',
  'linkedinbot',
  'twitterbot',
  'slackbot',
  'telegrambot',
  'applebot',
  'pingdom',
  'tumblr ',
];
const IS_BOT_REGEXP = new RegExp(`^.*(${BOTS.join('|')}).*$`);

const testBot = (uaString) => {
  uaString = (uaString || '').toLowerCase();
  const isBot = IS_BOT_REGEXP.exec(uaString);
  if (isBot) {
    return isBot[1];
  }
  return false;
};

const os = (osString) => {
  osString = (osString || '').toLowerCase();
  const details = {
    isAndroid: false,
    isiPhone: false,
    isiPad: false,
    isiPod: false,
    isiOS: false,
    isMac: false,
    isWindows: false,
    isWindowsPhone: false,
    isLinux: false,
    isChromeOS: false,
  };

  if (osString.indexOf('android') > -1) {
    details.isAndroid = true;
  } else if (osString.indexOf('ios') > -1) {
    details.isiOS = true;

    if (osString.indexOf('iphone') > -1) {
      details.isiPhone = true;
    } else if (osString.indexOf('ipad') > -1) {
      details.isiPad = true;
    } else if (osString.indexOf('ipod') > -1) {
      details.isipod = true;
    }
  } else if (osString.indexOf('mac') > -1 || osString.indexOf('os x') > -1) {
    details.isMac = true;
  } else if (osString.indexOf('windows phone') > -1) {
    details.isWindowsPhone = true;
  } else if (osString.indexOf('windows') > -1) {
    details.isWindows = true;
  } else if (osString.indexOf('linux') > -1) {
    details.isLinux = true;
  } else if (osString.indexOf('chrome') > -1) {
    details.isChromeOS = true;
  }

  return details;
};

const device = (uaString) => {
  uaString = (uaString || '').toLowerCase();

  const details = {
    isMobile: false,
    isDesktop: false,
    isTablet: false,
    isBot: false,
  };

  if (testBot(uaString)) {
    details.isBot = true;
  }
  if (uaString.indexOf('ipad') > -1 || uaString.indexOf('tablet') > -1) {
    details.isTablet = true;
  } else if (uaString.indexOf('mobi') > -1) {
    details.isMobile = true;
  } else {
    details.isDesktop = true;
  }

  return details;
};

const parse = (uaString) => {
  uaString = uaString || '';
  const ua = useragent.parse(uaString);
  const osInfo = os(`${ua.device.family} ${ua.os.family}`);
  const deviceInfo = device(uaString);

  return Object.assign(osInfo, deviceInfo, {
    browser: ua.family,
    browserVersion: ua.toVersion(),
    platform: ua.device.family,
    os: ua.os.family,
    osVersion: ua.os.toVersion(),
    source: uaString,
  });
};

module.exports = {
  parse,
};
