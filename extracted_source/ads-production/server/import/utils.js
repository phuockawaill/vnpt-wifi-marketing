const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

function getMethodArguments(model, methodName, methodIsStatic = true, args) {
  const sharedMethod = model.sharedClass.findMethodByName(methodName, methodIsStatic);
  if (sharedMethod) {
    const result = {};
    const acceptArgs = sharedMethod.accepts;
    acceptArgs.forEach((arg, index) => {
      if (typeof args[index] !== 'undefined') result[arg.arg] = args[index];
    });
    return result;
  }
  return {};
}

function generateCode(length) {
  let randomChar = '';
  const string = 'ABCDEFGHJKMLNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    randomChar += string.substr(Math.floor(Math.random() * string.length), 1);
  }
  return randomChar;
}

function standardizeMacAddress(mac) {
  if (!mac) return null;
  if (typeof mac === 'object') {
    mac = mac[0] || '';
  }
  mac = mac.replace(/-/g, ':').toUpperCase();
  if (mac.indexOf(':') === -1) {
    mac = mac.match(/[\s\S]{1,3}/g).join(':');
  }
  mac = mac.substr(0, 17);
  return mac;
}

function standardizeMacAddressCNA(mac) {
  if (!mac) return null;
  if (typeof mac === 'object') {
    mac = mac[0] || '';
  }
  mac = mac.replace(/[-.]/g, '').toUpperCase();
  if (mac.indexOf(':') === -1) {
    mac = mac.match(/[\s\S]{0,2}/g).join(':');
  }
  mac = mac.substr(0, 17);
  return mac;
}

function standardizeGender(gender) {
  if (!gender) {
    return 'other';
  }
  gender = gender.toLowerCase();
  if (gender !== 'male' && gender !== 'female') {
    return 'other';
  }
  return gender;
}

function standardizeAgeAndIncome(value) {
  if (!value) {
    return 'other';
  }
  return value
    .replace(/[\s]+/g, '')
    .replace(/-/g, '_to_')
    .replace(/</g, 'under_')
    .replace(/>/g, 'higher_')
    .replace(/^\$/, '_$');
}

function standardizeOs(os) {
  if (!os) {
    return 'other';
  } else if (os.match(/android/i)) {
    return 'android';
  } else if (os.match(/ios/i)) {
    return 'ios';
  } else if (os.match(/windows phone/i)) {
    return 'windows_phone';
  } else if (os.match(/windows/i)) {
    return 'windows';
  } else if (os.match(/(osx|os x|macos|mac os)/i)) {
    return 'mac';
  } else if (os.match(/(linux|ubuntu)/i)) {
    return 'linux';
  }
  return 'other';
}

function standardizeDevice(device) {
  if (!device) {
    return null;
  } else if (device.match(/mobile/i)) {
    return 'mobile';
  } else if (device.match(/tablet/i)) {
    return 'tablet';
  } else if (device.match(/(pc|laptop|desktop)/i)) {
    return 'pc';
  }
  return 'other';
}

function standardizeUsername(username) {
  if (!username) {
    return null;
  }
  return username
    .replace(/[\s]+/g, '_')
    .replace(/[^\w-]/g, '')
    .replace(/_+$/, '')
    .replace(/$_+/, '');
}

function standardizeURL(url) {
  if (!url) {
    return '';
  } else if (url.indexOf('http://') < 0 && url.indexOf('https://') < 0) {
    return `http://${url}`;
  }
  return url;
}

function standardizePhone(phone) {
  if (!phone) return null;
  phone = phone.replace(/^84/, '0');
  return phone;
}

const phoneCarriers = {
  Viettel: new RegExp(
    `^(${[
      '086',
      '096',
      '097',
      '098',
      '0162',
      '0163',
      '0164',
      '0165',
      '0166',
      '0167',
      '0168',
      '0169',
    ].join('|')})`,
  ),
  Mobifone: new RegExp(
    `^(${['089', '090', '093', '0120', '0121', '0122', '0126', '0128'].join(
      '|',
    )})`,
  ),
  Vinaphone: new RegExp(
    `^(${['088', '091', '094', '0123', '0124', '0125', '0127', '0129'].join(
      '|',
    )})`,
  ),
  Vietnamobile: new RegExp(`^(${['092', '0188', '0186'].join('|')})`),
  Gmobile: new RegExp(`^(${['099', '0199'].join('|')})`),
};
function phoneToCarrier(phone) {
  if (!phone) return null;
  phone = standardizePhone(phone);
  for (let i = 0; i < phoneCarriers.length; i += 1) {
    if (phoneCarriers[i].test(phone)) {
      return phoneCarriers[i];
    }
  }
  return null;
}

function extractDeviceOptions(ua) {
  const deviceOptions = { device: 'other', os: 'other' };
  if (!ua) {
    return deviceOptions;
  }
  if (ua.isMobile && !ua.isiPad) {
    deviceOptions.device = 'mobile';
  } else if (ua.isiPad || ua.isTablet) {
    deviceOptions.device = 'tablet';
  } else if (ua.isDesktop) {
    deviceOptions.device = 'pc';
  }
  if (ua.isAndroid) {
    deviceOptions.os = 'android';
  } else if (ua.isiPhone || ua.isiPad || ua.isiPod) {
    deviceOptions.os = 'ios';
  } else if (ua.isWindows && (ua.isMobile || ua.isTablet) || ua.isWindowsPhone) {
    deviceOptions.os = 'windows_phone';
  } else if (ua.isWindows) {
    deviceOptions.os = 'windows';
  } else if (ua.isMac) {
    deviceOptions.os = 'mac';
  } else if (ua.isLinux || ua.isLinux64) {
    deviceOptions.os = 'linux';
  } else if (ua.isChromeOS) {
    deviceOptions.os = 'chrome_os';
  }
  if (ua.isBot || ua.source.match(/LuaSocket/i)) {
    deviceOptions.shouldIgnore = true;
  }
  deviceOptions.browser = ua.browser;
  deviceOptions.browserVersion = ua.browserVersion;
  deviceOptions.platform = ua.platform;
  deviceOptions.osVersion = ua.os;
  deviceOptions.uaString = ua.source;
  return deviceOptions;
}

function sendEmail(to, subject, html) {
    // create reusable transport method (opens pool of SMTP connections)
    const smtpTransport = nodemailer.createTransport({
        host: 'smtp.gmail.com', // hostname 'smtp.zoho.com'
        secure: true, // use SSL
        port: 465, // port for secure SMTP
        auth: { user: 'info.genexwifi@gmail.com', pass: 'oklogin12345' } // { user: 'wifiex4u@wifiex4u.vn', pass: 'oklogin12345' }
    });
    // setup e-mail data with unicode symbols
    const mailOptions = {
        from: 'Genex WiFi Marketing Platform <info.genexwifi@gmail.com>', // sender address
        to, // list of receivers pthuan92@gmail.com
        bcc: 'pthuan92@gmail.com',
        subject, // Subject line
        html // html body
    }

    // send mail with defined transport object
    return new Promise((resolve, reject) => {
        smtpTransport.sendMail(mailOptions, (error, response) => {
            if (error) {
                reject('Email error');
                console.log(error);
            } else {
                resolve(`Message sent: ${response.message}`);
            }
            smtpTransport.close();
        });
    });
}

function sendMarketingEmail(from, to, subject, html){
    // create reusable transport method (opens pool of SMTP connections)
    let smtpTransport = nodemailer.createTransport("SMTP",{
        host: "smtp.zoho.com", // hostname
        secureConnection: true, // use SSL
        port: 465, // port for secure SMTP
        auth: { user: "wifiex4u@wifiex4u.vn", pass: "oklogin12345" }
    });
    // setup e-mail data with unicode symbols
    console.log(path.resolve(__dirname, '../Prudential_Finance_Dieu_khoan_vay_co_ban.pdf'));
    let mailOptions = {
        from: "Prudential Finance <wifiex4u@wifiex4u.vn>", // sender address
        to, // list of receivers pthuan92@gmail.com
        replyTo: from,
        bcc: 'pthuan92@gmail.com',
        subject, // Subject line
        html, // html body
        attachments: [
            {   // stream as an attachment
                filename: 'Prudential_Finance_Dieu_khoan_vay_co_ban.pdf',
                streamSource: fs.createReadStream(path.resolve(__dirname, '../Prudential_Finance_Dieu_khoan_vay_co_ban.pdf'))
            }
        ]
    }

    // send mail with defined transport object
    return new Promise(function(resolve, reject){
        smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
                reject('Email error');
                console.log(error);
            } else {
                resolve("Message sent: " + response.message);
            }
            smtpTransport.close();
        })
    });
}

module.exports = {
  getMethodArguments,
  standardizeMacAddress,
  standardizeMacAddressCNA,
  standardizeGender,
  standardizeAgeAndIncome,
  standardizeOs,
  standardizeDevice,
  standardizeUsername,
  standardizeURL,
  standardizePhone,
  phoneToCarrier,
  extractDeviceOptions,
  generateCode,
  sendEmail,
  sendMarketingEmail
};
