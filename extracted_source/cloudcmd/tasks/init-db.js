const Promise = require('bluebird');
const app = require('../server/server');

const ds = app.dataSources.main;

const migrateDB = () => {
  console.log('Recreating DB...');
  return Promise.promisify(ds.automigrate)
    .call(ds)
    .then(() => {
      console.log('Done!');
    })
    .catch((err) => {
      console.error('Failed!');
      console.error(err);
    });
};

const initNewData = () => {
  console.log('Reinitializing DB...');
  return app.models.user.create({
    username: 'superadmin',
    password: 'p@ssw0rd',
    email: 'superadmin@resource.com',
    rootdir: '/',
    type: 1,
  }).then(() => {
    console.log('Done!');
  })
  .catch((err) => {
    console.error('Failed!');
    console.error(err);
  });
};

function run() {
  migrateDB()
    .then(initNewData)
    .then(() => process.exit(0))
    .catch(() => process.exit(0));
}

setTimeout(run, 1000);
