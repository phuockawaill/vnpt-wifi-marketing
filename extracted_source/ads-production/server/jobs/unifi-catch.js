const http = require('http');
const url = require('url');

console.log('start app');
http.createServer((req, res) => {
  console.log('listen unifi', req.url, req.signedCookies, req.cookies);
    const host = req.headers.host.split(':')[0];
    const vars = req.url.split('/');
    const params = url.parse(req.url, true).query;
    if (req.url.indexOf('guest/s')) {
        const sendParams = {
            ap: params.ap,
            mac: params.id,
            siteId: vars[3]
        };
        console.log('unifi', `http://${host}:9080/api/common/unifiSplash${req.url}`);
      res.writeHead(302, {
          'Content-Type': 'text/plain',
          Location: `http://${host}:9080/api/common/unifiSplash${req.url}`
      });
  } else {
      res.write(200);
  }
  // res.write('Hello World!');
  res.end();
}).listen(8880, '0.0.0.0');

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
