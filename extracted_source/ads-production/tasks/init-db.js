import inquirer from 'inquirer';
import Promise from 'bluebird';
import selectOptions from './seed/select_options';
import authentication from './seed/authentication';
import templateBase from './seed/template-base';
import mailTemplateBase from './seed/mail-template';

const app = require('../server/server');

const migrateDB = () => new Promise((resolve, reject) => {
  console.log('Recreating DB...');
  app.dataSources.mongo.automigrate(err => (err ? reject(err) : resolve()));
}).then(() => console.log('Done!'));

const initNewData = () => {
  console.log('Reinitializing DB...');
  return selectOptions(app)
    .then(() => authentication(app))
    .then(() => templateBase(app))
    .then(() => mailTemplateBase(app))
    .then(() => {
      console.log('Done!');
    });
};

const dbSettings = app.dataSources.mongo.settings;
const confirmDbQuestion = `DB Connection: ${dbSettings.host}:${dbSettings.port}/${dbSettings.database}. Enter DB password to confirm:`;

setTimeout(() => {
  console.log('!!! WARNING. PLEASE CONFIRM YOUR DB CONNECTION BEFORE MIGRATE !!!');
  inquirer
    .prompt([{
      type: 'password',
      name: 'password',
      message: confirmDbQuestion,
      validate: input => (input === dbSettings.password),
    }])
    .then(migrateDB)
    .then(initNewData)
    .then(() => process.exit(0));
}, 1000);
