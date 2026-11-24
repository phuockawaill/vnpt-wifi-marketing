const allowCrossOrigin = (res, origin = '*') => {
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'POST, GET, HEAD');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('X-Frame-Options', 'ALLOWALL');
};

module.exports = {
  allowCrossOrigin,
};
