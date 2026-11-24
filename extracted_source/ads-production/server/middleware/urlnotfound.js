module.exports = function () {
  return function logError(req, res) {
    console.log('ERR URL:', req.ip, req.url, req.body, req.query, req.params);
    res.status(404);
    res.send('Not found!');
  };
};
