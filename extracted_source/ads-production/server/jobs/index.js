/* eslint global-require: 0, import/no-dynamic-require: 0 */

const Agenda = require('agenda');
const lodash = require('lodash');
const path = require('path');

const debug = require('debug')('app:job:index');
const error = require('debug')('err:job:index');
const app = require('../server');

const buildMongoUrl = config =>
  [
    `mongodb://${config.user}`,
    `${config.password}@${config.host}`,
    `${config.port}/${config.database}`,
  ].join(':');

app.dataSources.mongo.automigrate(['agendaJobs'], (migrateErr) => {
  if (migrateErr) {
    error({ migrateErr }, 'Recreate agendaJobs table failed');
  }

  const mongoUrl = lodash.get(
    app,
    'datasources.mongo.settings.url',
    buildMongoUrl(app.datasources.mongo.settings),
  );
  console.log('mongoUrl jobs: ', mongoUrl);
  const agenda = new Agenda({
    //db: { address: mongoUrl },
    db: { address: `${mongoUrl}?authSource=admin` },
    processEvery: '10 seconds',
  });
  agenda.on('ready', () => {
    const jobs = app.get('jobs');
    console.log(jobs);
    Object.keys(jobs).forEach((job) => {
      if (!jobs[job]) {
        return; // Disabled
      }
      try {
        const jobTask = require(path.resolve(__dirname, job));
        debug('register job %s', job);
        agenda.define(
          job,
          { concurrency: 1, priority: 'normal', lockLifetime: 300 },
          jobTask(app),
        );
        agenda.every(jobs[job], job);
        debug('registered job %s, run each %s', job, jobs[job]);
      } catch (err) {
        error('register job %s failed', job);
        error(err);
      }
    });

    // Start
    agenda.start();
  });
});
