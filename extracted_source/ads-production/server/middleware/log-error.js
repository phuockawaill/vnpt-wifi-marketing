module.exports = () => { 
   return function logError(err, req, res, next) { 
      if (err && req.method === 'GET') {
         console.log('ERR', req.url, JSON.stringify(err));
         res.status(404);
         res.send('Request not found. Please contact Administrator');
      }
      if (err) console.log('ERR', JSON.stringify(err))
      next();
   };
};
