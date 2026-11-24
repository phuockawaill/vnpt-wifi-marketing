module.exports = function enableAuthentication(server) {
  // enable authentication
  server.enableAuth();
  server.use(
    server.loopback.token({
      model: server.models.accessToken,
      currentUserLiteral: 'me',
      searchDefaultTokenKeys: false,
      cookies: ['access_token'],
      headers: ['access_token', 'X-Access-Token'],
      params: ['access_token'],
    }),
  );
};
