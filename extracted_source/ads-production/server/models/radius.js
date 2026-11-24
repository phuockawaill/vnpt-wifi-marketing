const lodash = require('lodash');
const { auth: errors } = require('../lib/errors');
const radclient = require('../lib/radclient');

const debug = require('debug')('app:model:Radius');
const error = require('debug')('err:model:Radius');

function ip2long(ip){
    var components = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if(components){
        var iplong = 0;
        var power  = 1;
        for(var i=4; i>=1; i-=1){
            iplong += power * parseInt(components[i]);
            power  *= 256;
        }
        return iplong;
    } else {
        return -1;
    }
}
function inSubNet(ip, subnet){
    var mask = subnet.match(/^(.*?)\/(\d{1,2})$/);
    var base_ip = ip2long(mask[1]);
    var long_ip = ip2long(ip);
    if(mask && (base_ip >= 0) )
    {
        var freedom = Math.pow(2, 32 - parseInt(mask[2]));
        return (long_ip > base_ip) && (long_ip < base_ip + freedom - 1);
    }
    else return false;
}

function extendModel(Radius) {
  const getIdentifier = () => Math.floor(Math.random() * 254) + 1;

  async function authWithServer(serverInfo, { ipAddr, username, password }) {
    debug('authen with server %o', serverInfo);
    const packet = {
      code: 'Access-Request',
      secret: serverInfo.secret,
      identifier: getIdentifier(),
      attributes: [['User-Name', username], ['User-Password', password]],
    };
    if (ipAddr) {
      packet.attributes.push(['NAS-IP-Address', ipAddr]);
    }

    const options = {
      host: serverInfo.host,
      port: serverInfo.port,
      timeout: 3000,
      retries: 3,
    };

    let response;
    try {
      response = await radclient(packet, options);
    } catch (err) {
      error(err);
      return Promise.resolve({
        status: false,
        connected: false,
        error: err,
      });
    }

    if (!response) {
      return Promise.resolve({
        status: false,
        connected: false,
        error: 'RAD_EMPTY_RESPONSE',
      });
    }

    if (response.code !== 'Access-Accept') {
      return Promise.resolve({
        status: false,
        connected: true,
        error: {
          code: errors.CREDENTIALS_NOT_VALID,
        },
      });
    }

    response.status = true;
    response.connected = true;
    return response;
  }

  async function auth(username, password, ipAddr, req) {
      console.log('auth', req.connection._peername);// { address: '117.2.18.147', family: 'IPv4', port: 55343 }
    debug('login credentials: %s - %s - %s', username, password, ipAddr);

    if (!username) {
      return Promise.reject({
        statusCode: 400,
        code: errors.USERNAME_NOT_PRESENT,
      });
    }
    if (!password) {
      return Promise.reject({
        statusCode: 400,
        code: errors.PASSWORD_NOT_PRESENT,
      });
    }

    const authInfo = {
      username,
      password,
      ipAddr,
    };
    const [mainConfig, secondConfig] = await Radius.find({ order: 'name ASC' });

    let response;
    if (mainConfig) {
      response = await authWithServer(mainConfig.config, authInfo);
    }
    if (response && !response.status && secondConfig) {
      error('auth failed');
      error(response);
      response = await authWithServer(secondConfig.config, authInfo);
    }

    if (response && !response.status) {
      error('auth failed');
      error(response);
      const err = Object.assign({ statusCode: 400 }, response.error);
      return Promise.reject(err);
    }

    if (!response) {
      return Promise.reject({
        statusCode: 400,
        code: errors.RAD_NO_CONFIG,
      });
    }

    const planCode = lodash.get(response, 'attributes["Reply-Message"]');
    debug('plan code', planCode);
    if (!planCode) return Promise.resolve({});

    const Plan = Radius.app.models.Plan;
    const plan = await Plan.findOne({ where: { code: planCode } });

    if (!plan) return Promise.resolve({});
    return plan.toAttributes();
  }

  async function test(host, port, secret, username, password, ipAddr) {
    if (!host || !secret) {
      return Promise.reject({
        statusCode: 400,
        code: 'INVALID_REQUEST',
      });
    }

    const response = await authWithServer(
      { host, port, secret },
      { ipAddr, username, password },
    );

    const result = { status: response.status, connected: response.connected };
    if (response.attributes) {
      Object.keys(response.attributes).forEach((attr) => {
        if (typeof response.attributes[attr] !== 'string') return;
        lodash.set(result, `attributes["${attr}"]`, response.attributes[attr]);
      });
    }
    if (response.error) {
      result.error = response.error;
    }
    return result;
  }

  async function connect(secret, req) {
      console.log('connect', req.connection._peername);
      const Clients = Radius.app.models.Clients;
      const authInfo = {
        username: 'anonymous',
        password: 'anonymous',
        ipAddr: '10.10.10.10',
      };
      const [hgClients] = await Clients.find({});
      let findHg = null;
      hgClients.config.forEach((item)=>{
          console.log(item);
          if(item.secret === secret) findHg = item;
      });

      let response, pass = false;
      if(findHg){
          if(findHg.hostType === 'any'){
              pass = true;
          } else if(findHg.hostType === 'custom'){
              if(findHg.host === req.connection._peername.address){
                  pass = true;
              }
          } else if(findHg.hostType === 'subnet') {
              console.log('subnet', findHg);
              pass = inSubNet(req.connection._peername.address, findHg.subnet+'/'+findHg.netmask);
          } else {//range
              pass = ip2long(req.connection._peername.address) > ip2long(findHg.fromIp) && ip2long(req.connection._peername.address) < ip2long(findHg.toIp);
          }
          console.log('findHg', findHg);
      }
      if(pass){
          const [mainConfig, secondConfig] = await Radius.find({ order: 'name ASC' });
          console.log('find Config');
          if (mainConfig) {
            response = await authWithServer(mainConfig.config, authInfo);
          }

            if (response && !response.connected && secondConfig) {
              error('auth failed');
              error(response);
              response = await authWithServer(secondConfig.config, authInfo);
            }
            if (response && !response.connected) {
              error('auth failed');
              error(response);
              const err = Object.assign({ statusCode: 400 }, response.error);
              return Promise.reject(err);
            }
            return response;
      } else {
          error('auth failed');
          error(response);
          const err = Object.assign({ statusCode: 400 }, response.error);
          return Promise.reject(err);
      }
  }

  Object.assign(Radius, {
    auth,
    connect,
    test,
  });

  const authParams = [
    {
      arg: 'username',
      type: 'string',
      required: true,
    },
    {
      arg: 'password',
      type: 'string',
      required: true,
    },
    {
      arg: 'ipAddr',
      type: 'string',
    },
    { arg: 'req', type: 'object', http: { source: 'req' } },
  ];
  Radius.remoteMethod('auth', {
    accepts: authParams,
    returns: {
      arg: 'attributes',
      type: 'object',
      root: true,
    },
  });
  Radius.remoteMethod('connect', {
    accepts: [
      {
        arg: 'secret',
        type: 'string',
      },
      { arg: 'req', type: 'object', http: { source: 'req' } },
    ],
    returns: {
      arg: 'attributes',
      type: 'object',
      root: true,
    },
  });
  Radius.remoteMethod('test', {
    accepts: [
      {
        arg: 'host',
        type: 'string',
        required: true,
      },
      {
        arg: 'port',
        type: 'number',
        required: true,
      },
      {
        arg: 'secret',
        type: 'string',
        required: true,
      },
      ...authParams,
    ],
    returns: {
      arg: 'attributes',
      type: 'object',
      root: true,
    },
  });
}

module.exports = extendModel;
